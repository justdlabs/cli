import { spawn } from "node:child_process"
import ora from "ora"

/**
 * This function is used to execute a command
 * @param command
 * @param message
 */
export async function executeCommand(command: string[], message: string) {
  const spinner = ora(message).start()
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      stdio: "ignore",
      shell: true,
    })

    child.on("error", (err) => {
      spinner.fail(`Error: ${err.message}`)
      reject(err)
    })

    child.on("close", (code) => {
      if (code !== 0) {
        spinner.fail(`Command failed: ${command.join(" ")}`)
        reject(new Error(`Command failed: ${command.join(" ")}`))
      } else {
        spinner.succeed(message)
        resolve()
      }
    })
  })
}
