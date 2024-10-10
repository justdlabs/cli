import path from 'path'
import fs from 'fs'

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
