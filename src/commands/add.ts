import fs from 'fs'
import path from 'path'
import { checkbox } from '@inquirer/prompts'
import { components, namespaces } from '../resources/components'
import { getWriteComponentPath, writeFile } from '../utils'
import chalk from 'chalk'
import { getPackageManager } from '../utils/get-package-manager'
import { additionalDeps } from '../utils/additional-deps'
import ora from 'ora'

async function createComponent(componentName: string) {
  const writePath = getWriteComponentPath(componentName)

  const dir = path.dirname(writePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const spinner = ora(`Creating ${componentName}...`).start()

  const url = `https://raw.githubusercontent.com/irsyadadl/d.irsyad.co/master/components/ui/${componentName}.tsx`
  try {
    await writeFile(`${componentName} created`, url, writePath)
    spinner.succeed(`${componentName} created`)
  } catch (error) {
    // @ts-ignore
    spinner.fail(`Error writing component to ${writePath}: ${error.message}`)
  }
}

async function processComponent(
  componentName: string,
  packageManager: string,
  action: string,
  processed: Set<string>,
  allComponents: any[],
) {
  const componentPath = getWriteComponentPath(componentName)
  if (processed.has(componentName) || fs.existsSync(componentPath)) {
    console.warn(`${chalk.blue('ℹ')} ${componentName} is already in the mix or already exists.`)
    return // Skip processing and its children if already processed or exists
  }

  processed.add(componentName)

  if (!fs.existsSync(componentPath)) {
    await additionalDeps(componentName, packageManager, action)
    await createComponent(componentName)
  }

  const component = allComponents.find((c) => c.name === componentName)
  if (component && component.children) {
    for (const child of component.children) {
      await processComponent(child.name, packageManager, action, processed, allComponents)
    }
  }
}

export async function add(options: any) {
  const { component, skip } = options
  const configFilePath = path.join(process.cwd(), 'd.json')
  if (!fs.existsSync(configFilePath)) {
    console.error(
      `${chalk.red('d.json not found')}. ${chalk.gray(`Please run ${chalk.blue('npx @irsyadadl/d@latest init')} to initialize the project.`)}`,
    )
    return
  }

  const exclude = ['dialog', 'primitive', 'field', 'dynamic-overlay', 'dropdown'] // Add all the names you want to exclude here
  let selectedComponents = component ? [component] : []
  if (!component) {
    const choices = components
      .filter((comp) => !exclude.includes(comp.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((comp) => ({ name: comp.name, value: comp.name }))
    selectedComponents = await checkbox({
      required: true,
      message: 'Select components to add:',
      choices: choices,
      pageSize: 10,
      loop: false,
    })
  }

  const packageManager = await getPackageManager()
  const action = packageManager === 'npm' ? 'i ' : 'add '
  const targetComponent = components.find((comp) => comp.name === options.component)

  // Initialize a new set for each session
  const processed = new Set<string>()
  for (const componentName of selectedComponents) {
    const targetComponent = components.find((comp) => comp.name === componentName)
    if (!targetComponent) {
      console.log(chalk.yellow('No component found'))
      return
    }
    console.log(`Starting to add ${componentName}...`)

    if (namespaces.includes(componentName) && targetComponent.children) {
      // Only process the children of the component
      for (const child of targetComponent.children) {
        await processComponent(child.name, packageManager, action, processed, components)
      }
    } else {
      // Process the component and all its children
      await processComponent(componentName, packageManager, action, processed, components)
    }
  }
  console.log(chalk.green(`✔ All the goodies in ${options.component} are now locked and loaded.`))
}
