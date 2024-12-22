export type PackageManager = "bun" | "yarn" | "pnpm" | "npm"
export type FrameworkKey = "laravel" | "next" | "remix" | "vite"
export interface Framework {
  name: string
  createCommand: (packageManager: string, projectName: string, options?: FrameworkOptions) => Promise<string[]>
}

export interface FrameworkOptions {
  usePest?: boolean
  useSrc?: boolean
}
