import { availablesGrays } from "@/commands/gray"

const REPO = "https://raw.githubusercontent.com/irsyadadl/justd"
const BRANCH = "main"

const THEMES_URL = `${REPO}/refs/heads/${BRANCH}/resources/styles/themes`
export const getThemesRepoUrl = (theme: string): string => {
  if (!availablesGrays.includes(theme)) {
    throw new Error("Invalid theme provided")
  }

  const selectedTheme = `${THEMES_URL}/${theme}.css`

  if (!selectedTheme) {
    throw new Error("REPO_URL environment variable is not set")
  }

  return selectedTheme
}

export const getRepoUrlForComponent = (componentName: string) => {
  const repoUrl = `${REPO}/${BRANCH}/components/ui/${componentName}.tsx`
  if (!repoUrl) {
    throw new Error("REPO_URL environment variable is not set")
  }
  return repoUrl
}

// Getting the classes.ts file from the Justd repository
export const getClassesTsRepoUrl = (): string => {
  const utils = `${REPO}/refs/heads/${BRANCH}/utils/classes.ts`
  if (!utils) {
    throw new Error("REPO_URL environment variable is not set")
  }
  return utils
}
