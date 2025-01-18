import * as React from 'react';

const initialState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext(initialState);

export function ThemeProvider({ children, defaultTheme = 'system', storageKey = 'vite-ui-theme', ...props }) {
  const [theme, setTheme] = React.useState(() => localStorage.getItem(storageKey) || defaultTheme);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    if (theme === 'light' || theme === 'dark') {
      root.classList.add(theme);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme) => {
      if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
        localStorage.setItem(storageKey, newTheme);
        setTheme(newTheme);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
