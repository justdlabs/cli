import { loadConfig } from "c12"

export const getConfig = async () => {
  const test = await loadConfig({
    name: "justd",
  })

  return test
}
