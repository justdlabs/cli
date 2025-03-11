import fs, { writeFileSync } from "node:fs"
import { input, select } from "@inquirer/prompts"

import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { changeGray } from "@/commands/change-gray"
import { startNewProject } from "@/commands/start-new-project"
import { addUiPathToLangConfig, writeCodeFile } from "@/utils"
import { type ConfigInput, configManager } from "@/utils/config"
import { getPackageManager } from "@/utils/get-package-manager"
import { isRepoDirty } from "@/utils/git"
import {
  doesProjectExist,
  getCorrectFileExtension,
  hasFolder,
  isLaravel,
  isNextJs,
  isRemix,
  isTailwind,
  isTailwindInstalled,
  isTypescriptProject,
  possibilityComponentsPath,
  possibilityCssPath,
  possibilityUtilsPath,
} from "@/utils/helpers"
import { error, grayText, highlight, info } from "@/utils/logging"
import { getRepoUrlForComponent } from "@/utils/repo"
import ora from "ora"
import stripJsonComments from "strip-json-comments"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const stubs = path.resolve(__dirname, "../src/resources/stubs")

export async function init(flags: {
  force?: boolean
  yes?: boolean
  language?: "typescript" | "javascript"
}) {
  let language = flags.language
  if (!doesProjectExist()) {
    const shouldStartNewProject = await input({
      message: `No setup project detected. Do you want to start a new project? (Y/${grayText("n")})`,
      default: "Yes",
      validate: (value) => {
        const normalizedValue = value.trim().toLowerCase()
        return ["y", "n", "yes", "no"].includes(normalizedValue) || "Please answer yes or no."
      },
    })

    const normalizedValue = shouldStartNewProject.trim().toLowerCase()
    if (
      normalizedValue === "y" ||
      normalizedValue === "yes" ||
      normalizedValue === "n" ||
      normalizedValue === "no"
    ) {
      language = await select({
        message: "What language do you want to use?",
        choices: [
          { name: "Typescript", value: "typescript" },
          { name: "Javascript", value: "javascript" },
        ],
        default: "typescript",
      })

      await startNewProject(normalizedValue as "y" | "n" | "yes" | "no", language)
      return
    }
  }

  if (!language) {
    language = isTypescriptProject() ? "typescript" : "javascript"
  }
  if (!flags.force) {
    const checkingGit = ora("Checking.").start()
    if (isRepoDirty()) {
      checkingGit.stop()
      error(
        "Git directory is not clean. Please stash or commit your changes before running the init command.",
      )
      info(
        `You may use the ${highlight("--force")} flag to silence this warning and perform the initialization anyway.`,
      )
      process.exit(1)
    }
    checkingGit.stop()
  }

  const spinner = ora("Initializing.").start()
  const twExists = isTailwindInstalled()
  if (!twExists) {
    spinner.fail(
      "The tailwindcss package is not installed. Please install before running the init command.",
    )
    spinner.stop()
    return
  }
  setTimeout(() => {
    spinner.color = "yellow"
    spinner.text = "Loading rainbows"
  }, 1000)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  let componentFolder: string
  let twConfigStub: string
  let uiFolder: string
  let cssLocation: string
  let themeProvider: string
  let providers: string
  let utilsFolder: string
  spinner.succeed("Initializing.")

  if (flags.yes) {
    componentFolder = possibilityComponentsPath()
    uiFolder = path.join(componentFolder, "ui")
    utilsFolder = possibilityUtilsPath()
    cssLocation = possibilityCssPath()
  } else {
    componentFolder = await input({
      message: "Components folder:",
      default: possibilityComponentsPath(),
      validate: (value) =>
        value.trim() !== "" || "Path cannot be empty. Please enter a valid path.",
    })

    uiFolder = path.join(componentFolder, "ui")

    utilsFolder = await input({
      message: "Utils folder:",
      default: possibilityUtilsPath(),
      validate: (value) =>
        value.trim() !== "" || "Path cannot be empty. Please enter a valid path.",
    })

    cssLocation = await input({
      message: "Where would you like to place the CSS file?",
      default: possibilityCssPath(),
      validate: (value) =>
        value.trim() !== "" || "Path cannot be empty. Please enter a valid path.",
    })
  }

  const lang = language === "typescript" ? "ts" : "js"
  if (isNextJs() && hasFolder("src")) {
    twConfigStub = path.join(stubs, "1.x/tailwind.config.src.next.stub")
    themeProvider = path.join(stubs, `next/${lang}/theme-provider.stub`)
    providers = path.join(stubs, `next/${lang}/providers.stub`)
  } else if (isNextJs() && !hasFolder("src")) {
    twConfigStub = path.join(stubs, "1.x/tailwind.config.next.stub")
    themeProvider = path.join(stubs, `next/${lang}/theme-provider.stub`)
    providers = path.join(stubs, `next/${lang}/providers.stub`)
  } else if (isLaravel()) {
    twConfigStub = path.join(stubs, "1.x/tailwind.config.laravel.stub")
    themeProvider = path.join(stubs, `laravel/${lang}/theme-provider.stub`)
    providers = path.join(stubs, `laravel/${lang}/providers.stub`)
  } else if (isRemix()) {
    twConfigStub = path.join(stubs, "1.x/tailwind.config.vite.stub")
    themeProvider = path.join(stubs, `remix/${lang}/theme-provider.stub`)
    providers = path.join(stubs, `remix/${lang}/providers.stub`)
  } else {
    twConfigStub = path.join(stubs, "1.x/tailwind.config.vite.stub")
    themeProvider = path.join(stubs, `laravel/${lang}/theme-provider.stub`)
    providers = path.join(stubs, `laravel/${lang}/providers.stub`)
  }

  if (isTailwind(3)) {
    const tailwindConfigTarget = fs.existsSync("tailwind.config.js")
      ? "tailwind.config.js"
      : "tailwind.config.ts"
    try {
      const tailwindConfigContent = fs.readFileSync(twConfigStub, "utf8")
      fs.writeFileSync(tailwindConfigTarget, tailwindConfigContent, { flag: "w" })
    } catch (error) {
      // @ts-ignore
      spinner.fail(`Failed to write Tailwind config to ${tailwindConfigTarget}: ${error.message}`)
    }
  }

  if (!fs.existsSync(utilsFolder)) {
    fs.mkdirSync(utilsFolder, { recursive: true })
  }

  if (!fs.existsSync(uiFolder)) {
    fs.mkdirSync(uiFolder, { recursive: true })
  }

  async function getUserAlias(): Promise<string> {
    const isTypescript = language === "typescript"
    const configFilePaths = isTypescript
      ? [path.join(process.cwd(), "tsconfig.app.json"), path.join(process.cwd(), "tsconfig.json")]
      : [path.join(process.cwd(), "jsconfig.json")]

    const configFilePath = configFilePaths.find((configPath) => fs.existsSync(configPath))
    if (!configFilePath) {
      console.error(
        isTypescript
          ? "Neither tsconfig.app.json nor tsconfig.json was found."
          : "jsconfig.json was not found.",
      )
      process.exit(1)
    }

    let config: any
    try {
      const configRaw = fs.readFileSync(configFilePath, "utf8")
      const stripped = stripJsonComments(configRaw)
      config = JSON.parse(stripped)
    } catch {
      console.error(
        `Error reading ${configFilePath} file. Please check if it exists and is valid JSON.`,
      )
      process.exit(1)
    }

    if (!config.compilerOptions) {
      config.compilerOptions = {}
    }

    if (!("paths" in config.compilerOptions)) {
      const rootPath = "./src"
      config.compilerOptions.paths = {
        "@/*": [`${rootPath}/*`],
      }

      const spinner = ora(`Updating ${path.basename(configFilePath)} with paths...`).start()
      try {
        const updatedConfig = JSON.stringify(config, null, 2)
        fs.writeFileSync(configFilePath, updatedConfig)
        spinner.succeed(`Paths added to ${path.basename(configFilePath)}.`)
      } catch (e) {
        spinner.fail(`Failed to write to ${path.basename(configFilePath)}.`)
        process.exit(1)
      }
    }

    await addUiPathToLangConfig(isTypescript ? "typescript" : "javascript")

    const paths = config.compilerOptions.paths
    if (paths) {
      const firstAliasKey = Object.keys(paths)[0]
      return firstAliasKey.replace("/*", "")
    }

    process.exit(1)
  }

  const currentAlias = await getUserAlias()

  if (isTailwind(3)) {
    const content = fs.readFileSync(path.join(stubs, "1.x/zinc.css"), "utf8")
    writeFileSync(cssLocation, content, { flag: "w" })
  }
  const selectedGray = isTailwind(3) ? "zinc.css" : await changeGray(cssLocation, flags)

  const config: ConfigInput = {
    ui: uiFolder,
    utils: utilsFolder,
    gray: selectedGray?.replace(".css", "")!,
    css: cssLocation,
    alias: currentAlias || undefined,
    language,
  }

  const packageManager = await getPackageManager()

  const mainPackages = [
    "react-aria-components",
    "tailwindcss-react-aria-components",
    "justd-icons",
  ].join(" ")

  let devPackages = ["tailwind-variants", "tailwind-merge", "clsx", "tailwindcss-animate"].join(" ")

  if (isNextJs()) {
    devPackages += " next-themes"
  }

  if (isRemix()) {
    devPackages += " remix-themes"
  }

  const createdConfig = await configManager.createConfig(config).catch((error) => {
    // @ts-ignore
    error("Error writing to justd.json:", error?.message)
    process.exit(1)
  })

  const action = packageManager === "npm" ? "i" : "add"
  const installCommand = `${packageManager} ${action} ${mainPackages} && ${packageManager} ${action} -D ${devPackages}  --silent`
  spinner.start("Installing dependencies.")

  const child = spawn(installCommand, {
    stdio: ["ignore", "ignore", "ignore"],
    shell: true,
  })

  await new Promise<void>((resolve) => {
    child.on("close", () => {
      resolve()
    })
  })

  const fileUrl = getRepoUrlForComponent("primitive", "justd")
  const response = await fetch(fileUrl)

  if (!response.ok) throw new Error(`Failed to fetch component: ${response.statusText}`)

  const fileContent = await response.text()

  await writeCodeFile(createdConfig, {
    writePath: path.join(uiFolder, "primitive.tsx"),
    ogFilename: "primitive.tsx",
    content: fileContent,
  })

  fs.writeFileSync(
    path.join(uiFolder, getCorrectFileExtension(language, "index.ts")),
    `export * from './primitive';`,
    { flag: "w" },
  )

  if (themeProvider) {
    const themeProviderContent = fs.readFileSync(themeProvider, "utf8")

    await writeCodeFile(createdConfig, {
      ogFilename: "theme-provider.tsx",
      writePath: path.join(componentFolder, "theme-provider.tsx"),
      content: themeProviderContent,
    })

    if (providers) {
      const providersContent = fs.readFileSync(providers, "utf8")

      await writeCodeFile(createdConfig, {
        ogFilename: "providers.tsx",
        writePath: path.join(componentFolder, "providers.tsx"),
        content: providersContent,
      })
    }
  }

  spinner.succeed("Installing dependencies.")
  spinner.start("Configuring.")
  await new Promise((resolve) => setTimeout(resolve, 1000))

  spinner.succeed("Configuring.")
  // Note After Installed------------------------------------------------------------------- //
  if (!fs.existsSync(uiFolder)) {
    fs.mkdirSync(uiFolder, { recursive: true })
  }
  spinner.succeed(`UI folder created at ${highlight(`${uiFolder}`)}`)
  spinner.succeed(
    `Primitive file saved to ${highlight(`${uiFolder}/${getCorrectFileExtension(language, "primitive.tsx")}`)}`,
  )
  if (themeProvider) {
    spinner.succeed(
      `Theme Provider file saved to ${highlight(`"${componentFolder}/${getCorrectFileExtension(language, "theme-provider.ts")}"`)}`,
    )
    spinner.succeed(
      `Providers file saved to ${highlight(`"${componentFolder}/${getCorrectFileExtension(language, "providers.tsx")}"`)}`,
    )
  }

  spinner.start(`Configuration saved to ${highlight(`"justd.json"`)}`)
  await new Promise((resolve) => setTimeout(resolve, 500))
  spinner.succeed(`Configuration saved to ${highlight("justd.json")}`)
  spinner.succeed("Installation complete.")

  console.info("\n\nNot sure what to do next?")
  console.info(`Visit our documentation at: ${highlight("https://getjustd.com")}`)

  console.info("\nNow try to add some components to your project")
  console.info(`by running: ${highlight("npx justd-cli@latest add")}`)
  spinner.stop()
}
