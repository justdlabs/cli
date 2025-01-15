"use client"
import { useRouter } from "next/navigation"
import { RouterProvider } from "react-aria-components"
import { ThemeProvider } from "./theme-provider"
export function Providers({ children }) {
  const router = useRouter()
  return (
    <RouterProvider navigate={router.push}>
      <ThemeProvider enableSystem attribute="class">
        {children}
      </ThemeProvider>
    </RouterProvider>
  )
}
