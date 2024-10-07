import { readFileSync, writeFileSync } from 'fs'
import { confirm } from '@inquirer/prompts'
import { capitalize, selectTheme } from '@/src/commands/select-theme'
import { getCSSPath } from '@/src/utils'

export async function setTheme(overrideConfirmation: boolean) {
  const userConfigPath = './justd.json'
  const userConfig = JSON.parse(readFileSync(userConfigPath, 'utf8'))

  const currentTheme = userConfig.theme || 'default'

  const cssPath = await getCSSPath()

  let confirmOverride = true

  if (!overrideConfirmation) {
    confirmOverride = await confirm({
      message: `Are you sure you want to override the current theme '${currentTheme}' with others?`,
    })
    if (confirmOverride) {
    } else {
      console.log('Theme change canceled.')
    }
  } else {
    console.log('Theme change canceled.')
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
