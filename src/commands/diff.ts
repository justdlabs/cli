import fs from "fs"
import path from "path"
import { type Change, diffLines } from "diff"
import { checkbox } from "@inquirer/prompts"
import { getRepoUrlForComponent } from "@/utils/repo"
import chalk from "chalk"
import { add } from "@/commands/add"

/**
 * This function is used to sanitize the content of a component.
 * It removes unnecessary characters and formats the content for better readability.
 * @param configPath
 * @param componentName
 */
const getLocalComponentPath = (configPath: string, componentName: string) => {
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
  return path.join(config.ui, `${componentName}.tsx`)
}

/**
 * This function is used to fetch the content of a remote component.
 * @param componentName
 */
const fetchRemoteComponent = async (componentName: string): Promise<string> => {
  const url = getRepoUrlForComponent(componentName)
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
    .replace(/<([^>]+)\s*\n\s*([^>]+)>/g, (_, firstPart, secondPart) => `<${firstPart} ${secondPart}>`)
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
 * This function is used to format the output of a diff.
 * @param diff
 */
const formatDiffOutput = (diff: Change[]): string => {
  return diff
    .map((part) => {
      const symbol = part.added ? "+" : part.removed ? "-" : " "
      const colorFn = part.added ? chalk.green : part.removed ? chalk.red : chalk.reset

      if (!part.value) return ""

      return part.value
        .split("\n")
        .map((line: string) => {
          const formattedLine = `${symbol} ${line.trim()}`
          return colorFn(formattedLine)
        })
        .join("\n")
    })
    .join("\n")
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
    const configPath = path.resolve(process.cwd(), "justd.json")
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
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

    for (const componentName of componentNames) {
      const localComponentPath = getLocalComponentPath(configPath, componentName)
      const localContent = fs.readFileSync(localComponentPath, "utf-8")

      try {
        const remoteContent = await fetchRemoteComponent(componentName)
        const diffs = compareComponents(localContent, remoteContent)

        if (diffs.length > 0) {
          console.info(`Differences found in ${componentName}:`)
          const formattedDiff = formatDiffOutput(diffs)
          process.stdout.write(formattedDiff + "\n\n")
          changedComponents.push(componentName)
        } else {
          console.info(`${chalk.green(`✔ ${componentName}`)} is up to date.`)
        }
      } catch (error: any) {
        // Skip the component if it's not found
      }
    }

    if (changedComponents.length > 0) {
      const selectedComponents = await checkbox({
        message: "Select components to update",
        choices: [
          ...changedComponents.map((componentName) => ({
            title: componentName,
            value: componentName,
          })),
        ],
        // @ts-ignore - initial is not a valid option for checkbox, but it's not used anyway
        initial: changedComponents,
      })
      await add({ component: selectedComponents.join(" "), overwrite: true, successMessage: "Updating components..." })
    } else {
      console.log(chalk.green("✔ All components are up to date."))
    }
  } catch (error: any) {
    console.error(chalk.red("Error checking differences:"), error.message)
  }
}
