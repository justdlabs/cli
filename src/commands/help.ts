import type { Command } from "commander"
import packageJson from "../../package.json"

/**
 *  This variable is used to store the version of the CLI
 */
const version = packageJson.version

/**
 *  This function is used to display the help information for the CLI
 *  @param program Command
 */
export function help(program: Command) {
  program
    .command("help [command]")
    .description("Show help information")
    .action((commandName) => {
      console.log(`CLI Tool v${version}\n`)

      if (commandName) {
        const command = program.commands.find((cmd) => cmd.name() === commandName)
        if (command) {
          command.outputHelp()
        } else {
          console.log(`Command "${commandName}" not found.`)
        }
      } else {
        program.outputHelp()
      }
    })
}
