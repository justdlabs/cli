import { router } from '@inertiajs/react';
import { ThemeProvider } from './theme-provider';
import React from 'react';
import { RouterProvider } from 'react-aria-components';

export function Providers({ children }) {
  return (
    <RouterProvider navigate={(to, options) => router.visit(to, options)}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        {children}
      </ThemeProvider>
    </RouterProvider>
  );
}
