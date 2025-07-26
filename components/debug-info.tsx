"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bug, ChevronDown, ChevronUp } from "lucide-react"

interface DebugInfoProps {
  data: any
  title: string
}

export function DebugInfo({ data, title }: DebugInfoProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center text-yellow-800">
            <Bug className="w-4 h-4 mr-2" />
            Debug: {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-yellow-800 hover:bg-yellow-100"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      )}
    </Card>
  )
}
