import path from 'path'
import fs from 'fs'
import { existsSync } from 'node:fs'

export function hasFolder(folderName: string): boolean {
  const folderPath = path.join(process.cwd(), folderName)
  return fs.existsSync(folderPath)
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function possibilityCssPath(): string {
  if (fs.existsSync('artisan')) {
    return 'resources/css/app.css'
  } else if (hasFolder('app') && !fs.existsSync('artisan')) {
    return 'app/globals.css'
  } else if (hasFolder('src') && !fs.existsSync('artisan')) {
    return 'src/app/globals.css'
  }

  return 'styles.css'
}

export function possibilityComponentsPath(): string {
  if (fs.existsSync('artisan')) {
    return 'resources/js/components'
  } else if (hasFolder('src') && !fs.existsSync('artisan')) {
    return 'src/components'
  } else if (hasFolder('app') && !fs.existsSync('artisan')) {
    return 'components'
  }
  return 'components'
}

export function possibilityUtilsPath(): string {
  if (fs.existsSync('artisan')) {
    return 'resources/js/utils'
  } else if (hasFolder('app') && !fs.existsSync('artisan')) {
    return 'utils'
  } else if (hasFolder('src') && !fs.existsSync('artisan')) {
    return 'src/utils'
  }
  return 'utils'
}

export function possibilityRootPath(): string {
  if (fs.existsSync('artisan')) {
    return 'resources/js'
  } else if (hasFolder('app') && !fs.existsSync('artisan')) {
    return 'utils'
  } else if (hasFolder('src')) {
    return 'src'
  }
  return ''
}

export function isNextJs(): boolean {
  return fs.existsSync('next.config.ts') || fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs')
}

export function isRemix(): boolean {
  const packageJsonPath = path.join(process.cwd(), 'package.json')

  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const { dependencies = {}, devDependencies = {} } = packageJson

    return '@remix-run/react' in dependencies || '@remix-run/react' in devDependencies
  }

  return false
}

export function isLaravel(): boolean {
  return fs.existsSync(path.resolve(process.cwd(), 'artisan'))
}
