import { readFileSync, writeFileSync } from 'fs'
import { confirm } from '@inquirer/prompts'
import { capitalize, selectTheme } from '@/src/commands/select-theme'
import { getCSSPath } from '@/src/utils'

export async function setTheme() {
  const userConfigPath = './justd.json' // path to the user config file
  const userConfig = JSON.parse(readFileSync(userConfigPath, 'utf8'))

  const currentTheme = userConfig.theme || 'default'

  const _newTheme = await selectTheme(getCSSPath())

  if (_newTheme) {
    const newTheme = _newTheme ? capitalize(_newTheme.replace('.css', '')) : undefined
    const confirmOverride = await confirm({
      message: `Are you sure you want to override the current theme '${currentTheme}' with '${newTheme}'?`,
    })

    if (confirmOverride) {
      userConfig.theme = newTheme
      writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2))
      console.log(`Theme changed to '${newTheme}'`)
    } else {
      console.log('Theme change canceled.')
    }
  } else {
    console.log('No theme selected.')
  }
}
