import { confirm, input } from "@inquirer/prompts"
import fs from "fs"
import path from "path"
import { justdConfigFile, possibilityComponentsPath, possibilityCssPath, possibilityUtilsPath } from "@/utils/helpers"

// This function is used to get the write path for a component
export function getWriteComponentPath(componentName: string) {
  const uiFolder = getUIFolderPath()
  return path.join(uiFolder, `${componentName}.tsx`)
}

// Get the path to the UI folder from the justd.json file
export function getUIFolderPath() {
  const configFile = "justd.json"
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, "utf8"))
    return config.ui
  } else {
    throw new Error("Configuration file justd.json not found. Please run the init command first.")
  }
}

// Get the path to the utils folder from the justd.json file
export function getUtilsFolderPath() {
  const configFile = "justd.json"
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, "utf8"))

    if (!config.classes) {
      config.classes = possibilityUtilsPath()

      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf8")
    }

    return config.classes
  } else {
    throw new Error("Configuration file justd.json not found. Please run the init command first.")
  }
}

// Get the path to the CSS file from the justd.json file
export async function getCSSPath() {
  const configFile = justdConfigFile

  if (!fs.existsSync(configFile)) {
    throw new Error("Configuration file justd.json not found. Please run the init command first.")
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

const tsConfigPath = path.join(process.cwd(), "tsconfig.json")
export async function addUiPathToTsConfig() {
  try {
    const tsConfigContent = fs.readFileSync(tsConfigPath, "utf8")
    const tsConfig = JSON.parse(tsConfigContent)
    if (!tsConfig.compilerOptions) tsConfig.compilerOptions = {}
    if (!tsConfig.compilerOptions.paths) tsConfig.compilerOptions.paths = {}
    tsConfig.compilerOptions.paths["ui"] = [`./${possibilityComponentsPath()}/ui/index.ts`]
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2))
  } catch (error) {
    console.error("Error updating tsconfig.json:", error)
  }
}
