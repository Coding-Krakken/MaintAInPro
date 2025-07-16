import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

// Theme context
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

// Theme provider component
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    // Check localStorage first, then default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }

      // Check system preference
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        return 'dark';
      }
    }

    return defaultTheme;
  });

  const toggleTheme = React.useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  // Apply theme to document
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const value = React.useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Dark mode toggle component
interface DarkModeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

export function DarkModeToggle({
  size = 'md',
  variant = 'icon',
  className,
}: DarkModeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  if (variant === 'button') {
    return (
      <Button
        variant='outline'
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        onClick={toggleTheme}
        className={className}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <>
            <MoonIcon className={sizeClasses[size]} />
            <span className='ml-2'>Dark Mode</span>
          </>
        ) : (
          <>
            <SunIcon className={sizeClasses[size]} />
            <span className='ml-2'>Light Mode</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`${buttonSizeClasses[size]} rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <MoonIcon
          className={`${sizeClasses[size]} text-secondary-600 dark:text-secondary-400`}
        />
      ) : (
        <SunIcon
          className={`${sizeClasses[size]} text-secondary-600 dark:text-secondary-400`}
        />
      )}
    </button>
  );
}
