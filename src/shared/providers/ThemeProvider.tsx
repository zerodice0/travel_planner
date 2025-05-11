'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // 테마 업데이트 함수
  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    
    // HTML 클래스 업데이트
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
  };

  // 시스템 테마 감지 및 적용
  useEffect(() => {
    setMounted(true);
    
    // 초기 시스템 테마 감지
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    updateTheme(prefersDark ? 'dark' : 'light');
    
    // 시스템 테마 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      updateTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  // 렌더링 전 상태 방지 (flashing 방지)
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
} 