import { detect } from "@antfu/ni"

/**
 * This function is used to detect the package manager used by the user
 * @returns "yarn" | "pnpm" | "bun" | "npm" | "deno"
 */
export async function getPackageManager(): Promise<"yarn" | "pnpm" | "bun" | "npm" | "deno"> {
  const packageManager = await detect({ programmatic: true })

  if (packageManager === "yarn@berry") return "yarn"
  if (packageManager === "pnpm@6") return "pnpm"
  if (packageManager === "bun") return "bun"

  return packageManager ?? "npm"
}
