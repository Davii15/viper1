"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <span className="text-2xl mr-2">🎨</span>
          Theme
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
            className="flex flex-col items-center space-y-1 h-auto py-2"
          >
            <Sun className="w-4 h-4" />
            <span className="text-xs">Light</span>
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
            className="flex flex-col items-center space-y-1 h-auto py-2"
          >
            <Moon className="w-4 h-4" />
            <span className="text-xs">Dark</span>
          </Button>
          <Button
            variant={theme === "system" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("system")}
            className="flex flex-col items-center space-y-1 h-auto py-2"
          >
            <Monitor className="w-4 h-4" />
            <span className="text-xs">System</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
