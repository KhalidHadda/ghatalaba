/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const theme = 'dark'

  useEffect(() => {
    document.documentElement.classList.remove('light-mode')
    localStorage.setItem('gt_theme', 'dark')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
