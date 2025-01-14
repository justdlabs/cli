import fs from "node:fs"

export function checkIfDirectoryExists(dir: string): boolean {
  return fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()
}

/**
 * Check if a command exists in the user's environment
 * @param command
 */
export async function checkIfCommandExists(command: string): Promise<boolean> {
  const { spawnSync } = await import("node:child_process")
  const result = spawnSync(command, ["--version"], { shell: true, stdio: "ignore" })
  return result.status === 0
}
