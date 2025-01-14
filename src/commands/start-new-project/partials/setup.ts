import type { PackageManager } from "@/types"
import { executeCommand } from "./execute-command"

export function setupTailwind(packageManager: PackageManager) {
  return packageManager === "bun"
    ? ["bun", "add", "tailwindcss", "postcss", "autoprefixer", "-d"]
    : packageManager === "yarn"
      ? ["yarn", "add", "-D", "tailwindcss", "postcss", "autoprefixer"]
      : packageManager === "pnpm"
        ? ["pnpm", "add", "-D", "tailwindcss", "postcss", "autoprefixer"]
        : ["npm", "install", "-D", "tailwindcss", "postcss", "autoprefixer"]
}

/**
 * This function is used to set up Prettier
 * @param packageManager
 */
export async function setupPrettier(packageManager: string) {
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

  const fs = await import("node:fs/promises")
  await fs.writeFile(".prettierrc", prettierConfig.trim(), "utf8")
}
