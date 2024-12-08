import fs from "fs"
import JSON5 from "json5"

export function readTsConfig(tsConfigPath: string) {
  let tsConfig
  const rawContent = fs.readFileSync(tsConfigPath, "utf8")
  tsConfig = JSON5.parse(rawContent)
  return tsConfig
}
