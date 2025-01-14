import { execSync } from "node:child_process"
import fs from "node:fs"

/**
 * This function is used to check if the current git repository is dirty
 * @returns boolean
 */
export function isRepoDirty() {
  if (!fs.existsSync(".git")) {
    return false
  }

  try {
    const stdout = execSync("git status --porcelain", { encoding: "utf-8" })
    return stdout.trim() !== ""
  } catch (error) {
    return !error?.toString?.().includes("not a git repository")
  }
}
