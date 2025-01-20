#!/usr/bin/env node

import { program } from "commander"
import open from "open"
import packageJson from "../package.json"
import { add } from "./commands/add"
import { addBlock, loginBlock } from "./commands/blocks"
import { setGray } from "./commands/change-gray"
import { diff } from "./commands/diff"
import { help } from "./commands/help"
import { init } from "./commands/init"

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
program
  .version(version, "-v, --version", "Output the version number")
  .description("CLI Tool Description")

/**
 *  This command is used to initialize your project, it will assume you have installed tailwindcss, and your main framework or library.
 *  @param force boolean
 */
program
  .command("init")
  .option("--force", "Force initialization without checking Git")
  .option("-y, --yes", "Skip prompts and use default values")
  .option("-l, --language <language>", "Language of the project (typescript or javascript)")
  .option("--ts", "Use TypeScript for the project")
  .option("--js", "Use JavaScript for the project")
  .action((options) => {
    let language = options.language

    if (options.ts) language = "typescript"
    if (options.js) language = "javascript"

    init({ ...options, language })
  })

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
  .option("-o, --overwrite", "Override existing components")
  .action(async (components, options) => {
    await add({ components, ...options })
  })

program.command("login").action(async () => {
  await loginBlock()
})

program
  .command("block [args...]")
  .option("--skip <type>", "Skip")
  .option("-o, --overwrite", "Override existing components")
  .action(async (slugs, options) => {
    await addBlock({ slugs })
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
