import fs from "node:fs"
import path from "node:path"
import {
  hasFolder,
  isLaravel,
  isNextJs,
  possibilityComponentsPath,
  possibilityCssPath,
} from "@/utils/helpers"
import { error } from "@/utils/logging"
import { confirm, input } from "@inquirer/prompts"
import stripJsonComments from "strip-json-comments"
import { transform } from "sucrase"
import { type Config, configManager } from "./config"

// Get the path to the CSS file from the justd.json file
export async function getCSSPath() {
  const doesConfigExist = configManager.doesConfigExist()

  if (!doesConfigExist) {
    error("Configuration file justd.json not found. Please run the init command first.")
  }

  const config = await configManager.loadConfig()

  if (fs.existsSync(config.css)) {
    const useExistingPath = await confirm({
      message: `The specified CSS path '${config.css}' exists. Do you want to use this path?`,
    })

    if (useExistingPath) {
      return config.css
    }
  } else {
    console.warn(`The specified CSS path '${config.css}' does not exist.`)
  }

  const newCssPath = await input({
    message: "Please provide a CSS path:",
    default: possibilityCssPath(),
  })

  await configManager.updateConfig({
    css: newCssPath,
  })

  return newCssPath
}

/**
 *  This function is used to add the UI path to the tsconfig.json file
 *  if it doesn't exist
 *  @returns void
 */
export async function addUiPathToLangConfig(language: "typescript" | "javascript") {
  const configPaths =
    language === "typescript"
      ? [path.join(process.cwd(), "tsconfig.app.json"), path.join(process.cwd(), "tsconfig.json")]
      : [path.join(process.cwd(), "jsconfig.json")]

  const configPath = configPaths.find((configPath) => fs.existsSync(configPath))
  if (!configPath) {
    console.error(
      language === "typescript"
        ? "Neither tsconfig.app.json nor tsconfig.json was found."
        : "jsconfig.json was not found.",
    )
    process.exit(1)
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf8")
    const strippedContent = stripJsonComments(configContent)

    const config = JSON.parse(strippedContent)

    if (!config.compilerOptions) config.compilerOptions = {}
    if (!config.compilerOptions.paths) config.compilerOptions.paths = {}

    const ext = language === "typescript" ? "ts" : "js"
    config.compilerOptions.paths.ui = [`./${possibilityComponentsPath()}/ui/index.${ext}`]

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (e) {
    // @ts-ignore
    error(`Error updating ${path.basename(configPath)}:`, e?.message)
    process.exit(1)
  }
}

export const writeCodeFile = async (
  config: Config,
  options: { writePath: string; ogFilename: string; content: string },
) => {
  const aliasRegex = /import\s*{.*}\s*from\s*['"]@\/(.*)['"]/g
  let parsedContent = options.content.replace(aliasRegex, (match) => {
    return match.replace("@/", `${config.alias}/`)
  })

  if (!isNextJs()) {
    parsedContent = parsedContent.replace(/['"]use client['"]\s*\n?/g, "")
  }

  let utils: string
  if (isLaravel()) {
    utils = config.utils.replace(/^resources\/js\//, "")
  } else if (hasFolder("src")) {
    utils = config.utils.replace(/^src\//, "")
  } else {
    utils = config.utils
  }

  const dirPath = path.dirname(options.writePath)
  parsedContent = parsedContent.replace(/@\/utils\/classes/g, `@/${utils}/classes`)

  fs.mkdirSync(dirPath, { recursive: true })
  if (config.language === "javascript") {
    const results = transform(parsedContent, {
      transforms: ["typescript", "jsx"],
      jsxRuntime: "preserve",
      disableESTransforms: true,
    })

    fs.writeFileSync(options.writePath.replace(".ts", ".js"), results.code, { flag: "w" })

    return
  }

  fs.writeFileSync(options.writePath, parsedContent)
}
