import { detect } from "@antfu/ni"

// This function is used to get the package manager
// It returns the package manager based on the detected package manager
// If the detected package manager is not supported, it returns 'npm'
export async function getPackageManager(): Promise<"yarn" | "pnpm" | "bun" | "npm"> {
  const packageManager = await detect({ programmatic: true })

  if (packageManager === "yarn@berry") return "yarn"
  if (packageManager === "pnpm@6") return "pnpm"
  if (packageManager === "bun") return "bun"

  return packageManager ?? "npm"
}
