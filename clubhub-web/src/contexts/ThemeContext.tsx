"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon, Palette, Sparkles } from 'lucide-react';

type Theme = 'light' | 'warm-light' | 'deep-dark' | 'vibrant-dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  getThemeName: (theme: Theme) => string;
  getThemeIcon: (theme: Theme) => React.ReactNode;
  getAllThemes: () => { value: Theme; name: string; icon: React.ReactNode }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEMES: { value: Theme; name: string; icon: React.ReactNode }[] = [
  { 
    value: 'light', 
    name: 'Clean Light', 
    icon: <Sun size={16} />
  },
  { 
    value: 'warm-light', 
    name: 'Warm Light', 
    icon: <Palette size={16} />
  },
  { 
    value: 'deep-dark', 
    name: 'Deep Dark', 
    icon: <Moon size={16} />
  },
  { 
    value: 'vibrant-dark', 
    name: 'Vibrant Dark', 
    icon: <Sparkles size={16} />
  }
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'light';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'deep-dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    // Validate that the saved theme is one of our supported themes
    const isValidTheme = THEMES.some(t => t.value === initialTheme);
    const finalTheme = isValidTheme ? initialTheme : 'light';
    
    setThemeState(finalTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.value === theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setThemeState(THEMES[nextIndex].value);
  };

  const setTheme = (newTheme: Theme) => {
    if (THEMES.some(t => t.value === newTheme)) {
      setThemeState(newTheme);
    }
  };

  const getThemeName = (themeValue: Theme): string => {
    const themeObj = THEMES.find(t => t.value === themeValue);
    return themeObj ? themeObj.name : 'Unknown Theme';
  };

  const getThemeIcon = (themeValue: Theme): React.ReactNode => {
    const themeObj = THEMES.find(t => t.value === themeValue);
    return themeObj ? themeObj.icon : <Sun size={16} />;
  };

  const getAllThemes = () => THEMES;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setTheme, 
      getThemeName, 
      getThemeIcon,
      getAllThemes 
    }}>
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