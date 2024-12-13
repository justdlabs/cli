import { spawn } from "child_process"
import ora from "ora"

/**
 * This function is used to install additional dependencies for some components
 * @param componentName
 * @param packageManager
 * @param action
 */
export const additionalDeps = async (componentName: string, packageManager: string, action: string) => {
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
    "command-menu": "cmdk",
    "multiple-select": "react-aria",
  }

  const dependency = dependencies[componentName]

  if (dependency) {
    const spinner = ora().start()
    const installCommand = `${packageManager} ${action} ${dependency}`
    const child = spawn(installCommand, {
      stdio: ["ignore", "ignore", "ignore"],
      shell: true,
    })

    await new Promise<void>((resolve) => {
      child.on("close", () => {
        spinner.stop()
        resolve()
      })
    })
  }
}
