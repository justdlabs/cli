import fs from "fs"
import path from "path"
import { checkbox } from "@inquirer/prompts"
import { components, namespaces } from "@/resources/components"
import { getUIFolderPath, getUtilsFolderPath, getWriteComponentPath } from "@/utils"
import chalk from "chalk"
import { getPackageManager } from "@/utils/get-package-manager"
import { additionalDeps } from "@/utils/additional-deps"
import ora from "ora"
import { getClassesTsRepoUrl, getRepoUrlForComponent } from "@/utils/repo"
import { getAliasFromConfig, getUIPathFromConfig, isNextJs } from "@/utils/helpers"
import { grayText, highlight, warn, warningText } from "@/utils/logging"

const exceptions = ["field", "dropdown", "dialog"]

async function updateIndexFile(componentName: string, processed: Set<string> = new Set()) {
  if (processed.has(componentName) || exceptions.includes(componentName)) {
    return
  }

  const uiPath = getUIPathFromConfig()
  const indexPath = path.join(process.cwd(), uiPath, "index.ts")
  const componentExport = `export * from './${componentName}';`

  let existingExports = ""
  if (fs.existsSync(indexPath)) {
    existingExports = fs.readFileSync(indexPath, "utf-8")
  }

  if (!namespaces.includes(componentName) && !existingExports.includes(componentExport)) {
    const newContent = existingExports.trim() + (existingExports.trim() ? "\n" : "") + componentExport + "\n"
    fs.writeFileSync(indexPath, newContent)
  }

  processed.add(componentName)

  const component = components.find((c) => c.name === componentName)
  if (component && component.children) {
    for (const child of component.children) {
      await updateIndexFile(child.name, processed)
    }
  }
}

export async function add(options: any) {
  const spinner = ora("Checking.").start()
  const { component, override } = options
  const configFilePath = path.join(process.cwd(), "justd.json")
  if (!fs.existsSync(configFilePath)) {
    spinner.fail(`${warningText("justd.json not found")}. ${grayText(`Please run ${highlight("npx justd-cli@latest init")} to initialize the project.`)}`)
    return
  }

  spinner.stop()
  const exclude = ["primitive"]
  let selectedComponents = component ? component.split(" ") : []
  if (selectedComponents.length === 0) {
    const choices = components
      .filter((comp) => !exclude.includes(comp.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((comp) => ({ name: comp.name, value: comp.name }))
    selectedComponents = await checkbox({
      required: true,
      message: "Select components to add:",
      choices: choices,
      pageSize: 17,
      loop: false,
    })
  }

  const packageManager = await getPackageManager()
  const action = packageManager === "npm" ? "i " : "add "

  const createdFiles: string[] = []
  const existingFiles = new Set<string>()
  const processed = new Set<string>()

  try {
    spinner.start("Checking.")
    for (const componentName of selectedComponents) {
      if (namespaces.includes(componentName) || exceptions.includes(componentName)) continue

      const repoUrl = getRepoUrlForComponent(componentName)
      const response = await fetch(repoUrl)
      if (!response.ok) {
        throw new Error(`Component '${componentName}' not found at ${repoUrl}`)
      }
    }
    spinner.succeed("Checking.")
  } catch (error) {
    spinner.fail(`Error looking up the component.`)
    return
  }

  spinner.start("Installing dependencies.")
  try {
    const utilsFolder = getUtilsFolderPath()
    const classesFile = path.join(utilsFolder, "classes.ts")

    if (!fs.existsSync(classesFile)) {
      if (!fs.existsSync(utilsFolder)) {
        fs.mkdirSync(utilsFolder, { recursive: true })
      }
      const responseClasses = await fetch(getClassesTsRepoUrl())
      const fileContentClasses = await responseClasses.text()
      fs.writeFileSync(classesFile, fileContentClasses, { flag: "w" })
      createdFiles.push(classesFile)
    }

    for (const componentName of selectedComponents) {
      try {
        const targetComponent = components.find((comp) => comp.name === componentName)
        if (!targetComponent) {
          warn(`Component '${highlight(componentName)}' not found in local resources.`)
          continue
        }

        const componentPath = getWriteComponentPath(componentName)
        if (fs.existsSync(componentPath) && !override) {
          existingFiles.add(`${getUIFolderPath()}/${componentName}.tsx`)
          continue
        }

        if (namespaces.includes(componentName) && targetComponent.children) {
          for (const child of targetComponent.children) {
            await processComponent(child.name, packageManager, action, processed, components, override, true, createdFiles, existingFiles)
          }
        } else {
          await processComponent(componentName, packageManager, action, processed, components, override, false, createdFiles, existingFiles)
        }

        await updateIndexFile(componentName)
      } catch (error) {
        console.error(warningText(`Error processing '${componentName}'.`))
      }
    }

    await additionalDeps(selectedComponents.join(" "), packageManager, action)

    spinner.succeed()
  } catch (error) {
    spinner.fail("Failed to install dependencies. Please check the logs for more information.")
    return
  }

  const fileWord = createdFiles.length === 1 ? "file" : "files"
  if (createdFiles.length > 0) {
    const what = override ? "Overwrite" : "Created"
    spinner.succeed(`${what} ${createdFiles.length} ${fileWord}:`)
    createdFiles.forEach((file) => console.info(`  - ${file}`))
  }

  if (existingFiles.size > 0 && !override) {
    console.info(chalk.yellow(`ℹ ${existingFiles.size} ${fileWord} already existed:`))
    Array.from(existingFiles).forEach((file) => console.info(`  - ${file}`))
  }
}

async function processComponent(componentName: string, packageManager: string, action: string, processed: Set<string>, allComponents: any[], override: boolean, isChild: boolean, createdFiles: string[], existingFiles: Set<string>) {
  if (processed.has(componentName)) return

  const componentPath = getWriteComponentPath(componentName)

  if (fs.existsSync(componentPath)) {
    if (override && !isChild) {
      fs.rmSync(componentPath, { recursive: true, force: true })
      createdFiles.push(`${getUIFolderPath()}/${componentName}.tsx`)
    } else {
      existingFiles.add(`${getUIFolderPath()}/${componentName}.tsx`)
      return
    }
  } else {
    await createComponent(componentName)
    createdFiles.push(`${getUIFolderPath()}/${componentName}.tsx`)
  }

  const component = allComponents.find((c) => c.name === componentName)
  if (component && component.children) {
    for (const child of component.children) {
      await processComponent(child.name, packageManager, action, processed, allComponents, false, true, createdFiles, existingFiles)
    }
  }

  processed.add(componentName)
}

async function createComponent(componentName: string) {
  const writePath = getWriteComponentPath(componentName)
  const dir = path.dirname(writePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const url = getRepoUrlForComponent(componentName)
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch component: ${response.statusText}`)
    let content = await response.text()

    if (!isNextJs()) {
      content = content.replace(/['"]use client['"]\s*\n?/g, "")
    }

    const alias = getAliasFromConfig()
    const aliasRegex = /import\s*{.*}\s*from\s*['"]@\/(.*)['"]/g
    content = content.replace(aliasRegex, (match) => {
      return match.replace("@/", `${alias}/`)
    })

    fs.writeFileSync(writePath, content)
  } catch (error) {
    throw new Error(`Error writing component: ${componentName}`)
  }
}
