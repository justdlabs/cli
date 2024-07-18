import { input, select } from '@inquirer/prompts'
import fs from 'fs'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import chalk from 'chalk'
import { getPackageManager } from '@/src/utils/get-package-manager'
import ora from 'ora'

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Adjust the path to reference the correct resource directory relative to the compiled output
const resourceDir = path.resolve(__dirname, '../src/resources')

export async function init() {
  const cssPath = {
    laravel: 'resources/css/app.css',
    vite: 'src/index.css',
    nextHasSrc: 'src/app/globals.css',
    nextNoSrc: 'app/globals.css',
    other: 'styles/app.css',
  }

  // Check if either tailwind.config.ts or tailwind.config.js exists
  const configJsExists = fs.existsSync('tailwind.config.js')
  const configTsExists = fs.existsSync('tailwind.config.ts')

  if (!configJsExists && !configTsExists) {
    console.error(
      'No Tailwind configuration file found. Please ensure tailwind.config.ts or tailwind.config.js exists in the root directory.',
    )
    return
  }

  const projectType = await select({
    message: 'Select the project type:',
    choices: [
      { name: 'Next.js', value: 'Next.js' },
      { name: 'Laravel', value: 'Laravel' },
      { name: 'Vite', value: 'Vite' },
      { name: 'Other', value: 'Other' },
    ],
  })
  let componentsFolder, uiFolder, cssLocation, configSourcePath

  if (projectType === 'Laravel') {
    componentsFolder = 'resources/js/components'
    uiFolder = path.join(componentsFolder, 'ui')
    cssLocation = cssPath.laravel
    configSourcePath = path.join(resourceDir, 'tailwind-config/tailwind.config.laravel.stub')
  } else if (projectType === 'Vite') {
    componentsFolder = 'src/components'
    uiFolder = path.join(componentsFolder, 'ui')
    cssLocation = cssPath.vite
    configSourcePath = path.join(resourceDir, 'tailwind-config/tailwind.config.vite.stub')
  } else if (projectType === 'Next.js') {
    const projectTypeSrc = await select({
      message: 'Does this project have a src directory?',
      choices: [
        { name: 'Yes', value: true },
        { name: 'No', value: false },
      ],
      default: true,
    })
    const hasSrc = projectTypeSrc ? 'src' : ''
    componentsFolder = path.join(hasSrc, 'components')
    uiFolder = path.join(componentsFolder, 'ui')
    cssLocation = projectTypeSrc ? cssPath.nextHasSrc : cssPath.nextNoSrc
    configSourcePath = path.join(resourceDir, 'tailwind-config/tailwind.config.next.stub')
  } else {
    componentsFolder = await input({
      message: 'Enter the path to your components folder:',
      default: 'components',
    })
    uiFolder = path.join(componentsFolder, 'ui')
    cssLocation = await input({
      message: 'Where would you like to place the CSS file?',
      default: cssPath.other,
    })
    configSourcePath = path.join(resourceDir, 'tailwind-config/tailwind.config.next.stub')
  }

  const spinner = ora(`Initializing D...`).start()

  // Ensure the components and UI folders exist
  if (!fs.existsSync(uiFolder)) {
    fs.mkdirSync(uiFolder, { recursive: true })
    spinner.succeed(`Created UI folder at ${uiFolder}`)
  } else {
    spinner.succeed(`UI folder already exists at ${uiFolder}`)
  }

  // Handle CSS file placement (always overwrite)
  const cssSourcePath = path.join(resourceDir, 'tailwind-css/app.css')
  if (!fs.existsSync(path.dirname(cssLocation))) {
    fs.mkdirSync(path.dirname(cssLocation), { recursive: true })
    spinner.succeed(`Created directory for CSS at ${chalk.blue(path.dirname(cssLocation))}`)
  }
  if (fs.existsSync(cssSourcePath)) {
    try {
      const cssContent = fs.readFileSync(cssSourcePath, 'utf8')
      fs.writeFileSync(cssLocation, cssContent, { flag: 'w' })
      spinner.succeed(`CSS file copied to ${cssLocation}`)
    } catch (error) {
      // @ts-ignore
      spinner.fail(`Failed to write CSS file to ${cssLocation}: ${error.message}`)
    }
  } else {
    spinner.warn(`Source CSS file does not exist at ${cssSourcePath}`)
  }

  // Determine the target Tailwind config file based on existing files
  const tailwindConfigTarget = fs.existsSync('tailwind.config.js') ? 'tailwind.config.js' : 'tailwind.config.ts'

  // Check if the config source path exists
  if (!fs.existsSync(configSourcePath)) {
    spinner.warn(chalk.yellow(`Source Tailwind config file does not exist at ${configSourcePath}`))
    return
  }

  // Copy Tailwind configuration content (always overwrite)
  try {
    const tailwindConfigContent = fs.readFileSync(configSourcePath, 'utf8')
    fs.writeFileSync(tailwindConfigTarget, tailwindConfigContent, { flag: 'w' }) // Overwrite the existing Tailwind config
  } catch (error) {
    // @ts-ignore
    spinner.fail(`Failed to write Tailwind config to ${tailwindConfigTarget}: ${error.message}`)
  }

  const packageManager = await getPackageManager()
  const packages = [
    'react-aria-components',
    'tailwindcss-react-aria-components',
    'tailwind-variants',
    'tailwind-merge',
    'clsx',
    '@irsyadadl/paranoid',
    'tailwindcss-animate',
    'framer-motion',
  ]
    .map((component) => component)
    .join(' ')

  const action = packageManager === 'npm' ? 'i ' : 'add '
  const installCommand = `${packageManager} ${action} ${packages}`

  spinner.info(`Installing dependencies...`)
  const child = spawn(installCommand, {
    stdio: 'inherit',
    shell: true,
  })
  await new Promise<void>((resolve) => {
    child.on('close', () => {
      resolve()
    })
  })
  const fileUrl = 'https://raw.githubusercontent.com/irsyadadl/d.irsyad.co/master/components/ui/primitive.tsx'
  const response = await fetch(fileUrl)
  const fileContent = await response.text()
  fs.writeFileSync(path.join(uiFolder, 'primitive.tsx'), fileContent)
  spinner.succeed(`primitive.tsx file copied to ${uiFolder}`)

  // Save configuration to d.json with relative path
  const config = { ui: uiFolder }
  fs.writeFileSync('d.json', JSON.stringify(config, null, 2))
  spinner.succeed('Configuration saved to d.json')

  // Wait for the installation to complete before proceeding
  spinner.succeed('Installation complete.')
  spinner.stop()
}
