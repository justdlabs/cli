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
  if (hasFolder('src')) {
    return 'src/app/globals.css'
  } else if (hasFolder('app')) {
    return 'app/globals.css'
  } else if (hasFolder('resources/css')) {
    return 'resources/css/app.css'
  }

  return 'styles.css'
}

export function possibilityComponentsPath(): string {
  if (hasFolder('src')) {
    return 'src/components'
  } else if (hasFolder('app')) {
    return 'components'
  } else if (hasFolder('resources/css')) {
    return 'resources/js/components'
  }
  return 'components'
}

export function possibilityUtilsPath(): string {
  if (hasFolder('src')) {
    return 'src/utils'
  } else if (hasFolder('app')) {
    return 'utils'
  } else if (hasFolder('resources/css')) {
    return 'resources/js/utils'
  }
  return 'utils'
}

export function possibilityRootPath(): string {
  if (hasFolder('src')) {
    return 'src'
  } else if (hasFolder('app')) {
    return 'utils'
  } else if (hasFolder('resources/css')) {
    return 'resources/js'
  }
  return ''
}
