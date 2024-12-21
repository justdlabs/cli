import { input, select } from "@inquirer/prompts"
import { spawn } from "child_process"
import process from "process"
import { highlight } from "@/utils/logging"
import ora from "ora"

const isProduction = process.env.NODE_ENV === "production"
const justdCliVersion = isProduction ? "justd-cli@latest" : "justd-cli"

type FrameworkKey = "laravel" | "next" | "remix" | "vite"

interface Framework {
  name: string
  createCommand: (packageManager: string, projectName: string) => string[]
}

/**
 * This function is used to create a Next.js project
 * @param packageManager
 * @param projectName
 */
const createNextCommand = (packageManager: string, projectName: string): string[] => {
  const packageManagerFlag = packageManager === "bun" ? "--use-bun" : packageManager === "yarn" ? "--use-yarn" : packageManager === "pnpm" ? "--use-pnpm" : "--use-npm"
  return ["npx", "create-next-app@latest", "--yes", packageManagerFlag, projectName]
}

/**
 * This function is used to create a Remix project
 * @param packageManager
 * @param projectName
 */
const createRemixCommand = (packageManager: string, projectName: string): string[] => {
  return ["npx", "create-remix@latest", "--yes", `--package-manager=${packageManager}`, projectName]
}

/**
 * This function is used to create a Vite project
 * @param packageManager
 * @param projectName
 */
const createViteCommand = (packageManager: string, projectName: string): string[] => {
  switch (packageManager) {
    case "bun":
      return ["bun", "create", "vite", "--template", "react-ts", projectName]
    case "yarn":
      return ["yarn", "create", "vite", "--template", "react-ts", projectName]
    case "pnpm":
      return ["pnpm", "create", "vite", "--template", "react-ts", projectName]
    default:
      return ["npm", "create", "vite@latest", "--template", "react-ts", projectName]
  }
}

const createLaravelCommand = (_: string, projectName: string): string[] => {
  return ["laravel", "new", projectName, "--breeze", "--pest", "--stack=react", "--typescript", "--eslint", "--no-interaction"]
}

const frameworks: Record<FrameworkKey, Framework> = {
  laravel: {
    name: "Laravel",
    createCommand: createLaravelCommand,
  },
  next: {
    name: "Next.js",
    createCommand: createNextCommand,
  },
  remix: {
    name: "Remix",
    createCommand: createRemixCommand,
  },
  vite: {
    name: "Vite",
    createCommand: createViteCommand,
  },
}

export async function startNewProject() {
  const startNewProject = await input({
    message: "No setup project detected. Do you want to start a new project? (Y/n)",
    default: "Y",
    validate: (value) => {
      const normalizedValue = value.trim().toLowerCase()
      return ["y", "n", "yes", "no"].includes(normalizedValue) || "Please answer yes, no, Y, or n."
    },
  })

  if (["y", "yes"].includes(startNewProject.trim().toLowerCase())) {
    const framework = await select<FrameworkKey>({
      message: "Which framework do you want to use?",
      choices: Object.keys(frameworks).map((key) => ({
        name: frameworks[key as FrameworkKey].name,
        value: key as FrameworkKey,
      })),
    })

    const packageManager = await select<string>({
      message: "Which package manager do you want to use?",
      choices: [
        { name: "Bun", value: "bun" },
        { name: "Yarn", value: "yarn" },
        { name: "npm", value: "npm" },
        { name: "pnpm", value: "pnpm" },
      ],
      default: "bun",
    })

    const projectName = await input({
      message: "Enter the name of your new project:",
      default: "app",
      validate: (value) => value.trim() !== "" || "Project name cannot be empty.",
    })

    /**
     * This question will be removed when Tailwind v4 is released as stable.
     */
    const tailwindVersion = await input({
      message: "Which Tailwind version do you want to use? (3/4)",
      default: "4",
      validate: (value) => ["3", "4"].includes(value.trim().toLowerCase()) || "Please choose 3 or 4.",
    })

    const usePrettier = await input({
      message: "Do you want to use Prettier for this project? (Y/n)",
      default: "Y",
      validate: (value) => {
        const normalizedValue = value.trim().toLowerCase()
        return ["y", "n", "yes", "no"].includes(normalizedValue) || "Please answer yes, no, Y, or n."
      },
    })

    const createAppCommand = frameworks[framework].createCommand(packageManager, projectName)

    await executeCommand(createAppCommand, `Creating ${frameworks[framework].name} project.`)

    process.chdir(projectName)
    if (framework === "vite") {
      const setupTailwindCommand =
        packageManager === "bun"
          ? ["bun", "add", "tailwindcss", "postcss", "autoprefixer", "-d"]
          : packageManager === "yarn"
            ? ["yarn", "add", "-D", "tailwindcss", "postcss", "autoprefixer"]
            : packageManager === "pnpm"
              ? ["pnpm", "add", "-D", "tailwindcss", "postcss", "autoprefixer"]
              : ["npm", "install", "-D", "tailwindcss", "postcss", "autoprefixer"]

      await executeCommand(setupTailwindCommand, "Setting up Tailwind CSS.")
      await executeCommand(["npx", "tailwindcss", "init", "-p"], "Initializing Tailwind CSS.")
    }

    /**
     * This condition will be removed when Tailwind v4 is released as stable.
     */
    if (tailwindVersion === "4") {
      const upgradeTailwindCommand = ["npx", "@tailwindcss/upgrade@next", "--force"]
      await executeCommand(upgradeTailwindCommand, "Upgrading to Tailwind CSS v4.")
    }
    if (["y", "yes"].includes(usePrettier.trim().toLowerCase())) {
      await setupPrettier(packageManager)
    }

    const initJustdCommand = ["npx", justdCliVersion, "init", "--force", "--yes"]
    await executeCommand(initJustdCommand, "Initializing Justd.")

    console.info("\nProject setup is now complete.")
    console.info(`Start your development server by running: ${highlight(`cd ${projectName} && npm run dev`)}\n`)

    console.info("Ready to customize your project?")
    console.info(`Add new components by running: ${highlight("npx justd-cli@latest add")}`)
  } else {
    process.exit(0)
  }
}

/**
 * This function is used to execute a command
 * @param command
 * @param message
 */
async function executeCommand(command: string[], message: string) {
  const spinner = ora(message).start()
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      stdio: "ignore",
      shell: true,
    })

    child.on("error", (err) => {
      spinner.fail(`Error: ${err.message}`)
      reject(err)
    })

    child.on("close", (code) => {
      if (code !== 0) {
        spinner.fail(`Command failed: ${command.join(" ")}`)
        reject(new Error(`Command failed: ${command.join(" ")}`))
      } else {
        spinner.succeed(message)
        resolve()
      }
    })
  })
}

/**
 * This function is used to set up Prettier
 * @param packageManager
 */
async function setupPrettier(packageManager: string) {
  const prettierInstallCommand =
    packageManager === "bun"
      ? ["bun", "add", "-d", "prettier", "prettier-plugin-tailwindcss"]
      : packageManager === "yarn"
        ? ["yarn", "add", "-D", "prettier", "prettier-plugin-tailwindcss"]
        : packageManager === "pnpm"
          ? ["pnpm", "add", "-D", "prettier", "prettier-plugin-tailwindcss"]
          : ["npm", "install", "-D", "prettier", "prettier-plugin-tailwindcss"]

  await executeCommand(prettierInstallCommand, "Setting up Prettier.")

  const prettierConfig = `
{
  "tailwindFunctions": ["twJoin", "tv", "cn", "twMerge"],
  "plugins": ["prettier-plugin-tailwindcss"],
  "printWidth": 100,
  "singleQuote": false,
  "trailingComma": "none",
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true
}
`

  const fs = await import("fs/promises")
  await fs.writeFile(".prettierrc", prettierConfig.trim(), "utf8")
}
