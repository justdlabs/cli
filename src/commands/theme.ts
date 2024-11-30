import fs, { readFileSync, writeFileSync } from "fs"
import path from "path"
import chalk from "chalk"
import ora from "ora"
import { confirm, select } from "@inquirer/prompts"
import { resourceDir } from "./init"
import { getCSSPath } from "@/utils"
import { capitalize, justdConfigFile, possibilityCssPath } from "@/utils/helpers"

export async function theme(cssLocation: string): Promise<string | undefined> {
  const spinner = ora("Looking up theme...").start()
  const themes = ["default.css", "zinc.css", "neutral.css", "slate.css", "gray.css", "azure.css", "sky.css", "amber.css", "violet.css", "emerald.css", "rose.css", "turquoise.css", "orange.css"]

  spinner.stop()
  const selectedTheme = await select({
    message: "Select a theme:",
    choices: themes.map((theme) => ({ name: theme.replace(".css", ""), value: theme })),
    pageSize: 15,
  })

  const cssSourcePath = path.join(resourceDir, `themes/${selectedTheme}`)

  if (!fs.existsSync(path.dirname(cssLocation))) {
    fs.mkdirSync(path.dirname(cssLocation), { recursive: true })
  }

  if (fs.existsSync(cssSourcePath)) {
    try {
      const cssContent = fs.readFileSync(cssSourcePath, "utf8")
      fs.writeFileSync(cssLocation, cssContent, { flag: "w" })
      return selectedTheme
    } catch (error) {
      spinner.fail(`Failed to write CSS file to ${cssLocation}`)
    }
  } else {
    spinner.warn(`Source CSS file does not exist at ${cssSourcePath}`)
  }

  return undefined
}

export async function setTheme(overrideConfirmation: boolean, selectedTheme?: string) {
  const userConfigPath = "./justd.json"
  if (!fs.existsSync(userConfigPath)) {
    console.error(`${chalk.red("justd.json not found")}. ${chalk.gray(`Please run ${chalk.blue("npx justd-cli@latest init")} to initialize the project.`)}`)
    return
  }

  const userConfig = JSON.parse(readFileSync(userConfigPath, "utf8"))

  const currentTheme = userConfig.theme || "default"
  const config = JSON.parse(fs.readFileSync(justdConfigFile, "utf8"))
  let cssPath = config.css || possibilityCssPath()
  if (!overrideConfirmation) {
    cssPath = await getCSSPath()
  }

  let confirmOverride = true

  if (!overrideConfirmation) {
    confirmOverride = await confirm({
      message: `Are you sure you want to override the current theme ${chalk.blue(currentTheme)} with ${selectedTheme ? chalk.blue(capitalize(selectedTheme)) : "others"}?`,
    })

    if (!confirmOverride) {
      console.log("Theme change canceled.")
      return
    }
  }

  let _newTheme = selectedTheme || (await theme(cssPath))

  if (_newTheme) {
    const newTheme = capitalize(_newTheme.replace(".css", ""))
    userConfig.theme = newTheme

    const cssSourcePath = path.join(resourceDir, `themes/${newTheme}.css`)
    const cssContent = readFileSync(cssSourcePath, "utf8")
    writeFileSync(cssPath, cssContent, { flag: "w" })

    userConfig.css = cssPath
    writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2))
    console.log(`Theme changed to '${newTheme}'`)
  } else {
    console.log("No theme selected.")
  }
}
