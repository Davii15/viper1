"use client"

import { useTheme as useNextTheme } from "next-themes"

export function useTheme() {
  const { theme, setTheme, themes } = useNextTheme()

  const customThemes = [
    { name: "light", label: "Light", colors: "bg-white text-gray-900" },
    { name: "dark", label: "Dark", colors: "bg-gray-900 text-white" },
    { name: "african-sunset", label: "African Sunset", colors: "bg-gradient-to-br from-orange-400 to-red-600" },
    { name: "savanna", label: "Savanna", colors: "bg-gradient-to-br from-yellow-400 to-orange-500" },
    { name: "forest", label: "Forest", colors: "bg-gradient-to-br from-green-600 to-emerald-700" },
    { name: "desert", label: "Desert", colors: "bg-gradient-to-br from-amber-400 to-orange-600" },
    { name: "ocean", label: "Ocean", colors: "bg-gradient-to-br from-blue-500 to-cyan-600" },
  ]

  return {
    theme,
    setTheme,
    themes: customThemes,
  }
}
