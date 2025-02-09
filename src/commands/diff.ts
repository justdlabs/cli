import fs from "node:fs"
import path from "node:path"
import { add } from "@/commands/add"
import { type Config, configManager } from "@/utils/config"
import { grayText, highlight, warningText } from "@/utils/logging"
import { getRepoUrlForComponent } from "@/utils/repo"
import { checkbox } from "@inquirer/prompts"
import chalk from "chalk"
import { diffLines } from "diff"
import ora from "ora"

/**
 * This function is used to sanitize the content of a component.
 * It removes unnecessary characters and formats the content for better readability.
 * @param config
 * @param componentName
 */
const getLocalComponentPath = (config: Config, componentName: string) => {
  return path.join(config.ui, `${componentName}.tsx`)
}

/**
 * This function is used to fetch the content of a remote component.
 * @param componentName
 */
const fetchRemoteComponent = async (componentName: string): Promise<string> => {
  const url = getRepoUrlForComponent(componentName, "justd")
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch component: ${response.statusText}`)
  return response.text()
}

/**
 * This function is used to compare the content of two components.
 * It removes unnecessary characters and formats the content for better readability.
 * @param content
 */
const sanitizeContent = (content: string): string => {
  return content
    .replace(/['"]use client['"];/g, "")
    .replace(/['"]use client['"]\n/g, "")
    .replace(/"/g, "'")
    .replace(/,\s*([\]}])/g, "$1")
    .replace(/\s*;\s*$/gm, "")
    .replace(/\r?\n/g, "\n")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .replace(/(\w+):\s*'([^']*)'/g, (match, key, classNames) => {
      const sortedClassNames = classNames.split(" ").sort().join(" ")
      return `${key}: '${sortedClassNames}'`
    })
    .replace(/(\d+):\s*'([^']*)'/g, (_match, key, classNames) => {
      const sortedClassNames = classNames.split(" ").sort().join(" ")
      return `${key}: '${sortedClassNames}'`
    })
    .replace(/,\s*}/g, "}")
    .replace(/>\s*\n\s*</g, "><")
    .replace(
      /<([^>]+)\s*\n\s*([^>]+)>/g,
      (_, firstPart, secondPart) => `<${firstPart} ${secondPart}>`,
    )
    .replace(/(\w+)<\s*\n\s*/g, (_, word) => `${word}<`)
    .replace(/\(([^)]+)\)\s*=>/g, (_match, params) => {
      const normalizedParams = params.replace(/\s*\n\s*/g, " ").trim()
      return `(${normalizedParams}) =>`
    })
    .replace(/className:\s*'([^']+)'/g, (match, classNames) => {
      const sortedClassNames = classNames.split(" ").sort().join(" ")
      return `className: '${sortedClassNames}'`
    })
    .replace(/(<[^>]+)\s+([a-zA-Z-]+)=/g, "$1 $2=")
    .trim()
}
/**
 * This function is used to compare the content of two components.
 * It removes unnecessary characters and formats the content for better readability.
 * @param localContent
 * @param remoteContent
 */
const compareComponents = (localContent: string, remoteContent: string) => {
  const sanitizedLocal = sanitizeContent(localContent)
  const sanitizedRemote = sanitizeContent(remoteContent)

  const diff = diffLines(sanitizedLocal, sanitizedRemote)
  return diff.filter((part) => part.added || part.removed)
}

/**
 * This function is used to compare the content of two components.
 * It removes unnecessary characters and formats the content for better readability.
 * @param args
 */

export const diff = async (...args: string[]) => {
  try {
    const spinner = ora("Checking.").start()

    const doesConfigExist = await configManager.doesConfigExist()

    if (!doesConfigExist) {
      spinner.fail(
        `${warningText("justd.json not found")}. ${grayText(`Please run ${highlight("npx justd-cli@latest init")} to initialize the project.`)}`,
      )
      return
    }

    const config = await configManager.loadConfig()

    const componentsDir = config.ui

    const excludeComponents = ["index"]

    let componentNames = fs
      .readdirSync(componentsDir)
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => path.basename(file, ".tsx"))
      .filter((name) => !excludeComponents.includes(name))

    if (args.length > 0) {
      componentNames = componentNames.filter((name) => args.includes(name))
    }

    const changedComponents: string[] = []
    const upToDateComponents: string[] = []

    for (const componentName of componentNames) {
      const localComponentPath = getLocalComponentPath(config, componentName)
      const localContent = fs.readFileSync(localComponentPath, "utf-8")

      try {
        const remoteContent = await fetchRemoteComponent(componentName)
        const diffs = compareComponents(localContent, remoteContent)

        if (diffs.length > 0) {
          changedComponents.push(componentName)
        } else {
          upToDateComponents.push(componentName)
        }
      } catch (error: any) {
        // Skip the component if it's not found
      }
    }

    spinner.succeed("Checking.")

    console.log(chalk.green("\nUp-to-date components:"))
    upToDateComponents.forEach((component) => console.log(chalk.green(`✔ ${component}`)))

    console.log("\n")

    console.log(chalk.yellow("Changed components:"))
    changedComponents.forEach((component) => console.log(chalk.red(`- ${component}`)))

    console.log("\n")

    if (changedComponents.length > 0) {
      const selectedComponents = await checkbox({
        message: "Select components to update",
        pageSize: 15,
        choices: [
          ...changedComponents.map((componentName) => ({
            title: componentName,
            value: componentName,
          })),
        ],
        // @ts-ignore - initial is not a valid option for checkbox
        initial: changedComponents,
      })

      await add({
        components: selectedComponents,
        overwrite: true,
        successMessage: "Updating components...",
        prioritize: "justd",
      })
    } else {
      console.log(chalk.green("✔ All components are up to date."))
    }
  } catch (error: any) {
    console.error(chalk.red("Error checking differences:"), error.message)
  }
}
