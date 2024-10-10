import fs, { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { confirm, select } from '@inquirer/prompts'
import { resourceDir } from './init'
import { getCSSPath } from '@/src/utils'
import { capitalize } from '@/src/utils/helpers'

export async function theme(cssLocation: string): Promise<string | undefined> {
  const themes = [
    'default.css',
    'zinc.css',
    'neutral.css',
    'slate.css',
    'gray.css',
    'azure.css',
    'sky.css',
    'amber.css',
    'violet.css',
    'emerald.css',
    'rose.css',
    'turquoise.css',
    'orange.css',
  ]

  const selectedTheme = await select({
    message: 'Select a theme:',
    choices: themes.map((theme) => ({ name: capitalize(theme.replace('.css', '')), value: theme })),
    pageSize: 15,
  })

  const cssSourcePath = path.join(resourceDir, `themes/${selectedTheme}`)

  const spinner = ora('Setting up theme...').start()

  if (!fs.existsSync(path.dirname(cssLocation))) {
    fs.mkdirSync(path.dirname(cssLocation), { recursive: true })
    spinner.succeed(`Created directory for CSS at ${chalk.blue(path.dirname(cssLocation))}`)
  }

  if (fs.existsSync(cssSourcePath)) {
    try {
      const cssContent = fs.readFileSync(cssSourcePath, 'utf8')
      fs.writeFileSync(cssLocation, cssContent, { flag: 'w' })
      spinner.succeed(`CSS file copied to ${cssLocation}`)
      return selectedTheme
    } catch (error) {
      // @ts-ignore
      spinner.fail(`Failed to write CSS file to ${cssLocation}: ${error.message}`)
    }
  } else {
    spinner.warn(`Source CSS file does not exist at ${cssSourcePath}`)
  }

  return undefined
}

export async function setTheme(overrideConfirmation: boolean, selectedTheme?: string) {
  const userConfigPath = './justd.json'
  if (!fs.existsSync(userConfigPath)) {
    console.error(
      `${chalk.red('justd.json not found')}. ${chalk.gray(`Please run ${chalk.blue('npx justd-cli@latest init')} to initialize the project.`)}`,
    )
    return
  }

  const userConfig = JSON.parse(readFileSync(userConfigPath, 'utf8'))

  const currentTheme = userConfig.theme || 'default'

  const cssPath = await getCSSPath()

  let confirmOverride = true

  if (!overrideConfirmation) {
    confirmOverride = await confirm({
      message: `Are you sure you want to override the current theme ${chalk.blue(currentTheme)} with ${selectedTheme ? chalk.blue(capitalize(selectedTheme)) : 'others'}?`,
    })

    if (!confirmOverride) {
      console.log('Theme change canceled.')
      return
    }
  }

  let _newTheme = selectedTheme || (await theme(cssPath))

  if (_newTheme) {
    const newTheme = capitalize(_newTheme.replace('.css', ''))
    userConfig.theme = newTheme
    userConfig.css = cssPath
    writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2))
    console.log(`Theme changed to '${newTheme}'`)
  } else {
    console.log('No theme selected.')
  }
}
