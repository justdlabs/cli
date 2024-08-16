export const getRepoUrlForComponent = (componentName: string) => {
  const repoUrl = `https://raw.githubusercontent.com/justdlabs/justd/master/components/ui/${componentName}.tsx`
  if (!repoUrl) {
    throw new Error('REPO_URL environment variable is not set')
  }
  return repoUrl
}
