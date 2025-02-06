import type { FrameworkOptions } from "@/types"
import type { Config } from "@/utils/config"

export const createLaravelApp = async (
  packageManager: string,
  projectName: string,
  language: Config["language"],
  options?: FrameworkOptions,
): Promise<string[]> => {
  const commands = [
    "composer",
    "create-project",
    "laravel/laravel",
    projectName,
    "&&",
    "cd",
    projectName,
    "&&",
  ]

  const lockFileName =
    packageManager === "bun"
      ? "bun.lockb"
      : packageManager === "pnpm"
        ? "pnpm-lock.yaml"
        : packageManager === "yarn"
          ? "yarn.lock"
          : null

  if (lockFileName) {
    commands.push(`node -e "require('fs').writeFileSync('${lockFileName}', '')"`, "&&")
  }

  commands.push(
    "composer",
    "require",
    "laravel/breeze",
    "--dev",
    "&&",
    "php",
    "artisan",
    "breeze:install",
    "react",
    "--ssr",
    language === "typescript" ? "--typescript" : "",
    "--no-interaction",
  )

  if (options?.usePest) {
    commands.push("--pest")
  }

  return commands
}

/**
 * This function is used to create a Next.js project
 * @param packageManager
 * @param projectName
 * @param language
 * @param options
 */
export const createNextApp = async (
  packageManager: string,
  projectName: string,
  language: Config["language"],
  options?: FrameworkOptions,
): Promise<string[]> => {
  const packageManagerFlag =
    packageManager === "bun"
      ? "--use-bun"
      : packageManager === "yarn"
        ? "--use-yarn"
        : packageManager === "pnpm"
          ? "--use-pnpm"
          : "--use-npm"

  const commands = [
    "npx create-next-app@latest",
    projectName,
    "--tailwind",
    "--turbopack",
    "--eslint",
    language === "typescript" ? "--ts" : "--js",
    "--app",
    "--import-alias='@/*'",
    packageManagerFlag,
  ]

  if (options?.useSrc) {
    commands.push("--src-dir")
  } else {
    commands.push("--no-src-dir")
  }
  return commands
}

/**
 * This function is used to create a Remix project
 * @param packageManager
 * @param projectName
 */
export const createRemixApp = async (
  packageManager: string,
  projectName: string,
): Promise<string[]> => {
  return ["npx", "create-remix@latest", "--yes", `--package-manager=${packageManager}`, projectName]
}

/**
 * This function is used to create a Vite project
 * @param packageManager
 * @param projectName
 */
export const createViteApp = async (
  packageManager: string,
  projectName: string,
): Promise<string[]> => {
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
