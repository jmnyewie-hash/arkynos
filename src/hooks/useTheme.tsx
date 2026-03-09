import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'teal' | 'amber' | 'blue' | 'forest' | 'mono';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: ThemeOption[];
  isDark: boolean;
}

interface ThemeOption {
  id: Theme;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const themes: ThemeOption[] = [
  {
    id: 'teal',
    name: 'Teal Mint',
    description: 'Soft teal with purple accents',
    colors: {
      primary: 'hsl(258, 89%, 66%)',
      secondary: 'hsl(240, 5%, 33%)',
      accent: 'hsl(269, 100%, 98%)',
    },
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    description: 'Warm orange and gold tones',
    colors: {
      primary: 'hsl(43, 96%, 56%)',
      secondary: 'hsl(25, 95%, 53%)',
      accent: 'hsl(48, 100%, 96%)',
    },
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    description: 'Cool blues and cyans',
    colors: {
      primary: 'hsl(199, 89%, 48%)',
      secondary: 'hsl(221, 83%, 53%)',
      accent: 'hsl(204, 100%, 97%)',
    },
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural greens and earth tones',
    colors: {
      primary: 'hsl(142, 76%, 36%)',
      secondary: 'hsl(25, 5%, 45%)',
      accent: 'hsl(138, 76%, 97%)',
    },
  },
  {
    id: 'mono',
    name: 'Monochrome',
    description: 'Classic black and white (default)',
    colors: {
      primary: 'hsl(0, 0%, 9%)',
      secondary: 'hsl(0, 0%, 45%)',
      accent: 'hsl(0, 0%, 98%)',
    },
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('arkynos-theme');
    return (stored as Theme) || 'mono';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('arkynos-theme', newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('theme-teal', 'theme-amber', 'theme-blue', 'theme-forest', 'theme-mono');
  
  // Add new theme class
  root.classList.add(`theme-${theme}`);

  // Apply theme-specific CSS variables
  switch (theme) {
    case 'amber':
      root.style.setProperty('--primary', '43 96% 56%');
      root.style.setProperty('--primary-foreground', '26 83% 14%');
      root.style.setProperty('--secondary', '25 95% 53%');
      root.style.setProperty('--secondary-foreground', '0 0% 98%');
      root.style.setProperty('--accent', '48 100% 96%');
      root.style.setProperty('--accent-foreground', '43 96% 56%');
      root.style.setProperty('--ring', '43 96% 56%');
      break;
    case 'blue':
      root.style.setProperty('--primary', '199 89% 48%');
      root.style.setProperty('--primary-foreground', '0 0% 98%');
      root.style.setProperty('--secondary', '221 83% 53%');
      root.style.setProperty('--secondary-foreground', '0 0% 98%');
      root.style.setProperty('--accent', '204 100% 97%');
      root.style.setProperty('--accent-foreground', '199 89% 48%');
      root.style.setProperty('--ring', '199 89% 48%');
      break;
    case 'forest':
      root.style.setProperty('--primary', '142 76% 36%');
      root.style.setProperty('--primary-foreground', '0 0% 98%');
      root.style.setProperty('--secondary', '25 5% 45%');
      root.style.setProperty('--secondary-foreground', '0 0% 98%');
      root.style.setProperty('--accent', '138 76% 97%');
      root.style.setProperty('--accent-foreground', '142 76% 36%');
      root.style.setProperty('--ring', '142 76% 36%');
      break;
    case 'teal':
      root.style.setProperty('--primary', '258 89% 66%');
      root.style.setProperty('--primary-foreground', '250 100% 97%');
      root.style.setProperty('--secondary', '240 5% 33%');
      root.style.setProperty('--secondary-foreground', '0 0% 98%');
      root.style.setProperty('--accent', '269 100% 98%');
      root.style.setProperty('--accent-foreground', '270 91% 65%');
      root.style.setProperty('--ring', '258 89% 66%');
      break;
    default: // mono
      root.style.setProperty('--primary', '0 0% 9%');
      root.style.setProperty('--primary-foreground', '0 0% 98%');
      root.style.setProperty('--secondary', '0 0% 45%');
      root.style.setProperty('--secondary-foreground', '0 0% 98%');
      root.style.setProperty('--accent', '0 0% 98%');
      root.style.setProperty('--accent-foreground', '0 0% 9%');
      root.style.setProperty('--ring', '0 0% 9%');
      break;
  }
}