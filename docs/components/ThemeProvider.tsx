'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredTheme(): Theme | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    }
  } catch {
    // Storage restricted or unavailable
  }
  return null;
}

function setStoredTheme(next: Theme): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('theme', next);
    }
  } catch {
    // Storage restricted or unavailable
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = getStoredTheme();
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle('light', saved === 'light');
    } else {
      document.documentElement.classList.remove('light');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
    document.documentElement.classList.toggle('light', next === 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }} className="h-full">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
