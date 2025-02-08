import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { stubs } from "@/commands/init"
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
 * This function is used to set up BiomeJS
 * @param packageManager
 */
export async function setupBiome(packageManager: string) {
  const biomeInstallCommand =
    packageManager === "bun"
      ? ["bun", "add", "-d", "@biomejs/biome"]
      : packageManager === "yarn"
        ? ["yarn", "add", "-D", "@biomejs/biome"]
        : packageManager === "pnpm"
          ? ["pnpm", "add", "-D", "@biomejs/biome"]
          : ["npm", "install", "-D", "@biomejs/biome"]

  await executeCommand(biomeInstallCommand, "Setting up Biome.")

  await executeCommand(["npx", "biome", "init"], "Initializing Biome.")

  const sourceConfigPath = path.join(stubs, "biome.json")
  const targetPath = path.resolve("biome.json")

  const fromPath = readFileSync(sourceConfigPath, "utf8")
  writeFileSync(targetPath, fromPath, { flag: "w" })
}
