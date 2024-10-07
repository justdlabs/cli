import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { select } from '@inquirer/prompts'
import { resourceDir } from './init'

export async function selectTheme(cssLocation: string): Promise<string | undefined> {
  const themes = [
    'default.css',
    'zinc.css',
    'neutral.css',
    'azure.css',
    'slate.css',
    'gray.css',
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

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
