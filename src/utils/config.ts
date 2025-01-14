import { loadConfig } from "c12"

export const getConfig = async () => {
  const test = await loadConfig({
    name: "justd",
    configFile: "justd.json",
    defaultConfig: {},
  })

  return test
}

export const updateConfig = async (config: any) => {
  const test = await loadConfig({
    name: "justd",
    configFile: "justd.json",
    defaultConfig: {},
  })

  return test
}
