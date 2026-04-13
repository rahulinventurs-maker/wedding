"use client";

import React, { createContext, useContext } from 'react';
import { theme, Theme } from '../../theme';

const ThemeContext = createContext<Theme>(theme);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
);

export const useThemeContext = () => useContext(ThemeContext);
