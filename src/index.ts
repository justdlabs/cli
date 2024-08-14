#!/usr/bin/env node

import { program } from 'commander'
import { add } from './commands/add'
import { init } from './commands/init'
import { diff } from './commands/diff'
import { help } from '@/src/commands/help'
import fs from 'fs'
import path from 'path'

const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'))
const version = packageJson.version

program.version(version, '-v, --version', 'Output the version number').description('CLI Tool Description')

program.command('init').option('--skip <type>', 'Skip a specific step').action(init)

program
  .command('add [components...]')
  .option('--skip <type>', 'Skip')
  .option('-o, --override', 'Override existing components')
  .action(async (components, options) => {
    await add({ component: components.join(' '), ...options })
  })

program
  .command('diff [components...]')
  .description('Show differences between local and remote components')
  .action(async (components) => {
    await diff(...components)
  })

help(program)

program.parse(process.argv)
