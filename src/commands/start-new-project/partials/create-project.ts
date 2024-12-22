import { FrameworkOptions } from "@/types"

export const createLaravelApp = async (packageManager: string, projectName: string, options?: FrameworkOptions): Promise<string[]> => {
  const commands = ["composer", "create-project", "laravel/laravel", projectName, "&&", "cd", projectName, "&&"]

  const lockFileName = packageManager === "bun" ? "bun.lockb" : packageManager === "pnpm" ? "pnpm-lock.yaml" : packageManager === "yarn" ? "yarn.lock" : null

  if (lockFileName) {
    commands.push(`node -e "require('fs').writeFileSync('${lockFileName}', '')"`, "&&")
  }

  commands.push("composer", "require", "laravel/breeze", "--dev", "&&", "php", "artisan", "breeze:install", "react", "--ssr", "--typescript", "--eslint", "--no-interaction")

  if (options?.usePest) {
    commands.push("--pest")
  }

  return commands
}

/**
 * This function is used to create a Next.js project
 * @param packageManager
 * @param projectName
 * @param options
 */
export const createNextApp = async (packageManager: string, projectName: string, options?: FrameworkOptions): Promise<string[]> => {
  const packageManagerFlag = packageManager === "bun" ? "--use-bun" : packageManager === "yarn" ? "--use-yarn" : packageManager === "pnpm" ? "--use-pnpm" : "--use-npm"

  const commands = ["npx create-next-app@latest", "--yes", packageManagerFlag]

  commands.push(projectName)

  return commands
}

/**
 * This function is used to create a Remix project
 * @param packageManager
 * @param projectName
 */
export const createRemixApp = async (packageManager: string, projectName: string): Promise<string[]> => {
  return ["npx", "create-remix@latest", "--yes", `--package-manager=${packageManager}`, projectName]
}

/**
 * This function is used to create a Vite project
 * @param packageManager
 * @param projectName
 */
export const createViteApp = async (packageManager: string, projectName: string): Promise<string[]> => {
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
