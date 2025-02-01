import fs, { writeFileSync } from "node:fs"
import { getCSSPath } from "@/utils"
import { configManager } from "@/utils/config"
import { isTailwind, justdConfigFile, possibilityCssPath } from "@/utils/helpers"
import { error, errorText, grayText, highlight } from "@/utils/logging"
import { getThemesRepoUrl } from "@/utils/repo"
import { confirm, select } from "@inquirer/prompts"
import ora from "ora"

export const availableGrays = ["zinc", "gray", "slate", "neutral", "stone"]

export async function changeGray(
  cssLocation: string,
  flags: { yes?: boolean },
): Promise<string | undefined> {
  const spinner = ora("Looking up possibilities...").start()
  const grays = availableGrays
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
    error(
      `This CLI supports ${highlight("Justd 2.x")}, built with ${highlight("Tailwind v4")}. However, you're currently using ${highlight("Tailwind v3")}.`,
    )
    process.exit(1)
  }

  const doesConfigExist = await configManager.doesConfigExist()

  if (!doesConfigExist) {
    error(
      `${errorText("justd.json not found")}. ${grayText(`Please run ${highlight("npx justd-cli@latest init")} to initialize the project.`)}`,
    )
    process.exit(1)
  }

  const userConfig = await configManager.loadConfig()

  const config = JSON.parse(fs.readFileSync(justdConfigFile, "utf8"))
  let cssPath = config.css || possibilityCssPath()
  if (!overwriteConfirmation) {
    cssPath = await getCSSPath()
  }

  let confirmOverride = true

  if (!overwriteConfirmation) {
    confirmOverride = await confirm({
      message: `You will overwrite the current theme ${highlight(userConfig.gray)} with ${selectedTheme ? highlight(selectedTheme) : "others"}?`,
    })

    if (!confirmOverride) {
      console.info("Theme change canceled.")
      return
    }
  }

  const _newGray = selectedTheme || (await changeGray(cssPath, { yes: false }))

  if (_newGray) {
    const newTheme = _newGray.replace(".css", "")

    const cssContent = await fetch(getThemesRepoUrl(newTheme))
    const content = await cssContent.text()
    writeFileSync(cssPath, content, { flag: "w" })

    await configManager.updateConfig({
      gray: newTheme,
      css: cssPath,
    })
    console.info(`✅ The gray changed to '${highlight(newTheme)}'`)
  } else {
    console.info("No gray selected.")
  }
}
