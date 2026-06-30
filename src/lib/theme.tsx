import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useStore } from './store'

export type Theme = {
  sidebar: string
  sidebarText: string
  accent: string
  bg: string
  surface: string
  text: string
  muted: string
  border: string
}

export const PRESETS: Record<string, Theme> = {
  Lavender: {
    sidebar: '#8b7fb8', sidebarText: '#ffffff', accent: '#4fd1c5',
    bg: '#f6f5fb', surface: '#ffffff', text: '#2d2a3a', muted: '#8a8699', border: '#e8e6f0',
  },
  Rose: {
    sidebar: '#b87f93', sidebarText: '#ffffff', accent: '#f6a5b8',
    bg: '#fbf5f7', surface: '#ffffff', text: '#3a2a30', muted: '#998690', border: '#f0e6ea',
  },
  Ocean: {
    sidebar: '#3f6f9c', sidebarText: '#ffffff', accent: '#4fd1c5',
    bg: '#f1f6fb', surface: '#ffffff', text: '#1f2d3a', muted: '#7e8a99', border: '#dfe8f0',
  },
  Forest: {
    sidebar: '#4f7a5e', sidebarText: '#ffffff', accent: '#e0b15a',
    bg: '#f3f8f4', surface: '#ffffff', text: '#243029', muted: '#7e8f84', border: '#e0ece4',
  },
  Midnight: {
    sidebar: '#2a2740', sidebarText: '#ffffff', accent: '#9d8df1',
    bg: '#1b1a26', surface: '#26243a', text: '#ecebf5', muted: '#9b97b5', border: '#3a3753',
  },
}

const VAR_MAP: Record<keyof Theme, string> = {
  sidebar: '--color-sidebar',
  sidebarText: '--color-sidebar-text',
  accent: '--color-accent',
  bg: '--color-bg',
  surface: '--color-surface',
  text: '--color-text',
  muted: '--color-muted',
  border: '--color-border',
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  for (const key of Object.keys(VAR_MAP) as (keyof Theme)[]) {
    root.style.setProperty(VAR_MAP[key], theme[key])
  }
}

type ThemeCtx = {
  theme: Theme
  setTheme: (t: Theme) => void
  applyPreset: (name: string) => void
}

const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useStore<Theme>('theme', PRESETS.Lavender)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const applyPreset = (name: string) => {
    const preset = PRESETS[name]
    if (preset) setTheme(preset)
  }

  return <Ctx.Provider value={{ theme, setTheme, applyPreset }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
