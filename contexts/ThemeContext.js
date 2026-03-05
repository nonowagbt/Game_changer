import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, colors as defaultColors } from '../theme/colors';

const THEME_KEY = 'app_theme';

const ThemeContext = createContext({
  colors: defaultColors,
  isDark: true,
  toggleTheme: () => { },
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        const dark = saved !== 'light';
        setIsDark(dark);
        applyTheme(dark);
      } catch (_) { }
    })();
  }, []);

  // Appliquer le thème en mutant l'objet colors exporté
  // → tous les écrans qui importent { colors } voient le changement au prochain render
  const applyTheme = (dark) => {
    const theme = dark ? darkTheme : lightTheme;
    Object.keys(theme).forEach((key) => {
      defaultColors[key] = theme[key];
    });
  };

  const toggleTheme = async () => {
    const newDark = !isDark;
    setIsDark(newDark);
    applyTheme(newDark);
    try {
      await AsyncStorage.setItem(THEME_KEY, newDark ? 'dark' : 'light');
    } catch (_) { }
  };

  const currentColors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ colors: currentColors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
