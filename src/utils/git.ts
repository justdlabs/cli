import { execSync } from "node:child_process"

/**
 * This function is used to check if the current git repository is dirty
 * @returns boolean
 */
export function isRepoDirty() {
  try {
    let stdout = execSync("git status --porcelain", { encoding: "utf-8" })
    return stdout.trim() !== ""
  } catch (error) {
    /**
     * If the error message includes "not a git repository", it means that the current directory is not a git repository.
     * In this case, we can assume that the repository is clean.
     */
    return !error?.toString?.().includes("not a git repository")
  }
}
