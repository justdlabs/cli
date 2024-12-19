import { input } from "@inquirer/prompts"
import fs, { writeFileSync } from "fs"
import figlet from "figlet"

import { spawn } from "child_process"
import path from "path"
import { fileURLToPath } from "url"
import { getPackageManager } from "@/utils/get-package-manager"
import ora from "ora"
import { getRepoUrlForComponent, getUtilsFolder } from "@/utils/repo"
import { changeGray } from "@/commands/change-gray"
import { hasFolder, isLaravel, isNextJs, isRemix, isTailwind, isTailwindInstalled, possibilityComponentsPath, possibilityCssPath, possibilityRootPath, possibilityUtilsPath } from "@/utils/helpers"
import { addUiPathToTsConfig } from "@/utils"
import { error, highlight, info } from "@/utils/logging"
import { isRepoDirty } from "@/utils/git"
import stripJsonComments from "strip-json-comments"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stubs = path.resolve(__dirname, "../src/resources/stubs")

export async function init(flags: { force?: boolean; yes?: boolean }) {
  if (!flags.force) {
    const checkingGit = ora(`Checking.`).start()
    if (isRepoDirty()) {
      checkingGit.stop()
      error("Git directory is not clean. Please stash or commit your changes before running the init command.")
      info(`You may use the ${highlight("--force")} flag to silence this warning and perform the initialization anyway.`)
      process.exit(1)
    }
    checkingGit.stop() // stop spinner
  }

  const spinner = ora(`Initializing.`).start()
  const twExists = isTailwindInstalled()
  if (!twExists) {
    spinner.fail("The tailwindcss package is not installed. Please install before running the init command.")
    spinner.stop()
    return
  }
  setTimeout(() => {
    spinner.color = "yellow"
    spinner.text = "Loading rainbows"
  }, 1000)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  let componentFolder: string, twConfigStub: string, uiFolder: string, cssLocation: string, themeProvider: string, providers: string, utilsFolder: string
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
      validate: (value) => value.trim() !== "" || "Path cannot be empty. Please enter a valid path.",
    })

    uiFolder = path.join(componentFolder, "ui")

    utilsFolder = await input({
      message: "Utils folder:",
      default: possibilityUtilsPath(),
      validate: (value) => value.trim() !== "" || "Path cannot be empty. Please enter a valid path.",
    })

    cssLocation = await input({
      message: "Where would you like to place the CSS file?",
      default: possibilityCssPath(),
      validate: (value) => value.trim() !== "" || "Path cannot be empty. Please enter a valid path.",
    })
  }

  if (isNextJs() && hasFolder("src")) {
    twConfigStub = path.join(stubs, "1.x/tailwind.config.src.next.stub")
    themeProvider = path.join(stubs, "next/theme-provider.stub")
    providers = path.join(stubs, "next/providers.stub")
  } else if (isNextJs() && !hasFolder("src")) {
    twConfigStub = path.join(stubs, "1.x/tailwind.config.next.stub")
    themeProvider = path.join(stubs, "next/theme-provider.stub")
    providers = path.join(stubs, "next/providers.stub")
  } else if (isLaravel()) {
    twConfigStub = path.join(stubs, "1.x/tailwind.config.laravel.stub")
    themeProvider = path.join(stubs, "laravel/theme-provider.stub")
    providers = path.join(stubs, "laravel/providers.stub")
  } else if (isRemix()) {
    twConfigStub = path.join(stubs, "1.x/tailwind.config.vite.stub")
    themeProvider = path.join(stubs, "next/theme-provider.stub")
    providers = path.join(stubs, "next/providers.stub")
  } else {
    twConfigStub = path.join(stubs, "1.x/tailwind.config.vite.stub")
    themeProvider = path.join(stubs, "next/theme-provider.stub")
    providers = path.join(stubs, "next/providers.stub")
  }

  if (isTailwind(3)) {
    const tailwindConfigTarget = fs.existsSync("tailwind.config.js") ? "tailwind.config.js" : "tailwind.config.ts"
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

  async function getUserAlias(): Promise<string | null> {
    const tsConfigPath = path.join(process.cwd(), "tsconfig.json")

    if (!fs.existsSync(tsConfigPath)) {
      error("tsconfig.json not found.")
      process.exit(1)
    }

    let tsConfig
    try {
      const tsConfigRaw = fs.readFileSync(tsConfigPath, "utf8")
      const stripped = stripJsonComments(tsConfigRaw)
      tsConfig = JSON.parse(stripped)
    } catch {
      error("Error reading tsconfig.json file. Please check if it exists and is valid JSON.")
      process.exit(1)
    }

    if (!tsConfig.compilerOptions) tsConfig.compilerOptions = {}

    if (!("paths" in tsConfig.compilerOptions)) {
      const rootPath = await input({
        message: "No paths key found in tsconfig.json. Please enter the root directory path for the '@/':",
        default: "./" + possibilityRootPath(),
      })

      tsConfig.compilerOptions.paths = {
        "@/*": [`${rootPath || "./src"}/*`],
      }

      const spinner = ora("Updating tsconfig.json with paths...").start()
      try {
        const updatedTsConfig = JSON.stringify(tsConfig, null, 2)
        fs.writeFileSync(tsConfigPath, updatedTsConfig)
        spinner.succeed("Paths added to tsconfig.json.")
      } catch (e) {
        spinner.fail("Failed to write to tsconfig.json.")
        process.exit(1)
      }
    }

    await addUiPathToTsConfig()

    const paths = tsConfig.compilerOptions.paths
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

  const config = {
    $schema: "https://getjustd.com/schema.json",
    ui: uiFolder,
    utils: utilsFolder,
    gray: selectedGray?.replace(".css", "")!,
    css: cssLocation,
    alias: currentAlias,
  }

  const packageManager = await getPackageManager()

  let mainPackages = ["react-aria-components", "justd-icons"].join(" ")

  let devPackages = ["tailwind-variants", "tailwind-merge", "tailwindcss-animate"].join(" ")

  if (isTailwind(3)) {
    devPackages += " tailwindcss-react-aria-components"
  }

  if (isNextJs()) {
    devPackages += " next-themes"
  }

  if (isRemix()) {
    devPackages += " remix-themes"
  }

  const action = packageManager === "npm" ? "i" : "add"
  let installCommand = `${packageManager} ${action} ${mainPackages} && ${packageManager} ${action} -D ${devPackages}  --silent`
  spinner.start(`Installing dependencies.`)

  const child = spawn(installCommand, {
    stdio: ["ignore", "ignore", "ignore"],
    shell: true,
  })

  await new Promise<void>((resolve) => {
    child.on("close", () => {
      resolve()
    })
  })

  const fileUrl = getRepoUrlForComponent("primitive")
  const response = await fetch(fileUrl)

  if (!response.ok) throw new Error(`Failed to fetch component: ${response.statusText}`)

  let fileContent = await response.text()

  if (isLaravel()) {
    fileContent = fileContent.replace(/['"]use client['"]\s*\n?/g, "")
  }

  fs.writeFileSync(path.join(uiFolder, "primitive.tsx"), fileContent, { flag: "w" })
  fs.writeFileSync(path.join(uiFolder, "index.ts"), `export * from './primitive';`, { flag: "w" })

  const responseClasses = await fetch(getUtilsFolder("classes.ts"))
  const fileContentClasses = await responseClasses.text()
  fs.writeFileSync(path.join(utilsFolder, "classes.ts"), fileContentClasses, { flag: "w" })

  if (themeProvider) {
    const themeProviderContent = fs.readFileSync(themeProvider, "utf8")
    fs.writeFileSync(path.join(componentFolder, "theme-provider.tsx"), themeProviderContent, { flag: "w" })

    if (providers) {
      const providersContent = fs.readFileSync(providers, "utf8")
      fs.writeFileSync(path.join(componentFolder, "providers.tsx"), providersContent, { flag: "w" })
    }
  }

  try {
    fs.writeFileSync("justd.json", JSON.stringify(config, null, 2))
  } catch (error) {
    // @ts-ignore
    error("Error writing to justd.json:", error?.message)
  }
  spinner.succeed(`Installing dependencies.`)
  spinner.start(`Configuring.`)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  spinner.succeed("Configuring.")
  // Note After Installed------------------------------------------------------------------- //
  if (!fs.existsSync(uiFolder)) {
    fs.mkdirSync(uiFolder, { recursive: true })
  }
  spinner.succeed(`UI folder created at ${highlight(`${uiFolder}`)}`)
  spinner.succeed(`Primitive file saved to ${highlight(`${uiFolder}/primitive.tsx`)}`)
  spinner.succeed(`Classes file saved to ${highlight(`${utilsFolder}/classes.ts`)}`)
  if (themeProvider) {
    spinner.succeed(`Theme Provider file saved to ${highlight(`"${componentFolder}/theme-provider.tsx"`)}`)
    spinner.succeed(`Providers file saved to ${highlight(`"${componentFolder}/providers.tsx"`)}`)
  }

  spinner.start(`Configuration saved to ${highlight(`"justd.json"`)}`)
  await new Promise((resolve) => setTimeout(resolve, 500))
  spinner.succeed(`Configuration saved to ${highlight("justd.json")}`)
  spinner.succeed(`Installation complete.`)

  console.info("\n\nNot sure what to do next?")
  console.info(`Visit our documentation at: ${highlight("https://getjustd.com")}`)

  console.info("\nNow try to add some components to your project")
  console.info(`by running: ${highlight("npx justd-cli@latest add")}`)

  // @ts-ignore
  figlet.text(
    "Justd",
    {
      font: "Standard",
      horizontalLayout: "default",
      width: 80,
      verticalLayout: "default",
    },
    (_: any, data: string) => {
      console.info(highlight(data))
    },
  )
  spinner.stop()
}
