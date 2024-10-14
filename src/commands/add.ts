import fs from 'fs'
import path from 'path'
import { checkbox } from '@inquirer/prompts'
import { components, namespaces } from '../resources/components'
import { getUtilsFolderPath, getWriteComponentPath, writeFile } from '../utils'
import chalk from 'chalk'
import { getPackageManager } from '../utils/get-package-manager'
import { additionalDeps } from '../utils/additional-deps'
import ora from 'ora'
import { getClassesTsRepoUrl, getRepoUrlForComponent } from '@/src/utils/repo'
import fetch from 'node-fetch'

async function createComponent(componentName: string) {
  const writePath = getWriteComponentPath(componentName)

  const dir = path.dirname(writePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const spinner = ora(`Creating ${componentName}...`).start()

  const url = getRepoUrlForComponent(componentName)
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch component: ${response.statusText}`)

    let content = await response.text()

    const isLaravel = fs.existsSync(path.resolve(process.cwd(), 'artisan'))

    if (isLaravel) {
      content = content.replace(/['"]use client['"]\s*\n?/g, '')
    }

    fs.writeFileSync(writePath, content)
    spinner.succeed(`${componentName} created`)
  } catch (error) {
    spinner.fail(`Error writing component to ${writePath}`)
  }
}

async function processComponent(
  componentName: string,
  packageManager: string,
  action: string,
  processed: Set<string>,
  allComponents: any[],
  override: boolean,
  isChild: boolean = false,
) {
  const componentPath = getWriteComponentPath(componentName)
  const utilsFolder = getUtilsFolderPath()
  const classesFile = path.join(utilsFolder, 'classes.ts')

  if (!fs.existsSync(classesFile)) {
    if (!fs.existsSync(utilsFolder)) {
      fs.mkdirSync(utilsFolder, { recursive: true })
    }
    const responseClasses = await fetch(getClassesTsRepoUrl())
    const fileContentClasses = await responseClasses.text()
    fs.writeFileSync(classesFile, fileContentClasses, { flag: 'w' })
  }

  if (fs.existsSync(componentPath)) {
    if (override && !isChild) {
      console.log(`${chalk.yellow('Replacing')} ${componentName}...`)
      fs.rmSync(componentPath, { recursive: true, force: true })
    } else if (isChild) {
      console.log(`${chalk.blue('ℹ')} ${componentName} already exists. Use the -o flag to override.`)
      return
    } else {
      console.warn(`${chalk.blue('ℹ')} ${componentName} already exists. Use the -o flag to override.`)
      return
    }
  }

  processed.add(componentName)

  if (!fs.existsSync(componentPath)) {
    await additionalDeps(componentName, packageManager, action)
    await createComponent(componentName)
  }

  const component = allComponents.find((c) => c.name === componentName)
  if (component && component.children) {
    for (const child of component.children) {
      await processComponent(child.name, packageManager, action, processed, allComponents, false, true)
    }
  }
}

export async function add(options: any) {
  const { component, skip, override } = options
  const configFilePath = path.join(process.cwd(), 'justd.json')
  if (!fs.existsSync(configFilePath)) {
    console.error(
      `${chalk.red('justd.json not found')}. ${chalk.gray(`Please run ${chalk.blue('npx justd-cli@latest init')} to initialize the project.`)}`,
    )
    return
  }

  const exclude = ['primitive']
  let selectedComponents = component ? component.split(' ') : []
  if (selectedComponents.length === 0) {
    const choices = components
      .filter((comp) => !exclude.includes(comp.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((comp) => ({ name: comp.name, value: comp.name }))
    selectedComponents = await checkbox({
      required: true,
      message: 'Select components to add:',
      choices: choices,
      pageSize: 17,
      loop: false,
    })
  }

  const packageManager = await getPackageManager()
  const action = packageManager === 'npm' ? 'i ' : 'add '

  const processed = new Set<string>()
  for (const componentName of selectedComponents) {
    const targetComponent = components.find((comp) => comp.name === componentName)
    if (!targetComponent) {
      console.log(chalk.yellow('No component found'))
      return
    }
    console.log(`Starting to add ${componentName}...`)

    if (namespaces.includes(componentName) && targetComponent.children) {
      for (const child of targetComponent.children) {
        await processComponent(child.name, packageManager, action, processed, components, false, true)
      }
    } else {
      await processComponent(componentName, packageManager, action, processed, components, override, false)
    }
  }
  console.log(chalk.green(`✔ All the goodies in ${options.component} are now locked and loaded.`))
}
