import { Command } from 'commander'
import packageJson from '../../package.json'

const version = packageJson.version

export function help(program: Command) {
  program
    .command('help [command]')
    .description('Show help information')
    .action((commandName) => {
      console.log(`CLI Tool v${version}\n`) // Print version

      if (commandName) {
        const command = program.commands.find((cmd) => cmd.name() === commandName)
        if (command) {
          command.outputHelp() // Show help for specific command
        } else {
          console.log(`Command "${commandName}" not found.`)
        }
      } else {
        program.outputHelp() // Show general help
      }
    })
}
