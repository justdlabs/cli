import { confirm, input } from '@inquirer/prompts'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

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
      if (fs.existsSync('src')) {
        config.classes = 'src/utils'
      } else if (fs.existsSync('resources/js')) {
        config.classes = 'resources/js/utils'
      } else if (fs.existsSync('resources') && !fs.existsSync('resources/js')) {
        config.classes = 'resources/utils'
      } else {
        config.classes = 'utils'
      }

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
  let cssPath = config.css || ''

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
    default: cssPath,
  })

  config.css = cssPath

  fs.writeFileSync(configFile, JSON.stringify(config, null, 2))

  return cssPath
}

export async function writeFile(description: string, url: string, writePath: string) {
  try {
    const response = await fetch(url)
    const content = await response.text()
    fs.writeFileSync(writePath, content)
  } catch (error: any) {
    console.error(chalk.red(`Error writing component to ${writePath}: ${error.message}`))
  }
}
