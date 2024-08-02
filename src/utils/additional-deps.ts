import { spawn } from 'child_process'
import ora from 'ora'

export const additionalDeps = async (componentName: string, packageManager: string, action: string) => {
  const dependencies: Record<string, string> = {
    accordion: 'framer-motion',
    toast: 'sonner',
    meter: 'framer-motion',
    drawer: 'framer-motion',
    tabs: 'framer-motion',
    'progress-bar': 'framer-motion',
    'input-otp': 'input-otp',
    carousel: 'embla-carousel-react',
    'command-menu': 'cmdk',
    'multi-select': 'cmdk',
  }

  const dependency = dependencies[componentName]

  if (dependency) {
    const spinner = ora(`Creating...`).start()
    const installCommand = `${packageManager} ${action} ${dependency}`
    const child = spawn(installCommand, {
      stdio: 'ignore',
      shell: true,
    })

    await new Promise<void>((resolve) => {
      child.on('close', () => {
        spinner.stop()
        resolve()
      })
    })
  }
}
