import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ColorTheme {
  name: string;
  gradient: string;
  containerBg: string;
  preview: string;
}

export const colorThemes: Record<string, ColorTheme> = {
  purple: {
    name: "Purple Dream",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    containerBg: "rgba(255, 255, 255, 0.15)",
    preview: "from-[#667eea] to-[#764ba2]"
  },
  ocean: {
    name: "Ocean Blue",
    gradient: "linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)",
    containerBg: "rgba(255, 255, 255, 0.18)",
    preview: "from-[#2E3192] to-[#1BFFFF]"
  },
  sunset: {
    name: "Sunset Orange",
    gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)",
    containerBg: "rgba(255, 255, 255, 0.2)",
    preview: "from-[#FF6B6B] to-[#FFE66D]"
  },
  forest: {
    name: "Forest Green",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    containerBg: "rgba(255, 255, 255, 0.18)",
    preview: "from-[#11998e] to-[#38ef7d]"
  },
  rose: {
    name: "Rose Pink",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    containerBg: "rgba(255, 255, 255, 0.18)",
    preview: "from-[#f093fb] to-[#f5576c]"
  }
};

interface ClassroomThemeContextType {
  selectedTheme: string;
  setSelectedTheme: (theme: string) => void;
  currentTheme: ColorTheme;
}

const ClassroomThemeContext = createContext<ClassroomThemeContextType | undefined>(undefined);

interface ClassroomThemeProviderProps {
  children: ReactNode;
}

export function ClassroomThemeProvider({ children }: ClassroomThemeProviderProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>("purple");

  const currentTheme = colorThemes[selectedTheme] || colorThemes.purple;

  return (
    <ClassroomThemeContext.Provider value={{
      selectedTheme,
      setSelectedTheme,
      currentTheme
    }}>
      {children}
    </ClassroomThemeContext.Provider>
  );
}

export function useClassroomTheme() {
  const context = useContext(ClassroomThemeContext);
  // If context is not available, return default values
  if (context === undefined) {
    return {
      selectedTheme: "purple",
      setSelectedTheme: () => {},
      currentTheme: colorThemes.purple
    };
  }
  return context;
}

