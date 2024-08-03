#!/usr/bin/env node

import { program } from 'commander'
import { add } from './commands/add'
import { init } from './commands/init'

program.command('init').option('--skip <type>', 'Skip a specific step').action(init)

program
  .command('add [components...]')
  .option('--skip <type>', 'Skip')
  .action(async (components, options) => {
    await add({ component: components.join(' '), ...options })
  })

program.parse(process.argv)
