import { spawn } from "node:child_process"
import { error, highlight } from "@/utils/logging"

/**
 * This function is used to install additional dependencies for some components
 * @param componentName
 * @param packageManager
 * @param action
 */
export const additionalDeps = async (
  componentName: string,
  packageManager: string,
  action: string,
) => {
  const dependencies: Record<string, string> = {
    toast: "sonner",
    drawer: "motion",
    disclosure: "justd-icons",
    tabs: "motion",
    "progress-bar": "motion",
    navbar: "motion",
    meter: "motion",
    chart: "recharts",
    "input-otp": "input-otp",
    carousel: "embla-carousel-react",
    "multiple-select": "react-aria",
    "visually-hidden": "react-aria",
  }

  const dependency = dependencies[componentName]

  if (dependency) {
    const installCommand = `${packageManager} ${action} ${dependency} --silent`
    const child = spawn(installCommand, {
      stdio: "ignore",
      shell: true,
    })

    await new Promise<void>((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) {
          resolve()
        } else {
          error(`Failed to install ${highlight(dependency)}. Exit code: ${code}`)
          reject(new Error(`Installation failed for ${dependency} with code ${code}`))
        }
      })

      child.on("error", (err) => {
        error(`Error while executing: ${highlight(installCommand)}`)
        reject(err)
      })
    })
  }
}
