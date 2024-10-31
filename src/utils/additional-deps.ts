import { spawn } from "child_process"
import ora from "ora"

// This function is used to install additional dependencies for components
export const additionalDeps = async (componentName: string, packageManager: string, action: string) => {
  const dependencies: Record<string, string> = {
    toast: "sonner",
    drawer: "framer-motion",
    disclosure: "justd-icons",
    tabs: "framer-motion",
    "progress-bar": "framer-motion",
    navbar: "framer-motion",
    meter: "framer-motion",
    chart: "recharts",
    "input-otp": "input-otp",
    carousel: "embla-carousel-react",
    "command-menu": "cmdk",
    "multiple-select": "react-aria",
  }

  const dependency = dependencies[componentName]

  if (dependency) {
    const spinner = ora(`Creating...`).start()
    const installCommand = `${packageManager} ${action} ${dependency}`
    const child = spawn(installCommand, {
      stdio: "ignore",
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
