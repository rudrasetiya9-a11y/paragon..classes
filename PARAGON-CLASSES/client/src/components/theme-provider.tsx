import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "blue" | "green" | "purple" | "orange";

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, but always fallback to light
    const stored = localStorage.getItem("theme") as Theme;
    if (stored && ["light", "dark", "blue", "green", "purple", "orange"].includes(stored)) {
      return stored;
    }
    
    // Always default to light theme regardless of system preference
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove("light", "dark", "blue", "green", "purple", "orange");
    
    // Add current theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const themes: Theme[] = ["light", "dark", "blue", "green", "purple", "orange"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme: updateTheme, toggleTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}