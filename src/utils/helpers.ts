import fs from "node:fs"
import { existsSync } from "node:fs"
import path from "node:path"
import { error, highlight, warningText } from "@/utils/logging"
import type { Config } from "./config"

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
  }
  if (hasFolder("src") && !fs.existsSync("artisan") && isNextJs()) {
    return "src/app/globals.css"
  }
  if (hasFolder("app") && isNextJs() && !fs.existsSync("artisan")) {
    return "app/globals.css"
  }
  if (hasFolder("app") && !fs.existsSync("artisan") && isRemix()) {
    return "app/tailwind.css"
  }
  if (hasFolder("src") && !fs.existsSync("artisan") && !isRemix() && !isNextJs()) {
    return "src/index.css"
  }
  return "src/index.css"
}

export function possibilityComponentsPath(): string {
  if (isLaravel()) {
    return "resources/js/components"
  }
  if (hasFolder("src") && !fs.existsSync("artisan") && isNextJs()) {
    return "src/components"
  }
  if (hasFolder("app") && isNextJs() && !fs.existsSync("artisan")) {
    return "components"
  }
  if (hasFolder("app") && !fs.existsSync("artisan") && isRemix()) {
    return "app/components"
  }
  if (hasFolder("src") && !fs.existsSync("artisan") && !isRemix() && !isNextJs()) {
    return "src/components"
  }
  return "components"
}

export function possibilityUtilsPath(): string {
  if (isLaravel()) {
    return "resources/js/utils"
  }
  if (hasFolder("src") && !fs.existsSync("artisan") && isNextJs()) {
    return "src/utils"
  }
  if (hasFolder("app") && isNextJs() && !fs.existsSync("artisan")) {
    return "utils"
  }
  if (hasFolder("app") && !fs.existsSync("artisan") && isRemix()) {
    return "app/utils"
  }
  if (hasFolder("src") && !fs.existsSync("artisan") && !isRemix() && !isNextJs()) {
    return "src/utils"
  }
  return "utils"
}

export function possibilityRootPath(): string {
  if (isLaravel()) {
    return "resources/js"
  }
  if (hasFolder("src") && !fs.existsSync("artisan") && isNextJs()) {
    return "src"
  }
  if (hasFolder("app") && isNextJs() && !fs.existsSync("artisan")) {
    return "app"
  }
  if (hasFolder("app") && !fs.existsSync("artisan") && isRemix()) {
    return "app"
  }
  if (hasFolder("src") && !fs.existsSync("artisan") && !isRemix() && !isNextJs()) {
    return "src"
  }
  return "app"
}

export function possibilityRoutePath(): string {
  if (isLaravel()) {
    return "resources/js/Pages"
  }
  if (hasFolder("src") && !fs.existsSync("artisan") && isNextJs()) {
    return "src/app"
  }
  if (hasFolder("app") && isNextJs() && !fs.existsSync("artisan")) {
    return "app"
  }
  if (hasFolder("app") && !fs.existsSync("artisan") && isRemix()) {
    return "app"
  }
  if (hasFolder("src") && !fs.existsSync("artisan") && !isRemix() && !isNextJs()) {
    return "src/app"
  }
  return "src"
}

export function isNextJs(): boolean {
  return (
    fs.existsSync("next.config.ts") ||
    fs.existsSync("next.config.js") ||
    fs.existsSync("next.config.mjs")
  )
}

export function isTypescriptProject(dir: string = process.cwd()): boolean {
  const ignoredDirs = [
    "node_modules",
    "vendor",
    ".git",
    ".svn",
    ".hg",
    "dist",
    "build",
    "out",
    "target",
    ".next",
    ".vercel",
    ".idea",
    ".vscode",
    ".cache",
    ".npm",
    ".yarn",
    "tmp",
    "logs",
    "coverage",
    ".nyc_output",
  ]

  if (fs.existsSync(path.join(dir, "tsconfig.json"))) {
    return true
  }

  const subdirs = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !ignoredDirs.includes(entry.name))
    .map((entry) => path.join(dir, entry.name))

  return subdirs.some((subdir) => fs.existsSync(path.join(subdir, "tsconfig.json")))
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

/**
 * Check Tailwind version installed in the project
 * @param version
 */
export function isTailwind(version: number): boolean {
  const packageJsonPath = path.join(process.cwd(), "package.json")

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
    const { dependencies = {}, devDependencies = {} } = packageJson

    const tailwindVersion = dependencies.tailwindcss || devDependencies.tailwindcss

    if (tailwindVersion) {
      // Remove any non-numeric prefix (e.g., ^ or ~)
      const cleanVersion = tailwindVersion.replace(/^\D*/, "")
      const majorVersion = Number.parseInt(cleanVersion.split(".")[0], 10)
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
    error(
      `${warningText("justd.json not found")}. Please run ${highlight("npx justd-cli@latest init")} to initialize the project.`,
    )
    return
  }

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"))
  return config.ui || `${possibilityComponentsPath()}/ui`
}

export const justdConfigFile = path.resolve(process.cwd(), "justd.json")

export const doesProjectExist = (): boolean => {
  const hasPackageJson = fs.existsSync("package.json")
  return hasPackageJson || isNextJs() || isLaravel() || isRemix() || isTailwindInstalled()
}

export const getCorrectFileExtension = (language: Config["language"], fileName: string) => {
  if (language === "javascript") {
    return fileName.replace(".ts", ".js")
  }

  return fileName
}
