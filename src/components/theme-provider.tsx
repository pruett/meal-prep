import { createContext, useContext, useEffect } from "react"

type Theme = "light"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider(props: ThemeProviderProps) {
  const { children, storageKey = "vite-ui-theme" } = props
  useEffect(() => {
    const root = window.document.documentElement

    window.localStorage.removeItem(storageKey)
    root.classList.remove("dark")
    root.classList.add("light")
    root.style.colorScheme = "light"
  }, [storageKey])

  return (
    <ThemeProviderContext.Provider value={initialState}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
