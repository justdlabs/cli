import fs, { readFileSync, writeFileSync } from "fs"
import ora from "ora"
import { confirm, select } from "@inquirer/prompts"
import { getCSSPath } from "@/utils"
import { isTailwind, justdConfigFile, possibilityCssPath } from "@/utils/helpers"
import { getThemesRepoUrl } from "@/utils/repo"
import { error, errorText, grayText, highlight } from "@/utils/logging"

export const availablesGrays = ["zinc", "gray", "slate", "neutral", "stone"]

export async function changeGray(cssLocation: string, flags: { yes?: boolean }): Promise<string | undefined> {
  const spinner = ora("Looking up possibilities...").start()
  const grays = availablesGrays
  spinner.stop()

  const selectedGray = flags.yes
    ? "zinc"
    : await select({
        message: "Pick your desired base gray:",
        choices: grays.map((gray) => ({ name: gray, value: gray })),
        pageSize: 15,
      })

  const response = await fetch(getThemesRepoUrl(selectedGray))
  if (!response.ok) throw new Error(`Failed to fetch color: ${response.statusText}`)
  const content = await response.text()
  writeFileSync(cssLocation, content, { flag: "w" })

  return selectedGray
}

export async function setGray(overwriteConfirmation: boolean, selectedTheme?: string) {
  if (isTailwind(3)) {
    error(`This CLI supports ${highlight("Justd 2.x")}, built with ${highlight("Tailwind v4")}. However, you're currently using ${highlight("Tailwind v3")}.`)
    process.exit(1)
  }
  const userConfigPath = "./justd.json"
  if (!fs.existsSync(userConfigPath)) {
    error(`${errorText("justd.json not found")}. ${grayText(`Please run ${highlight("npx justd-cli@latest init")} to initialize the project.`)}`)
    process.exit(1)
  }

  const userConfig = JSON.parse(readFileSync(userConfigPath, "utf8"))

  const currentGray = userConfig.gray || "zinc"
  const config = JSON.parse(fs.readFileSync(justdConfigFile, "utf8"))
  let cssPath = config.css || possibilityCssPath()
  if (!overwriteConfirmation) {
    cssPath = await getCSSPath()
  }

  let confirmOverride = true

  if (!overwriteConfirmation) {
    confirmOverride = await confirm({
      message: `You will overwrite the current theme "${highlight(currentGray)}" with ${selectedTheme ? highlight(selectedTheme) : "others"}?`,
    })

    if (!confirmOverride) {
      console.info("Theme change canceled.")
      return
    }
  }

  const _newGray = selectedTheme || (await changeGray(cssPath, { yes: false }))

  if (_newGray) {
    const newTheme = _newGray.replace(".css", "")
    userConfig.gray = newTheme

    const cssContent = await fetch(getThemesRepoUrl(newTheme))
    const content = await cssContent.text()
    writeFileSync(cssPath, content, { flag: "w" })

    userConfig.css = cssPath
    writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2))
    console.info(`✅ The gray changed to '${highlight(newTheme)}'`)
  } else {
    console.info("No gray selected.")
  }
}
