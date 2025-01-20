import fs from "node:fs"
import path from "node:path"
import { components, namespaces } from "@/resources/components"
import { additionalDeps } from "@/utils/additional-deps"
import { type Config, configManager, getWriteComponentPath } from "@/utils/config"
import { getPackageManager } from "@/utils/get-package-manager"
import { getUIPathFromConfig } from "@/utils/helpers"
import { error, grayText, highlight, warn, warningText } from "@/utils/logging"
import { getRepoUrlForComponent, getUtilsFolder } from "@/utils/repo"
import { checkbox } from "@inquirer/prompts"
import chalk from "chalk"
import ora from "ora"

import { writeCodeFile } from "@/utils"
import { readUser } from "rc9"
import { FILENAME } from "./blocks"

const exceptions = ["field", "dropdown", "dialog"]

/**
 *  This function is used to update the index.ts file
 *  @param componentName string
 *  @param processed Set<string>
 */
async function updateIndexFile(
  config: Config,
  componentName: string,
  processed: Set<string> = new Set(),
) {
  if (processed.has(componentName)) {
    return
  }

  const uiPath = getUIPathFromConfig()
  const indexPath = path.join(
    process.cwd(),
    uiPath,
    `index.${config.language === "javascript" ? "js" : "ts"}`,
  )

  const primitiveExport = `export * from './primitive';`
  const componentExport = `export * from './${componentName}';`

  let existingExports: string[] = []
  if (fs.existsSync(indexPath)) {
    existingExports = fs
      .readFileSync(indexPath, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "")
  }

  /**
   * Filter out the existing exports that are not related to the component being added.
   * This ensures that only the necessary exports are included in the index file.
   */
  existingExports = existingExports.filter((line) => {
    const match = line.match(/export \* from '\.\/(.+)';/)
    const matchedComponent = match?.[1]
    return matchedComponent !== "primitive" && !namespaces.includes(matchedComponent ?? "")
  })

  /**
   * If the component is not already exported, add it to the existing exports.
   * This ensures that the component is properly exported and included in the index file.
   */
  if (!existingExports.includes(componentExport)) {
    existingExports.push(componentExport)
  }

  /**
   * Sort the existing exports and add the primitive export at the beginning.
   * This ensures that the primitive export is always included first in the index file.
   */
  existingExports = [primitiveExport, ...existingExports.sort()]

  fs.writeFileSync(indexPath, `${existingExports.join("\n")}\n`, { flag: "w" })

  processed.add(componentName)

  /**
   * If the component has child components, recursively update the index file for each child component.
   */
  const component = components.find((c) => c.name === componentName)
  if (component?.children) {
    for (const child of component.children) {
      await updateIndexFile(config, child.name, processed)
    }
  }
}

/**
 *  This function is used to add new components to the project
 *  @param options any
 */
export async function add(options: {
  components: string[]
  overwrite: boolean
  successMessage: string
}) {
  const spinner = ora("Checking.").start()
  const { overwrite, successMessage, components: comps } = options

  const doesConfigExist = await configManager.doesConfigExist()

  if (!doesConfigExist) {
    spinner.fail(
      `${warningText("justd.json not found")}. ${grayText(`Please run ${highlight("npx justd-cli@latest init")} to initialize the project.`)}`,
    )
    return
  }

  const config = await configManager.loadConfig()

  spinner.stop()

  const exclude = ["primitive"]
  let selectedComponents = comps

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
  let type: "justd" | "block" = "justd"

  try {
    spinner.start("Checking.")

    const fetchPromises = selectedComponents
      .filter(
        (componentName: string) =>
          !namespaces.includes(componentName) && !exceptions.includes(componentName),
      )
      .map(async (componentName: string) => {
        const repoUrl = getRepoUrlForComponent(componentName, "justd")
        const response = await fetch(repoUrl)

        if (!response.ok) {
          const userConfig = readUser(FILENAME)
          const blockUrl = getRepoUrlForComponent(componentName, "block")

          const response = await fetch(blockUrl, {
            headers: {
              "x-api-key": userConfig?.key,
            },
          })

          if (!response.ok) {
            error(`Component '${componentName}' not found at ${repoUrl}`)
            process.exit(1)
          }

          type = "block"

          return response
        }

        return response
      })

    await Promise.all(fetchPromises)
    spinner.succeed("Checking.")
  } catch (error) {
    spinner.fail("Error looking up the component.")
    return
  }

  spinner.start("Installing dependencies.")

  try {
    const classesFile = path.join(
      config.utils,
      `classes.${config.language === "javascript" ? "js" : "ts"}`,
    )

    if (!fs.existsSync(classesFile)) {
      if (!fs.existsSync(config.utils)) {
        fs.mkdirSync(config.utils, { recursive: true })
      }
      const responseClasses = await fetch(getUtilsFolder("classes.ts"))
      const fileContentClasses = await responseClasses.text()

      await writeCodeFile(config, {
        ogFilename: "classes.ts",
        writePath: classesFile,
        content: fileContentClasses,
      })
      createdFiles.push(classesFile)
    }

    if (
      selectedComponents.some((component: string) =>
        ["popover", "dialog", "sidebar", "navbar", "command-menu", "number-field"].includes(
          component,
        ),
      )
    ) {
      const mediaQueryFile = path.join(
        config.utils,
        `use-media-query.${config.language === "javascript" ? "js" : "ts"}`,
      )

      if (!fs.existsSync(mediaQueryFile)) {
        const responseMediaQuery = await fetch(getUtilsFolder("use-media-query.ts"))
        const fileContentMediaQuery = await responseMediaQuery.text()

        await writeCodeFile(config, {
          ogFilename: "use-media-query.ts",
          writePath: mediaQueryFile,
          content: fileContentMediaQuery,
        })

        createdFiles.push(mediaQueryFile)
      }
    }

    try {
      // Process components in parallel
      await Promise.all(
        selectedComponents.map(async (componentName: string) => {
          try {
            // spinner.text = `Creating component: ${componentName}`
            const targetComponent = components.find((comp) => comp.name === componentName)
            if (!targetComponent && type === "justd") {
              warn(`Component '${highlight(componentName)}' not found in local resources.`)
              return
            }

            const componentPath = getWriteComponentPath(config, componentName)
            if (fs.existsSync(componentPath) && !overwrite) {
              existingFiles.add(componentPath)
              return
            }

            if (namespaces.includes(componentName) && targetComponent && targetComponent.children) {
              await Promise.all(
                targetComponent.children.map((child: any) =>
                  processComponent(config, {
                    componentName: child.name,
                    packageManager,
                    action,
                    processed,
                    allComponents: components,
                    overwrite,
                    isChild: true,
                    createdFiles,
                    existingFiles,
                    type,
                  }),
                ),
              )
            } else {
              await processComponent(config, {
                componentName,
                packageManager,
                action,
                processed,
                allComponents: components,
                overwrite,
                isChild: false,
                createdFiles,
                existingFiles,
                type,
              })
            }

            await updateIndexFile(config, componentName)
          } catch (error) {
            console.error(warningText(`Error processing '${componentName}'.`))
          }
        }),
      )

      const allComponentNames = components
        .filter((comp) => !exclude.includes(comp.name) && !namespaces.includes(comp.name))
        .map((comp) => comp.name)

      const isAllSelected = selectedComponents.length === allComponentNames.length

      if (isAllSelected) {
        await Promise.all(
          Object.keys(additionalDeps).map((componentName) =>
            additionalDeps(componentName, packageManager, action),
          ),
        )
      } else {
        await Promise.all(
          selectedComponents.map((componentName: string) =>
            additionalDeps(componentName, packageManager, action),
          ),
        )
      }

      spinner.succeed("Creating components.")
    } catch (error) {
      spinner.fail("Failed to create components.")
      process.exit(1)
    }

    spinner.succeed()
  } catch (error) {
    spinner.fail("Failed to create components.")
    process.exit(1)
  }

  const fileWord = createdFiles.length === 1 ? "file" : "files"
  if (createdFiles.length > 0) {
    const uniqueCreatedFiles = Array.from(new Set(createdFiles))
    const what = overwrite ? "Overwrite" : "Created"

    if (successMessage) {
      spinner.succeed(`Updated ${uniqueCreatedFiles.length} ${fileWord}:`)
    } else {
      spinner.succeed(`${what} ${uniqueCreatedFiles.length} ${fileWord}:`)
    }

    uniqueCreatedFiles.forEach((file) => console.info(`  - ${file}`))
  }

  if (existingFiles.size > 0 && !overwrite) {
    console.info(chalk.yellow(`ℹ ${existingFiles.size} ${fileWord} already existed:`))
    Array.from(existingFiles).forEach((file) => console.info(`  - ${file}`))
  }
}

/**
 *  This function is used to process a component
 * @param config
 * @param options
 */
async function processComponent(
  config: Config,
  options: {
    componentName: string
    packageManager: string
    action: string
    processed: Set<string>
    allComponents: any[]
    overwrite: boolean
    isChild: boolean
    createdFiles: string[]
    existingFiles: Set<string>
    type: "justd" | "block"
  },
) {
  if (options.processed.has(options.componentName)) return

  const componentPath = getWriteComponentPath(config, options.componentName)

  /**
   * If the component already exists, and the overwrite flag is not set, we will skip the component
   * and move on to the next one.
   * If the overwrite flag is set, we will delete the existing component and create a new one.
   * We will also add the new component to the createdFiles array.
   */
  if (fs.existsSync(componentPath)) {
    if (options.overwrite && !options.isChild) {
      fs.rmSync(componentPath, { recursive: true, force: true })
      await createComponent(config, options.componentName, options.type)
      options.createdFiles.push(getWriteComponentPath(config, options.componentName))
    } else {
      options.existingFiles.add(getWriteComponentPath(config, options.componentName))
      return
    }
  } else {
    await createComponent(config, options.componentName, options.type)
    options.createdFiles.push(getWriteComponentPath(config, options.componentName))
  }

  const component = options.allComponents.find((c) => c.name === options.componentName)
  if (component?.children) {
    for (const child of component.children) {
      await processComponent(config, { ...options, componentName: child.name })
    }
  }

  options.processed.add(options.componentName)
}

/**
 *  This function is used to create a new component
 *  @param config
 *  @param componentName string
 */
async function createComponent(config: Config, componentName: string, type: "justd" | "block") {
  const writePath = getWriteComponentPath(config, componentName)
  const dir = path.dirname(writePath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const url = getRepoUrlForComponent(componentName, type)
  try {
    const userConfig = readUser(FILENAME)
    const response = await fetch(url, {
      headers: {
        "x-api-key": userConfig?.key,
      },
    })

    if (!response.ok) {
      error(`Failed to fetch component: ${response.statusText}`)
      process.exit(1)
    }

    const content = await response.text()

    await writeCodeFile(config, { writePath, ogFilename: `${componentName}.tsx`, content })
  } catch (err) {
    console.log(err)
    error(`Error writing component: ${componentName}`)
    process.exit(1)
  }
}
