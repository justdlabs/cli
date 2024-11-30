import { input } from "@inquirer/prompts"
import fs from "fs"
import figlet from "figlet"

import { spawn } from "child_process"
import path from "path"
import { fileURLToPath } from "url"
import chalk from "chalk"
import { getPackageManager } from "@/utils/get-package-manager"
import ora from "ora"
import { getClassesTsRepoUrl, getRepoUrlForComponent } from "@/utils/repo"
import { theme } from "@/commands/theme"
import { capitalize, hasFolder, isLaravel, isNextJs, isRemix, possibilityComponentsPath, possibilityCssPath, possibilityRootPath, possibilityUtilsPath } from "@/utils/helpers"
import { addUiPathToTsConfig } from "@/utils"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const resourceDir = path.resolve(__dirname, "../src/resources")
const stubs = path.resolve(__dirname, "../src/resources/stubs")

export async function init() {
  const twExists = fs.existsSync("tailwind.config.js") || fs.existsSync("tailwind.config.cjs") || fs.existsSync("tailwind.config.mjs") || fs.existsSync("tailwind.config.ts") || fs.existsSync("tailwind.config.mts")

  const spinner = ora(`Initializing.`).start()
  setTimeout(() => {
    spinner.color = "yellow"
    spinner.text = "Loading rainbows"
  }, 1000)

  await new Promise((resolve) => setTimeout(resolve, 1000))
  if (!twExists) {
    spinner.fail("No Tailwind configuration file found. Please ensure tailwind.config.ts or tailwind.config.js exists in the root directory.")
    return
  }

  let componentFolder: string, uiFolder: string, cssLocation: string, configSourcePath: string, themeProvider: string, providers: string, utilsFolder: string
  spinner.succeed("Initializing.")
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

  if (isNextJs() && hasFolder("src")) {
    configSourcePath = path.join(stubs, "next/tailwind.config.src.next.stub")
    themeProvider = path.join(stubs, "next/theme-provider.stub")
    providers = path.join(stubs, "next/providers.stub")
  } else if (isNextJs() && !hasFolder("src")) {
    configSourcePath = path.join(stubs, "next/tailwind.config.next.stub")
    themeProvider = path.join(stubs, "next/theme-provider.stub")
    providers = path.join(stubs, "next/providers.stub")
  } else if (isLaravel()) {
    configSourcePath = path.join(stubs, "laravel/tailwind.config.laravel.stub")
    themeProvider = path.join(stubs, "laravel/theme-provider.stub")
    providers = path.join(stubs, "laravel/providers.stub")
  } else if (isRemix()) {
    configSourcePath = path.join(stubs, "next/tailwind.config.next.stub")
    themeProvider = path.join(stubs, "next/theme-provider.stub")
    providers = path.join(stubs, "next/providers.stub")
  } else {
    configSourcePath = path.join(stubs, "next/tailwind.config.src.next.stub")
    themeProvider = path.join(stubs, "next/theme-provider.stub")
    providers = path.join(stubs, "next/providers.stub")
  }

  if (!fs.existsSync(utilsFolder)) {
    fs.mkdirSync(utilsFolder, { recursive: true })
  }

  if (!fs.existsSync(uiFolder)) {
    fs.mkdirSync(uiFolder, { recursive: true })
  }

  const tailwindConfigTarget = fs.existsSync("tailwind.config.js") ? "tailwind.config.js" : "tailwind.config.ts"

  async function getUserAlias(): Promise<string | null> {
    const tsConfigPath = path.join(process.cwd(), "tsconfig.json")

    if (!fs.existsSync(tsConfigPath)) {
      console.error("tsconfig.json not found.")
      return null
    }

    let tsConfig
    try {
      tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, "utf8"))
    } catch (error) {
      console.error("Failed to read tsconfig.json.")
      return null
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
        fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2))
        spinner.succeed("Paths added to tsconfig.json.")
      } catch (error) {
        spinner.fail("Failed to write to tsconfig.json.")
        return null
      }
    }

    await addUiPathToTsConfig()

    const paths = tsConfig.compilerOptions.paths
    if (paths) {
      const firstAliasKey = Object.keys(paths)[0]
      return firstAliasKey.replace("/*", "")
    }

    return null
  }

  const currentAlias = await getUserAlias()

  const selectedTheme = await theme(cssLocation)
  const config = {
    $schema: "https://getjustd.com",
    ui: uiFolder,
    classes: utilsFolder,
    theme: capitalize(selectedTheme?.replace(".css", "")!),
    css: cssLocation,
    alias: currentAlias,
  }

  const tsConfigPath = path.join(process.cwd(), "tsconfig.json")

  try {
    const tailwindConfigContent = fs.readFileSync(configSourcePath, "utf8")
    fs.writeFileSync(tailwindConfigTarget, tailwindConfigContent, { flag: "w" })
  } catch (error) {
    // @ts-ignore
    spinner.fail(`Failed to write Tailwind config to ${tailwindConfigTarget}: ${error.message}`)
  }

  if (fs.existsSync(tsConfigPath)) {
    let tsConfig
    try {
      const tsConfigContent = fs.readFileSync(tsConfigPath, "utf8")
      tsConfig = JSON.parse(tsConfigContent)
    } catch (error) {
      spinner.fail("Failed to parse tsconfig.json.")
      return
    }

    if (!tsConfig.compilerOptions) tsConfig.compilerOptions = {}
  }

  const packageManager = await getPackageManager()

  let mainPackages = ["react-aria-components", "justd-icons"].join(" ")

  let devPackages = ["tailwindcss-react-aria-components", "tailwind-variants", "tailwind-merge", "clsx", "tailwindcss-animate"].join(" ")

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

  const responseClasses = await fetch(getClassesTsRepoUrl())
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
    console.error("Error writing to justd.json:", error?.message)
  }
  spinner.succeed(`Installing dependencies.`)
  spinner.start(`Configuring.`)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  spinner.succeed("Configuring.")
  // Note After Installed------------------------------------------------------------------- //
  if (!fs.existsSync(uiFolder)) {
    fs.mkdirSync(uiFolder, { recursive: true })
  }
  spinner.succeed(`UI folder created at ${chalk.blue(`"${uiFolder}"`)}`)
  spinner.succeed(`Primitive file saved to ${chalk.blue(`"${uiFolder}/primitive.tsx"`)}`)
  spinner.succeed(`Classes file saved to ${chalk.blue(`"${utilsFolder}/classes.ts"`)}`)
  if (themeProvider) {
    spinner.succeed(`Theme Provider file saved to ${chalk.blue(`"${componentFolder}/theme-provider.tsx"`)}`)
    spinner.succeed(`Providers file saved to ${chalk.blue(`"${componentFolder}/providers.tsx"`)}`)
  }

  spinner.start(`Configuration saved to ${chalk.blue(`"justd.json"`)}`)
  await new Promise((resolve) => setTimeout(resolve, 500))
  spinner.succeed(`Configuration saved to ${chalk.blue("justd.json")}`)
  spinner.succeed(`Installation complete.`)

  console.log("\n\nNot sure what to do next?")
  console.log(`Visit our documentation at: ${chalk.blueBright("https://getjustd.com")}`)

  console.log("\nNow try to add some components to your project")
  console.log(`by running: ${chalk.blueBright("npx justd-cli@latest add\n")}`)

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
      console.log(chalk.blue(data))
    },
  )
  spinner.stop()
}
