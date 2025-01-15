import fs from "node:fs"
import path from "node:path"
import { possibilityComponentsPath, possibilityCssPath } from "@/utils/helpers"
import { error } from "@/utils/logging"
import { confirm, input } from "@inquirer/prompts"
import stripJsonComments from "strip-json-comments"
import { configManager } from "./config"

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
export async function addUiPathToTsConfig() {
  const tsConfigPaths = [
    path.join(process.cwd(), "tsconfig.app.json"),
    path.join(process.cwd(), "tsconfig.json"),
  ]

  const tsConfigPath = tsConfigPaths.find((configPath) => fs.existsSync(configPath))
  if (!tsConfigPath) {
    error("Neither tsconfig.app.json nor tsconfig.json was found.")
    process.exit(1)
  }

  try {
    const tsConfigContent = fs.readFileSync(tsConfigPath, "utf8")
    const strippedContent = stripJsonComments(tsConfigContent)

    const tsConfig = JSON.parse(strippedContent)

    if (!tsConfig.compilerOptions) tsConfig.compilerOptions = {}
    if (!tsConfig.compilerOptions.paths) tsConfig.compilerOptions.paths = {}

    tsConfig.compilerOptions.paths.ui = [`./${possibilityComponentsPath()}/ui/index.ts`]

    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2))
  } catch (er) {
    error(`Error updating ${path.basename(tsConfigPath)}:`, er!)
  }
}
