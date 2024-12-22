import fs from "fs"

export function checkIfDirectoryExists(dir: string): boolean {
  return fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()
}

/**
 * Check if a command exists in the user's environment
 * @param command
 */
export async function checkIfCommandExists(command: string): Promise<boolean> {
  const { spawnSync } = await import("child_process")
  const result = spawnSync(command, ["--version"], { shell: true, stdio: "ignore" })
  return result.status === 0
}
