import { availablesGrays } from "@/commands/gray"
import { error } from "@/utils/logging"
import { isTailwind } from "@/utils/helpers"

const REPO = "https://raw.githubusercontent.com/irsyadadl/justd"

const branchWorkingOn = isTailwind(3) ? "1.x" : "2.x"
const BRANCH = branchWorkingOn

const THEMES_URL = `${REPO}/refs/heads/${BRANCH}/resources/styles/themes`
/**
 *  This function is used to get the URL for the themes repo
 *  @param gray string
 *  @returns string
 */
export const getThemesRepoUrl = (gray: string): string => {
  if (!availablesGrays.includes(gray)) {
    error(`Invalid gray provided: ${gray}`)
    process.exit(1)
  }

  const selectedGray = `${THEMES_URL}/${gray}.css`

  if (!selectedGray) {
    error("Failed to get the gray url")
    process.exit(1)
  }

  return selectedGray
}

/**
 *  This function is used to get the URL for a component
 *  @param componentName string
 *  @returns string
 */
export const getRepoUrlForComponent = (componentName: string) => {
  const repoUrl = `${REPO}/${BRANCH}/components/ui/${componentName}.tsx`
  if (!repoUrl) {
    throw new Error("REPO_URL environment variable is not set")
  }
  return repoUrl
}

/**
 *  This function is used to get the URL for the classes.ts file
 *  @returns string
 */
export const getClassesTsRepoUrl = (): string => {
  const utils = `${REPO}/refs/heads/${BRANCH}/utils/classes.ts`
  if (!utils) {
    throw new Error("REPO_URL environment variable is not set")
  }
  return utils
}
