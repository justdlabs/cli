import { confirm, input } from '@inquirer/prompts'
import fs from 'fs'
import path from 'path'
import { possibilityCssPath, possibilityUtilsPath } from '@/src/utils/helpers'

export function getWriteComponentPath(componentName: string) {
  const uiFolder = getUIFolderPath()
  return path.join(uiFolder, `${componentName}.tsx`)
}

export function getUIFolderPath() {
  const configFile = 'justd.json'
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
    return config.ui
  } else {
    throw new Error('Configuration file justd.json not found. Please run the init command first.')
  }
}

export function getUtilsFolderPath() {
  const configFile = 'justd.json'
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'))

    if (!config.classes) {
      config.classes = possibilityUtilsPath()

      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8')
    }

    return config.classes
  } else {
    throw new Error('Configuration file justd.json not found. Please run the init command first.')
  }
}

export async function getCSSPath() {
  const configFile = 'justd.json'

  if (!fs.existsSync(configFile)) {
    throw new Error('Configuration file justd.json not found. Please run the init command first.')
  }

  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
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
    message: 'Please provide a CSS path:',
    default: possibilityCssPath(),
  })

  config.css = cssPath

  fs.writeFileSync(configFile, JSON.stringify(config, null, 2))

  return cssPath
}
