import { input, select } from "@inquirer/prompts"
import process from "process"
import { error, grayText, highlight } from "@/utils/logging"
import { executeCommand } from "./partials/execute-command"
import { Framework, FrameworkKey, FrameworkOptions, PackageManager } from "@/types"
import { setupPrettier, setupTailwind } from "@/commands/start-new-project/partials/setup"
import { createLaravelApp, createNextApp, createRemixApp, createViteApp } from "@/commands/start-new-project/partials/create-project"
import { checkIfCommandExists, checkIfDirectoryExists } from "@/commands/start-new-project/partials/checker"

const isProduction = process.env.NODE_ENV === "production"
const justdCliVersion = isProduction ? "justd-cli@latest" : "justd-cli"

const frameworks: Record<FrameworkKey, Framework> = {
  laravel: {
    name: "Laravel",
    createCommand: (packageManager, projectName, options) => createLaravelApp(packageManager, projectName, options),
  },
  next: {
    name: "Next.js",
    createCommand: (packageManager, projectName, options) => createNextApp(packageManager, projectName, options),
  },
  remix: {
    name: "Remix",
    createCommand: (packageManager, projectName) => createRemixApp(packageManager, projectName),
  },
  vite: {
    name: "Vite",
    createCommand: (packageManager, projectName) => createViteApp(packageManager, projectName),
  },
}

export async function startNewProject() {
  const startNewProject = await input({
    message: `No setup project detected. Do you want to start a new project? (Y/${grayText("n")})`,
    default: "Yes",
    validate: (value) => {
      const normalizedValue = value.trim().toLowerCase()
      return ["y", "n", "yes", "no"].includes(normalizedValue) || "Please answer yes or no."
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

    const projectName = await input({
      message: "What is your project named?",
      default: "app",
      validate: (value) => value.trim() !== "" || "Project name cannot be empty.",
    })

    if (checkIfDirectoryExists(projectName)) {
      console.info("")
      error(`The directory '${projectName}' already exists. Please choose a different name or remove the existing directory.`)
      process.exit(1)
    }

    const options: FrameworkOptions = {}

    if (framework === "laravel") {
      const testFramework = await select<string>({
        message: "Which testing framework do you want to use?",
        choices: [
          { name: "Pest", value: "pest" },
          { name: "PHPUnit", value: "phpunit" },
        ],
      })

      options.usePest = testFramework === "pest"
      const composerExists = await checkIfCommandExists("composer")

      if (!composerExists) {
        console.info("")
        error("Composer is not installed on your system. \nPlease install Composer to proceed with the Laravel setup.")
        process.exit(1)
      }
    }

    if (framework === "next") {
      const wantSrcFolder = await input({
        message: `Do you want to have a src folder? (Y/${grayText("n")})`,
        default: "Yes",
        validate: (value) => {
          const normalizedValue = value.trim().toLowerCase()
          return ["y", "n", "yes", "no", "Yes", "No"].includes(normalizedValue) || "Please answer yes or no."
        },
      })
      options.useSrc = ["y", "yes"].includes(wantSrcFolder.trim().toLowerCase())
    }

    /**
     * This question will be removed when Tailwind v4 is released as stable.
     */
    const areYouWantToUseTailwind4 = await input({
      message: `Do you want to use Tailwind version 4? (Y/${grayText("n")})`,
      default: "Yes",
      validate: (value) => {
        const normalizedValue = value.trim().toLowerCase()
        return ["y", "n", "yes", "no"].includes(normalizedValue) || "Please answer yes or no."
      },
    })

    const usePrettier = await input({
      message: `Do you want to use Prettier for this project? (Y/${grayText("n")})`,
      default: "Yes",
      validate: (value) => {
        const normalizedValue = value.trim().toLowerCase()
        return ["y", "n", "yes", "no"].includes(normalizedValue) || "Please answer yes or no."
      },
    })

    const packageManager = await select<PackageManager>({
      message: "Which package manager do you want to use?",
      choices: [
        { name: "Bun", value: "bun" },
        { name: "Yarn", value: "yarn" },
        { name: "npm", value: "npm" },
        { name: "pnpm", value: "pnpm" },
      ],
      default: "bun",
    })

    if (packageManager !== "npm") {
      const packageManagerExists = await checkIfCommandExists(packageManager)

      if (!packageManagerExists) {
        error(`${packageManager} is not installed on your system. Please install ${packageManager} to proceed.`)
        process.exit(1)
      }
    }

    const startCreatingApp = await frameworks[framework].createCommand(packageManager, projectName, options)

    await executeCommand(startCreatingApp, `Creating ${frameworks[framework].name} project.`)

    process.chdir(projectName)
    if (framework === "vite") {
      await executeCommand(setupTailwind(packageManager), "Setting up Tailwind CSS.")
      await executeCommand(["npx", "tailwindcss", "init", "-p"], "Initializing Tailwind CSS.")
    }

    /**
     * This condition will be removed when Tailwind v4 is released as stable.
     */
    if (areYouWantToUseTailwind4) {
      const upgradeTailwindCommand = ["npx", "@tailwindcss/upgrade@next", "--force"]
      await executeCommand(upgradeTailwindCommand, "Upgrading to Tailwind CSS v4.")
    }
    if (["y", "yes"].includes(usePrettier.trim().toLowerCase())) {
      await setupPrettier(packageManager)
    }

    const initJustdCommand = ["npx", justdCliVersion, "init", "--force", "--yes"]
    await executeCommand(initJustdCommand, "Finishing.")

    console.info("\nProject setup is now complete.")
    if (framework === "laravel") {
      console.info(`Start your development server by running: ${highlight(`cd ${projectName} && composer run dev`)}\n`)
    } else {
      console.info(`Start your development server by running: ${highlight(`cd ${projectName} && npm run dev`)}\n`)
    }

    console.info("Ready to customize your project?")
    console.info(`Add new components by running: ${highlight("npx justd-cli@latest add")}`)
  } else {
    process.exit(0)
  }
}
