import path from "path"
import fs from "fs"
import { existsSync } from "node:fs"
import { error, highlight, warningText } from "@/utils/logging"

export function hasFolder(folderName: string): boolean {
  const folderPath = path.join(process.cwd(), folderName)
  return fs.existsSync(folderPath)
}

/**
 *  This function is used to get the CSS path from the justd.json file
 *  or the default CSS path for the project
 *  @returns string
 */
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

export function isTailwind(version: number): boolean {
  const packageJsonPath = path.join(process.cwd(), "package.json")

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
    const { dependencies = {}, devDependencies = {} } = packageJson

    const tailwindVersion = dependencies["tailwindcss"] || devDependencies["tailwindcss"]

    if (tailwindVersion) {
      // Remove any non-numeric prefix (e.g., ^ or ~)
      const cleanVersion = tailwindVersion.replace(/^\D*/, "")
      const majorVersion = parseInt(cleanVersion.split(".")[0], 10)
      return majorVersion === version
    }
  }

  return false
}

/**
 *  This function is used to check if Tailwind is installed in the project
 *  @returns boolean
 */
export function isTailwindInstalled(): boolean {
  const packageJsonPath = path.join(process.cwd(), "package.json")

  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
    const { dependencies = {}, devDependencies = {} } = packageJson

    return "tailwindcss" in dependencies || "tailwindcss" in devDependencies
  }

  return false
}

/**
 *  This function is used to check if Laravel is installed in the project
 *  @returns boolean
 */
export function isLaravel(): boolean {
  return fs.existsSync(path.resolve(process.cwd(), "artisan"))
}

/**
 *  This function is used to get the UI path from the justd.json file
 *  @returns string
 */
export function getUIPathFromConfig() {
  const configFilePath = path.join(process.cwd(), "justd.json")
  if (!fs.existsSync(configFilePath)) {
    error(`${warningText("justd.json not found")}. Please run ${highlight("npx justd-cli@latest init")} to initialize the project.`)
    return
  }

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"))
  return config.ui || possibilityComponentsPath() + "/ui"
}

/**
 *  This function is used to get the alias from the justd.json file
 *  @returns string
 */
export function getAliasFromConfig() {
  const configFilePath = path.join(process.cwd(), "justd.json")
  if (!fs.existsSync(configFilePath)) {
    throw new Error("justd.json not found. Please initialize the project.")
  }

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"))
  return config.alias
}

export const justdConfigFile = path.resolve(process.cwd(), "justd.json")
