import { input, select } from '@inquirer/prompts'
import fs from 'fs'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import chalk from 'chalk'
import { getPackageManager } from '@/src/utils/get-package-manager'
import ora from 'ora'
import { getRepoUrlForComponent } from '@/src/utils/repo'
import open from 'open'
import { existsSync } from 'node:fs'
// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Adjust the path to reference the correct resource directory relative to the compiled output
const resourceDir = path.resolve(__dirname, '../src/resources')
const stubs = path.resolve(__dirname, '../src/resources/stubs')

export async function init() {
  const cssPath = {
    laravel: 'resources/css/app.css',
    vite: 'src/index.css',
    remix: 'app/tailwind.css',
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

  // Check if Next.js config files exist
  const hasNextConfig =
    fs.existsSync('next.config.ts') || fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs')
  const hasRemixConfig = (() => {
    const packageJsonPath = path.join(process.cwd(), 'package.json')

    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      const { dependencies = {}, devDependencies = {} } = packageJson

      return '@remix-run/react' in dependencies || '@remix-run/react' in devDependencies
    }

    return false
  })()

  let rootFolder, uiFolder, cssLocation, configSourcePath, themeProvider, providers, utilsFolder

  if (hasNextConfig) {
    const projectTypeSrc = existsSync('src') && !existsSync('app')
    const hasSrc = projectTypeSrc ? 'src' : ''
    rootFolder = path.join(hasSrc, 'components')
    uiFolder = path.join(rootFolder, 'ui')
    utilsFolder = path.join(hasSrc, 'utils')
    cssLocation = projectTypeSrc ? cssPath.nextHasSrc : cssPath.nextNoSrc
    configSourcePath = path.join(stubs, 'next/tailwind.config.next.stub')
    themeProvider = path.join(stubs, 'next/theme-provider.stub')
    providers = path.join(stubs, 'next/providers.stub')
  } else if (fs.existsSync('artisan')) {
    rootFolder = 'resources/js'
    uiFolder = path.join(`${rootFolder}/components`, 'ui')
    utilsFolder = path.join(`${rootFolder}/utils`)
    cssLocation = cssPath.laravel
    configSourcePath = path.join(stubs, 'laravel/tailwind.config.laravel.stub')
    themeProvider = path.join(stubs, 'laravel/theme-provider.stub')
    providers = path.join(stubs, 'laravel/providers.stub')
  } else if (hasRemixConfig) {
    rootFolder = 'app'
    uiFolder = path.join(rootFolder, 'ui')
    utilsFolder = path.join(rootFolder, 'utils')
    cssLocation = cssPath.remix
    configSourcePath = path.join(stubs, 'next/tailwind.config.next.stub')
    themeProvider = path.join(stubs, 'next/theme-provider.stub')
    providers = path.join(stubs, 'next/providers.stub')
  } else {
    rootFolder = await input({
      message: 'Enter the path to your components folder:',
      default: 'components',
    })
    const projectTypeSrc = existsSync('src')
    const hasSrc = projectTypeSrc ? 'src' : ''
    rootFolder = path.join(hasSrc, 'components')
    uiFolder = path.join(rootFolder, 'ui')
    utilsFolder = path.join(hasSrc, 'utils')
    cssLocation = await input({
      message: 'Where would you like to place the CSS file?',
      default: cssPath.other,
    })
    configSourcePath = path.join(stubs, 'next/tailwind.config.next.stub')
    themeProvider = path.join(stubs, 'next/theme-provider.stub')
    providers = path.join(stubs, 'next/providerns.stub')
  }

  const spinner = ora(`Initializing Justd...`).start()

  // Ensure the components and UI folders exist
  if (!fs.existsSync(uiFolder)) {
    fs.mkdirSync(uiFolder, { recursive: true })
    fs.mkdirSync(utilsFolder, { recursive: true })
    spinner.succeed(`Created UI folder at ${uiFolder}`)
  } else {
    spinner.succeed(`UI folder already exists at ${uiFolder}`)
    spinner.succeed(`Utils folder already exists at ${utilsFolder}`)
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
    'justd-icons',
    'tailwindcss-animate',
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

  const fileUrl = getRepoUrlForComponent('primitive')
  const response = await fetch(fileUrl)
  const fileContent = await response.text()
  fs.writeFileSync(path.join(uiFolder, 'primitive.tsx'), fileContent, { flag: 'w' })
  spinner.succeed(`primitive.tsx file copied to ${uiFolder}`)

  const classesUrl = 'https://raw.githubusercontent.com/justdlabs/justd/refs/heads/main/utils/classes.ts'
  const responseClasses = await fetch(classesUrl)
  const fileContentClasses = await responseClasses.text()
  fs.writeFileSync(path.join(utilsFolder, 'classes.ts'), fileContentClasses, { flag: 'w' })
  spinner.succeed(`classes.ts file copied to ${utilsFolder}`)

  // Copy theme provider and providers files
  if (themeProvider) {
    const themeProviderContent = fs.readFileSync(themeProvider, 'utf8')
    fs.writeFileSync(path.join(rootFolder, 'theme-provider.tsx'), themeProviderContent, { flag: 'w' })

    if (providers) {
      const providersContent = fs.readFileSync(providers, 'utf8')
      fs.writeFileSync(path.join(rootFolder, 'providers.tsx'), providersContent, { flag: 'w' })
    }

    spinner.succeed(`Theme provider and providers files copied to ${rootFolder}`)
  }

  // Save configuration to justd.json with relative path
  if (fs.existsSync('d.json')) {
    fs.unlinkSync('d.json')
  }

  // Save configuration to 'justd.json'
  const config = {
    $schema: 'https://getjustd.com',
    ui: uiFolder,
  }
  fs.writeFileSync('justd.json', JSON.stringify(config, null, 2))
  spinner.succeed('Configuration saved to justd.json')

  // Wait for the installation to complete before proceeding
  spinner.succeed('Installation complete.')

  const continuedToAddComponent = spawn('npx justd-cli@latest add', {
    stdio: 'inherit',
    shell: true,
  })

  await new Promise<void>((resolve) => {
    continuedToAddComponent.on('close', () => {
      resolve()
    })
  })

  const visitRepo = await select({
    message: 'Hey look! You made it this far! 🌟 How about a quick star on our GitHub repo?',
    choices: [
      { name: 'Alright, take me there!', value: true },
      { name: 'Maybe next time', value: false },
    ],
    default: true,
  })

  if (visitRepo) {
    open('https://github.com/justdlabs/justd').then(() => {
      console.log(chalk.blueBright('-------------------------------------------'))
      console.log(' Thanks for your support! Happy coding! 🔥')
      console.log(chalk.blueBright('-------------------------------------------'))
    })
  } else {
    console.log(chalk.blueBright('------------------------------'))
    console.log(' Happy coding! 🔥')
    console.log(chalk.blueBright('------------------------------'))
  }

  spinner.stop()
}
