import { spawn } from "node:child_process"
import ora from "ora"

import fs from "node:fs"
import http from "node:http"

import type { ParsedUrlQuery } from "node:querystring"
import url from "node:url"

import { customAlphabet } from "nanoid"

import path from "node:path"
import { writeCodeFile } from "@/utils"
import { configManager } from "@/utils/config"
import { getPackageManager } from "@/utils/get-package-manager"
import { possibilityRoutePath } from "@/utils/helpers"
import { error, errorText, highlight, warningText } from "@/utils/logging"
import { type } from "arktype"
import { listen } from "async-listen"
import chalk from "chalk"
import { readUser, updateUser } from "rc9"
import { add } from "./add"

export const FILENAME = ".justd"
const DOMAIN = "https://blocks.getjustd.com"

class UserCancellationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserCancellationError"
  }
}

const nanoid = customAlphabet("123456789QAZWSXEDCRFVTGBYHNUJMIKOLP", 8)

const FileType = type({
  name: "string",
  content: "string",
})

const BlockCode = type({
  name: "string",
  files: FileType.array(),
  type: "string",
  componentPath: "string",
})

const blockType = type({
  title: "string",
  slug: "string",
  preview: "string",
  meta: {
    "packages?": "string[]",
    ui: {
      "[string]": "string",
    },
  },
  blockCode: BlockCode.array(),
})

export const addBlock = async ({ slugs }: { slugs: string[] }) => {
  if (slugs.length !== 3) {
    console.info(errorText("Please provide three slugs."))

    process.exit(1)
  }

  const userConfig = readUser(FILENAME)

  if (!(await configManager.doesConfigExist())) {
    console.info(errorText("Config file not found. Please run the init command first."))
    process.exit(1)
  }

  const config = await configManager.loadConfig()

  if (!userConfig.key) {
    console.info(warningText("No API key found. Please login first."))
    process.exit(1)
  }

  const res = await fetch(`${DOMAIN}/api/blocks/${slugs.join("/")}`, {
    headers: {
      "x-api-key": userConfig.key,
    },
  })

  if (!res.ok) {
    console.info(warningText(await res.text()))
    process.exit(1)
  }

  const json = blockType(await res.json())

  if (json instanceof type.errors) {
    console.info(warningText(json.summary))
    process.exit(1)
  }

  await add({
    components: Object.keys(json.meta.ui).map((key) => key.replace(".tsx", "")),
    successMessage: "Required components added.",
    overwrite: true,
    prioritize: "block",
  })

  const packageManager = await getPackageManager()
  const action = packageManager === "npm" ? "i " : "add "

  if (json.meta.packages && json.meta.packages?.length === 0) {
    const installCommand = `${packageManager} ${action} ${json.meta.packages.join(" ")} --silent`
    const child = spawn(installCommand, {
      stdio: "ignore",
      shell: true,
    })

    await new Promise<void>((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) {
          resolve()
        } else {
          error(`Failed to install ${highlight(json.meta.packages!.join(" "))}. Exit code: ${code}`)
          reject(
            new Error(
              `Installation failed for ${highlight(json.meta.packages!.join(" "))} with code ${code}`,
            ),
          )
        }
      })

      child.on("error", (err) => {
        error(`Error while executing: ${highlight(installCommand)}`)
        reject(err)
      })
    })
  }

  for (const block of json.blockCode) {
    for (const file of block.files) {
      const filePath = path.join(
        process.cwd(),
        `${possibilityRoutePath()}/${slugs[0]}-${slugs[1]}-${slugs[2]}`,
        file.name,
      )

      if (fs.existsSync(filePath)) {
        console.info(errorText(`File already exists: ${filePath}`))
        process.exit(1)
      }

      await writeCodeFile(config, {
        writePath: filePath,
        ogFilename: file.name,
        content: file.content,
      })

      console.info(`File created: ${filePath}`)
    }
  }
}

export const loginBlock = async () => {
  const server = http.createServer()
  const { port } = await listen(server, 0, "127.0.0.1")

  // set up HTTP server that waits for a request containing an API key
  // as the only query parameter
  const authPromise = new Promise<ParsedUrlQuery>((resolve, reject) => {
    server.on("request", (req, res) => {
      // Set CORS headers for all responses
      res.setHeader("Access-Control-Allow-Origin", "*")
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

      if (req.method === "OPTIONS") {
        res.writeHead(200)
        res.end()
      } else if (req.method === "GET") {
        const parsedUrl = url.parse(req.url as string, true)
        const queryParams = parsedUrl.query
        if (queryParams.cancelled) {
          res.writeHead(200)
          res.end()
          reject(new UserCancellationError("Login process cancelled by user."))
        } else {
          res.writeHead(200)
          res.end()
          resolve(queryParams)
        }
      } else {
        res.writeHead(405)
        res.end()
      }
    })
  })

  const redirect = `http://127.0.0.1:${port}`

  const code = nanoid()
  const confirmationUrl = new URL(`${DOMAIN}/auth/devices`)
  confirmationUrl.searchParams.append("code", code)
  confirmationUrl.searchParams.append("redirect", redirect)
  console.info(`Confirmation code: ${chalk.bold(code)}\n`)
  console.info(
    `If something goes wrong, copy and paste this URL into your browser: ${chalk.bold(
      confirmationUrl.toString(),
    )}\n`,
  )
  spawn("open", [confirmationUrl.toString()])
  const spinner = ora("Waiting for authentication...\n\n")

  try {
    spinner.start()
    const authData = await authPromise
    spinner.stop()
    updateUser(authData, FILENAME)
    console.info(
      `Authentication successful: wrote key to userConfig file. To view it, type 'cat ~/${FILENAME}'.\n`,
    )
    server.close()
    process.exit(0)
  } catch (error) {
    if (error instanceof UserCancellationError) {
      console.info("Authentication cancelled.\n")
      server.close()
      process.exit(0)
    } else {
      console.error("Authentication failed:", error)
      console.info("\n")
      server.close()
      process.exit(1)
    }
  } finally {
    server.close()
    process.exit(0)
  }
}
