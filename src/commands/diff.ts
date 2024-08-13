import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import { diffLines } from 'diff'
import { checkbox } from '@inquirer/prompts'
import { getRepoUrlForComponent } from '@/src/utils/repo'

const getLocalComponentPath = (configPath: string, componentName: string) => {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  return path.join(config.ui, `${componentName}.tsx`)
}

const fetchRemoteComponent = async (componentName: string): Promise<string> => {
  const url = getRepoUrlForComponent(componentName)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch component: ${response.statusText}`)
  return response.text()
}

const compareComponents = (localContent: string, remoteContent: string) => {
  const diff = diffLines(localContent, remoteContent)
  return diff.filter((part) => part.added || part.removed)
}

export const diff = async (...args: string[]) => {
  try {
    const configPath = path.resolve(process.cwd(), 'justd.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const componentsDir = config.ui

    const excludeComponents = ['index']

    let componentNames = fs
      .readdirSync(componentsDir)
      .filter((file) => file.endsWith('.tsx'))
      .map((file) => path.basename(file, '.tsx'))
      .filter((name) => !excludeComponents.includes(name))

    if (args.length > 0) {
      componentNames = componentNames.filter((name) => args.includes(name))
    }

    const changedComponents: string[] = []

    for (const componentName of componentNames) {
      const localComponentPath = getLocalComponentPath(configPath, componentName)
      const localContent = fs.readFileSync(localComponentPath, 'utf-8')
      const remoteContent = await fetchRemoteComponent(componentName)

      const diffs = compareComponents(localContent, remoteContent)
      if (diffs.length > 0) {
        console.log(`Differences found in ${componentName}:`)
        diffs.forEach((part) => {
          const symbol = part.added ? '+' : '-'
          process.stdout.write(
            part.value
              .split('\n')
              .map((line) => `${symbol} ${line}`)
              .join('\n'),
          )
        })
        console.log('\n')
        changedComponents.push(componentName)
      } else {
        console.log(`${componentName} is up to date.`)
      }
    }

    // Add an option for "None" to the list of changed components
    if (changedComponents.length > 0) {
      const selectedComponents = await checkbox({
        message: 'Select components to update',
        choices: [
          ...changedComponents.map((componentName) => ({
            title: componentName,
            value: componentName,
          })),
        ],
        // @ts-ignore
        initial: changedComponents,
      })

      if (selectedComponents.includes('none') || selectedComponents.length === 0) {
        console.log('No components selected for update.')
        return
      }

      for (const componentName of selectedComponents) {
        try {
          const remoteContent = await fetchRemoteComponent(componentName)
          const localComponentPath = getLocalComponentPath(configPath, componentName)
          fs.writeFileSync(localComponentPath, remoteContent)
          console.log(`Updated ${componentName}`)
        } catch (error: any) {
          console.error(`Error updating ${componentName}: ${error.message}`)
        }
      }
    } else {
      console.log('All components are up to date.')
    }
  } catch (error: any) {
    console.error('Error checking differences:', error.message)
  }
}
