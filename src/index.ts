#!/usr/bin/env node

import { program } from "commander"
import { add } from "./commands/add"
import { init } from "./commands/init"
import { diff } from "./commands/diff"
import { help } from "./commands/help"
import { setGray } from "./commands/change-gray"
import packageJson from "../package.json"
import open from "open"

const version = packageJson.version

/**
 *  This function is used to check if the CLI is being run with the --version or -v flag
 */
const args = process.argv.slice(2)
if (args.includes("--version") || args.includes("-v")) {
  console.log(packageJson.version)
  process.exit(0)
}

/**
 *  This command is used to display the version number of the CLI
 *  @param version string
 *  @param force boolean
 *  @param description string
 */
program.version(version, "-v, --version", "Output the version number").description("CLI Tool Description")

/**
 *  This command is used to initialize your project, it will assume you have installed tailwindcss, and your main framework or library.
 *  @param force boolean
 */
program.command("init").option("--force", "Force initialization without checking Git").option("-y, --yes", "Skip prompts and use default values").action(init)

/**
 *  This command is used to add new components to your project
 *  You can also add multiple components at once by separating them with a space (npx justd-cli@latest add aside avatar button)
 *  You can also all by using (npx justd-cli@latest add) then just press `a` and then `enter`
 *  @param components string
 *  @param options any
 */
program
  .command("add [components...]")
  .option("--skip <type>", "Skip")
  .option("-o, --override", "Override existing components")
  .action(async (components, options) => {
    await add({ component: components.join(" "), ...options })
  })

/**
 *  This command is used to change the current gray
 *  You can see the full theme list here: https://getjustd.com/themes
 *  @param grayName string
 *  @param options any
 */
program
  .command("change-gray [name]")
  .description("Change the current gray")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (grayName, options) => {
    await setGray(options.yes, grayName)
  })

/**
 * This command will open the theme customization page
 */
program
  .command("theme")
  .description("Open theme customization page")
  .action(async () => {
    await open("https://getjustd.com/themes")
  })

/**
 *  This command will show differences between local and remote components (justd repo)
 *  @param components string[]
 */
program
  .command("diff [components...]")
  .description("Show differences between local and remote components")
  .action(async (components) => {
    await diff(...components)
  })

/**
 *  This function is used to display the help information for the CLI
 *  @param program Command
 */
help(program)

program.parse(process.argv)
