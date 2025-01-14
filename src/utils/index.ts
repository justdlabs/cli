import { confirm, input } from "@inquirer/prompts"
import fs from "fs"
import path from "path"
import { justdConfigFile, possibilityComponentsPath, possibilityCssPath, possibilityUtilsPath } from "@/utils/helpers"
import stripJsonComments from "strip-json-comments"
import { error } from "@/utils/logging"

/**
 *  This function is used to get the write path for a component
 *  @param componentName string
 *  @returns string
 */
export function getWriteComponentPath(componentName: string) {
  const uiFolder = getUIFolderPath()
  return path.join(uiFolder, `${componentName}.tsx`)
}

/**
 *  This function is used to get the path to the UI folder from the justd.json file
 *  @returns string
 */
export function getUIFolderPath() {
  const configFile = "justd.json"
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, "utf8"))
    return config.ui
  } else {
    error("Configuration file justd.json not found. Please run the init command first.")
  }
}

/**
 *  This function is used to get the path to the utils folder from the justd.json file
 *  @returns string
 */
export function getUtilsFolderPath() {
  const configFile = "justd.json"
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, "utf8"))

    return config.utils || possibilityUtilsPath()
  } else {
    error("Configuration file justd.json not found. Please run the init command first.")
  }
}

// Get the path to the CSS file from the justd.json file
export async function getCSSPath() {
  const configFile = justdConfigFile

  if (!fs.existsSync(configFile)) {
    error("Configuration file justd.json not found. Please run the init command first.")
  }

  const config = JSON.parse(fs.readFileSync(configFile, "utf8"))
  let cssPath = config.css || possibilityCssPath()

  if (cssPath && fs.existsSync(cssPath)) {
    const useExistingPath = await confirm({
      message: `The specified CSS path '${cssPath}' exists. Do you want to use this path?`,
    })

    if (useExistingPath) {
      return cssPath
    }
  } else {
    if (cssPath) {
      console.warn(`The specified CSS path '${cssPath}' does not exist.`)
    }
  }

  cssPath = await input({
    message: "Please provide a CSS path:",
    default: possibilityCssPath(),
  })

  config.css = cssPath

  fs.writeFileSync(configFile, JSON.stringify(config, null, 2))

  return cssPath
}

/**
 *  This function is used to add the UI path to the tsconfig.json file
 *  if it doesn't exist
 *  @returns void
 */
export async function addUiPathToTsConfig() {
  const tsConfigPaths = [path.join(process.cwd(), "tsconfig.app.json"), path.join(process.cwd(), "tsconfig.json")]

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

    tsConfig.compilerOptions.paths["ui"] = [`./${possibilityComponentsPath()}/ui/index.ts`]

    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2))
  } catch (er) {
    error(`Error updating ${path.basename(tsConfigPath)}:`, er!)
  }
}
