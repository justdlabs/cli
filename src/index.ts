#!/usr/bin/env node

import { program } from "commander"
import { add } from "./commands/add"
import { init } from "./commands/init"
import { diff } from "./commands/diff"
import { help } from "./commands/help"
import { setGray } from "./commands/gray"
import packageJson from "../package.json"

const version = packageJson.version

const args = process.argv.slice(2)
if (args.includes("--version") || args.includes("-v")) {
  console.log(packageJson.version)
  process.exit(0)
}

//  Version: this command is used to display the version number of the CLI
program.version(version, "-v, --version", "Output the version number").description("CLI Tool Description")

//  Init: this command is used to initialize your project, it will assume you have installed tailwindcss, and your main framework or library.
program.command("init").option("--force", "Force initialization without checking Git").action(init)

//  Add: this command is used to add new components to your project
//  You can also add multiple components at once by separating them with a space (npx justd-cli@latest add aside avatar button)
//  You can also all by using (npx justd-cli@latest add) then just press `a` and then `enter`
program
  .command("add [components...]")
  .option("--skip <type>", "Skip")
  .option("-o, --override", "Override existing components")
  .action(async (components, options) => {
    await add({ component: components.join(" "), ...options })
  })

//  Theme: this command useful when you want to switch your current theme
//  You can see the full theme list here: https://getjustd.com/themes
program
  .command("gray [name]")
  .description("Change the current gray")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (grayName, options) => {
    await setGray(options.yes, grayName)
  })

// Diff: this command will show differences between local and remote components (justd repo)
program
  .command("diff [components...]")
  .description("Show differences between local and remote components")
  .action(async (components) => {
    await diff(...components)
  })

help(program)

program.parse(process.argv)
