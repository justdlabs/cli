import { spawn } from "node:child_process"
import ora from "ora"

import http from "node:http"
import type { ParsedUrlQuery } from "node:querystring"

import { nanoid } from "nanoid"

import { listen } from "async-listen"

export const addBlock = async () => {}

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
  const confirmationUrl = new URL(`${process.env.CLIENT_URL}/auth/devices`)
  confirmationUrl.searchParams.append("code", code)
  confirmationUrl.searchParams.append("redirect", redirect)
  console.log(`Confirmation code: ${pc.bold(code)}\n`)
  console.log(
    `If something goes wrong, copy and paste this URL into your browser: ${pc.bold(
      confirmationUrl.toString(),
    )}\n`,
  )
  spawn("open", [confirmationUrl.toString()])
  const spinner = ora("Waiting for authentication...\n\n")

  try {
    spinner.start()
    const authData = await authPromise
    spinner.stop()
    writeToConfigFile(authData)
    console.log(
      `Authentication successful: wrote key to config file. To view it, type 'cat ~/${FILENAME}'.\n`,
    )
    server.close()
    process.exit(0)
  } catch (error) {
    if (error instanceof UserCancellationError) {
      console.log("Authentication cancelled.\n")
      server.close()
      process.exit(0)
    } else {
      console.error("Authentication failed:", error)
      console.log("\n")
      server.close()
      process.exit(1)
    }
  } finally {
    server.close()
    process.exit(0)
  }
}
