import fs, { readFileSync, writeFileSync } from 'fs'
import { confirm } from '@inquirer/prompts'
import { capitalize, selectTheme } from '@/src/commands/select-theme'
import { getCSSPath } from '@/src/utils'
import chalk from 'chalk'

export async function setTheme(overrideConfirmation: boolean) {
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
      message: `Are you sure you want to override the current theme '${currentTheme}' with others?`,
    })

    if (!confirmOverride) {
      console.log('Theme change canceled.')
      return
    }
  }

  const _newTheme = await selectTheme(cssPath)

  if (_newTheme) {
    const newTheme = _newTheme ? capitalize(_newTheme.replace('.css', '')) : undefined
    userConfig.theme = newTheme
    userConfig.css = cssPath
    writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2))
    console.log(`Theme changed to '${newTheme}'`)
  } else {
    console.log('No theme selected.')
  }
}
