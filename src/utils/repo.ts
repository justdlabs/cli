export const getRepoUrlForComponent = (componentName: string) => {
  const repoUrl = `https://raw.githubusercontent.com/justdlabs/justd/main/components/ui/${componentName}.tsx`
  if (!repoUrl) {
    throw new Error('REPO_URL environment variable is not set')
  }
  return repoUrl
}

// Getting the classes.ts file from the Justd repository
export const getClassesTsRepoUrl = (): string => {
  const utils = `https://raw.githubusercontent.com/justdlabs/justd/refs/heads/main/utils/classes.ts`
  if (!utils) {
    throw new Error('REPO_URL environment variable is not set')
  }
  return utils
}
