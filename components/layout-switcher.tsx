"use client"

import { Button } from "@/components/ui/button"
import { Grid, List, Minimize2 } from "lucide-react"

interface LayoutSwitcherProps {
  currentLayout: "magazine" | "card" | "minimal"
  onLayoutChange: (layout: "magazine" | "card" | "minimal") => void
}

export function LayoutSwitcher({ currentLayout, onLayoutChange }: LayoutSwitcherProps) {
  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <Button
        variant={currentLayout === "magazine" ? "default" : "ghost"}
        size="sm"
        onClick={() => onLayoutChange("magazine")}
        className="flex items-center space-x-1"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Magazine</span>
      </Button>
      <Button
        variant={currentLayout === "card" ? "default" : "ghost"}
        size="sm"
        onClick={() => onLayoutChange("card")}
        className="flex items-center space-x-1"
      >
        <Grid className="w-4 h-4" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant={currentLayout === "minimal" ? "default" : "ghost"}
        size="sm"
        onClick={() => onLayoutChange("minimal")}
        className="flex items-center space-x-1"
      >
        <Minimize2 className="w-4 h-4" />
        <span className="hidden sm:inline">Minimal</span>
      </Button>
    </div>
  )
}
