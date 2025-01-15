"use client"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
const ThemeProvider = ({ children, ...props }) => {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
export { ThemeProvider, useTheme }
