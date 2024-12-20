import { input, select } from "@inquirer/prompts"
import { spawn } from "child_process"
import process from "process"
import { highlight, success } from "@/utils/logging"

const isProduction = process.env.NODE_ENV === "production"
const justdCliVersion = isProduction ? "justd-cli@latest" : "justd-cli"

type FrameworkKey = "laravel" | "next" | "remix" | "vite"

interface Framework {
  name: string
  createCommand: (packageManager: string, projectName: string) => string[]
}

const createNextCommand = (packageManager: string, projectName: string): string[] => {
  const packageManagerFlag = packageManager === "bun" ? "--use-bun" : packageManager === "yarn" ? "--use-yarn" : packageManager === "pnpm" ? "--use-pnpm" : "--use-npm"
  return ["npx", "create-next-app@latest", "--yes", packageManagerFlag, projectName]
}

const createRemixCommand = (packageManager: string, projectName: string): string[] => {
  return ["npx", "create-remix@latest", "--yes", `--package-manager=${packageManager}`, projectName]
}

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
  return ["laravel", "new", projectName, "--breeze", "--pest", "--stack=react", "--typescript", "--eslint", "--no-interaction", "-q"]
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
    message: "No setup project detected. Do you want to start a new project? (yes/no)",
    default: "yes",
    validate: (value) => ["yes", "no"].includes(value.trim().toLowerCase()) || "Please answer yes or no.",
  })

  if (startNewProject.toLowerCase() === "yes") {
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

    const createAppCommand = frameworks[framework].createCommand(packageManager, projectName)

    await executeCommand(createAppCommand)

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

      await executeCommand(setupTailwindCommand)
      await executeCommand(["npx", "tailwindcss", "init", "-p"])
    }

    /**
     * This condition will be removed when Tailwind v4 is released as stable.
     */
    if (tailwindVersion === "4") {
      const upgradeTailwindCommand = ["npx", "@tailwindcss/upgrade@next", "--force", "--silent"]
      await executeCommand(upgradeTailwindCommand)
    }

    const initJustdCommand = ["npx", justdCliVersion, "init", "--force", "--yes"]
    await executeCommand(initJustdCommand)
    success(`\nProject setup complete!`)
    console.info(`To get started, run: ${highlight(`cd ${projectName} && npm run dev`)}\n`)
  } else {
    process.exit(0)
  }
}

async function executeCommand(command: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      stdio: "inherit",
      shell: true,
    })

    child.on("error", (err) => {
      reject(err)
    })

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed: ${command.join(" ")}`))
      } else {
        resolve()
      }
    })
  })
}
