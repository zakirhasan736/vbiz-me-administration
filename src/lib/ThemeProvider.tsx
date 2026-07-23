'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { setDashboardAccent, type DashboardAccentId } from '@/redux/features/designSettings/designSettings.slice'
import React, { createContext, useContext, useEffect } from 'react'

type AccentColor = DashboardAccentId

interface ThemeContextType {
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
}

const themeColors: Record<AccentColor, Record<string, string>> = {
  indigo: {
    '--primary-50': '#eef2ff',
    '--primary-100': '#e0e7ff',
    '--primary-200': '#c7d2fe',
    '--primary-300': '#a5b4fc',
    '--primary-400': '#818cf8',
    '--primary-500': '#6366f1',
    '--primary-600': '#4f46e5',
    '--primary-700': '#4338ca',
    '--primary-800': '#3730a3',
    '--primary-900': '#312e81',
    '--primary-950': '#1e1b4b',
  },
  emerald: {
    '--primary-50': '#ecfdf5',
    '--primary-100': '#d1fae5',
    '--primary-200': '#a7f3d0',
    '--primary-300': '#6ee7b7',
    '--primary-400': '#34d399',
    '--primary-500': '#10b981',
    '--primary-600': '#059669',
    '--primary-700': '#047857',
    '--primary-800': '#065f46',
    '--primary-900': '#064e3b',
    '--primary-950': '#022c22',
  },
  amber: {
    '--primary-50': '#fffbeb',
    '--primary-100': '#fef3c7',
    '--primary-200': '#fde68a',
    '--primary-300': '#fcd34d',
    '--primary-400': '#fbbf24',
    '--primary-500': '#f59e0b',
    '--primary-600': '#d97706',
    '--primary-700': '#b45309',
    '--primary-800': '#92400e',
    '--primary-900': '#78350f',
    '--primary-950': '#451a03',
  },
  rose: {
    '--primary-50': '#fff1f2',
    '--primary-100': '#ffe4e6',
    '--primary-200': '#fecdd3',
    '--primary-300': '#fda4af',
    '--primary-400': '#fb7185',
    '--primary-500': '#f43f5e',
    '--primary-600': '#e11d48',
    '--primary-700': '#be123c',
    '--primary-800': '#9f1239',
    '--primary-900': '#881337',
    '--primary-950': '#4c0519',
  },
  sky: {
    '--primary-50': '#f0f9ff',
    '--primary-100': '#e0f2fe',
    '--primary-200': '#bae6fd',
    '--primary-300': '#7dd3fc',
    '--primary-400': '#38bdf8',
    '--primary-500': '#0ea5e9',
    '--primary-600': '#0284c7',
    '--primary-700': '#0369a1',
    '--primary-800': '#075985',
    '--primary-900': '#0c4a6e',
    '--primary-950': '#082f49',
  },
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const accentColor = useAppSelector((s) => s.designSettings.dashboardAccent)

  useEffect(() => {
    localStorage.setItem('theme-accent', accentColor)

    Object.entries(themeColors[accentColor]).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
  }, [accentColor])

  const setAccentColor = (color: AccentColor) => {
    dispatch(setDashboardAccent(color))
  }

  return <ThemeContext.Provider value={{ accentColor, setAccentColor }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
