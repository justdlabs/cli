import { availableGrays } from "@/commands/change-gray"
import { isTailwind } from "@/utils/helpers"
import { error } from "@/utils/logging"

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
  if (!availableGrays.includes(gray)) {
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
 *  @param type
 *  @returns string
 */
export const getRepoUrlForComponent = (componentName: string, type: "justd" | "block") => {
  if (type === "block") {
    return `https://blocks.getjustd.com/api/registry/ui/${componentName}.tsx`
  }

  return `${REPO}/${BRANCH}/components/ui/${componentName}.tsx`
}

/**
 *  This function is used to get the URL for the classes file
 *  @param file
 *  @returns string
 */
export const getUtilsFolder = (file: string): string => {
  const utils = `${REPO}/refs/heads/${BRANCH}/utils/${file}`
  if (!utils) {
    throw new Error("REPO_URL environment variable is not set")
  }
  return utils
}
