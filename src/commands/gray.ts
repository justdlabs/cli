import fs, { readFileSync, writeFileSync } from "fs"
import ora from "ora"
import { confirm, select } from "@inquirer/prompts"
import { getCSSPath } from "@/utils"
import { justdConfigFile, possibilityCssPath } from "@/utils/helpers"
import { getThemesRepoUrl } from "@/utils/repo"
import { errorText, grayText, highlight } from "@/utils/logging"

export const availablesGrays = ["zinc", "gray", "slate", "neutral", "stone"]

export async function gray(cssLocation: string): Promise<string | undefined> {
  const spinner = ora("Looking up possibilities...").start()
  const grays = availablesGrays

  spinner.stop()
  const selectedTheme = await select({
    message: "Select a gray:",
    choices: grays.map((theme) => ({ name: theme, value: theme })),
    pageSize: 15,
  })

  const response = await fetch(getThemesRepoUrl(selectedTheme))
  if (!response.ok) throw new Error(`Failed to fetch gray: ${response.statusText}`)
  let content = await response.text()
  writeFileSync(cssLocation, content, { flag: "w" })

  return selectedTheme
}

export async function setGray(overrideConfirmation: boolean, selectedTheme?: string) {
  const userConfigPath = "./justd.json"
  if (!fs.existsSync(userConfigPath)) {
    console.error(`${errorText("justd.json not found")}. ${grayText(`Please run ${highlight("npx justd-cli@latest init")} to initialize the project.`)}`)
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
      message: `You will override the current theme "${highlight(currentTheme)}" with ${selectedTheme ? highlight(selectedTheme) : "others"}?`,
    })

    if (!confirmOverride) {
      console.log("Theme change canceled.")
      return
    }
  }

  let _newTheme = selectedTheme || (await gray(cssPath))

  if (_newTheme) {
    const newTheme = _newTheme.replace(".css", "")
    userConfig.theme = newTheme

    const cssContent = await fetch(getThemesRepoUrl(newTheme))
    const content = await cssContent.text()
    writeFileSync(cssPath, content, { flag: "w" })

    userConfig.css = cssPath
    writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2))
    console.log(`✅ The gray changed to '${highlight(newTheme)}'`)
  } else {
    console.log("No gray selected.")
  }
}
