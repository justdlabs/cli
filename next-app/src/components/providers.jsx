"use client";
import { ThemeProvider } from "./theme-provider";
import { useRouter } from "next/navigation";
import { RouterProvider } from "react-aria-components";
export function Providers({ children }) {
	const router = useRouter();
	return <RouterProvider navigate={router.push}>
      <ThemeProvider enableSystem attribute="class">{children}</ThemeProvider>
    </RouterProvider>;
}