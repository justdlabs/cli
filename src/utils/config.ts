import * as fs from "node:fs/promises"
import * as path from "node:path"

import { type } from "arktype"

const configType = type({
  $schema: "string = 'https://getjustd.com/schema.json'",
  ui: "string",
  utils: "string",
  gray: "string = 'zinc'",
  css: "string",
  "alias?": "string",
})

export type Config = typeof configType.infer

interface ConfigOptions {
  filePath: string
  defaultConfig?: Config
}

export class ConfigManager {
  private filePath: string

  constructor(options: ConfigOptions) {
    this.filePath = path.resolve(process.cwd(), options.filePath)
  }

  async doesConfigExist(): Promise<boolean> {
    try {
      await fs.access(this.filePath)
      return true
    } catch (error) {
      return false
    }
  }

  async loadConfig(): Promise<Config> {
    const data = await fs.readFile(this.filePath, "utf-8")
    const out = configType(data)

    if (out instanceof type.errors) {
      throw new Error(`Failed to parse config: ${out.message}`)
    }

    return out
  }

  async updateConfig(updates: Partial<Config>): Promise<Config> {
    try {
      const currentConfig = await this.loadConfig()
      const updatedConfig = { ...currentConfig, ...updates }
      await fs.writeFile(this.filePath, JSON.stringify(updatedConfig, null, 2), "utf-8")
      return updatedConfig
    } catch (error) {
      throw new Error(`Failed to update config: ${error}`)
    }
  }

  async createConfig(config: Config): Promise<Config> {
    try {
      const dirPath = path.dirname(this.filePath)
      await fs.mkdir(dirPath, { recursive: true })
      await fs.writeFile(this.filePath, JSON.stringify(config, null, 2), "utf-8")
      return config
    } catch (error) {
      throw new Error(`Failed to create config: ${error}`)
    }
  }
}

export const configManager = new ConfigManager({
  filePath: "justd.json",
})
