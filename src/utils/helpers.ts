import path from "path"
import fs from "fs"
import { existsSync } from "node:fs"
import chalk from "chalk"

export function hasFolder(folderName: string): boolean {
  const folderPath = path.join(process.cwd(), folderName)
  return fs.existsSync(folderPath)
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function possibilityCssPath(): string {
  if (isLaravel()) {
    return "resources/css/app.css"
  } else if (hasFolder("src") && !fs.existsSync("artisan") && isNextJs()) {
    return "src/app/globals.css"
  } else if (hasFolder("app") && isNextJs() && !fs.existsSync("artisan")) {
    return "app/globals.css"
  } else if (hasFolder("app") && !fs.existsSync("artisan") && isRemix()) {
    return "app/tailwind.css"
  } else if (hasFolder("src") && !fs.existsSync("artisan") && !isRemix() && !isNextJs()) {
    return "src/index.css"
  }
  return "src/index.css"
}

export function possibilityComponentsPath(): string {
  if (isLaravel()) {
    return "resources/js/components"
  } else if (hasFolder("src") && !fs.existsSync("artisan") && isNextJs()) {
    return "src/components"
  } else if (hasFolder("app") && isNextJs() && !fs.existsSync("artisan")) {
    return "components"
  } else if (hasFolder("app") && !fs.existsSync("artisan") && isRemix()) {
    return "app/components"
  } else if (hasFolder("src") && !fs.existsSync("artisan") && !isRemix() && !isNextJs()) {
    return "src/components"
  }
  return "components"
}

export function possibilityUtilsPath(): string {
  if (isLaravel()) {
    return "resources/js/utils"
  } else if (hasFolder("src") && !fs.existsSync("artisan") && isNextJs()) {
    return "src/utils"
  } else if (hasFolder("app") && isNextJs() && !fs.existsSync("artisan")) {
    return "utils"
  } else if (hasFolder("app") && !fs.existsSync("artisan") && isRemix()) {
    return "app/utils"
  } else if (hasFolder("src") && !fs.existsSync("artisan") && !isRemix() && !isNextJs()) {
    return "src/utils"
  }
  return "utils"
}

export function possibilityRootPath(): string {
  if (isLaravel()) {
    return "resources/js"
  } else if (hasFolder("src") && !fs.existsSync("artisan") && isNextJs()) {
    return "src"
  } else if (hasFolder("app") && isNextJs() && !fs.existsSync("artisan")) {
    return "utils"
  } else if (hasFolder("app") && !fs.existsSync("artisan") && isRemix()) {
    return "app"
  } else if (hasFolder("src") && !fs.existsSync("artisan") && !isRemix() && !isNextJs()) {
    return "src"
  }
  return "utils"
}

export function isNextJs(): boolean {
  return fs.existsSync("next.config.ts") || fs.existsSync("next.config.js") || fs.existsSync("next.config.mjs")
}

export function isRemix(): boolean {
  const packageJsonPath = path.join(process.cwd(), "package.json")

  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
    const { dependencies = {}, devDependencies = {} } = packageJson

    return "@remix-run/react" in dependencies || "@remix-run/react" in devDependencies
  }

  return false
}

export function isLaravel(): boolean {
  return fs.existsSync(path.resolve(process.cwd(), "artisan"))
}

export function getUIPathFromConfig() {
  const configFilePath = path.join(process.cwd(), "justd.json")
  if (!fs.existsSync(configFilePath)) {
    console.error(
      `${chalk.red("justd.json not found")}. ${chalk.gray(`Please run ${chalk.blue("npx justd-cli@latest init")} to initialize the project.`)}`,
    )
    return
  }

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"))
  return config.ui || possibilityComponentsPath() + "/ui"
}

export function getAliasFromConfig() {
  const configFilePath = path.join(process.cwd(), "justd.json")
  if (!fs.existsSync(configFilePath)) {
    throw new Error("justd.json not found. Please initialize the project.")
  }

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"))
  return config.alias
}

export const justdConfigFile = path.resolve(process.cwd(), "justd.json")
