"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles } from "lucide-react"
import Link from "next/link"
import type { User } from "@/lib/supabase"

interface GreetingBannerProps {
  user: User
}

export function GreetingBanner({ user }: GreetingBannerProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const getAfricanGreeting = () => {
    const greetings = [
      "Habari", // Swahili
      "Sannu", // Hausa
      "Bawo", // Yoruba
      "Ndewo", // Igbo
      "Sawubona", // Zulu
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <Card className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 border-0 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 text-2xl animate-pulse">🌍</div>
          <div className="absolute top-4 right-4 text-2xl animate-bounce">✨</div>
          <div className="absolute bottom-4 left-4 text-2xl animate-pulse">🦁</div>
          <div className="absolute bottom-4 right-4 text-2xl animate-bounce">🌴</div>
        </div>

        <CardContent className="p-8 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-6 h-6" />
                <h2 className="text-2xl font-bold">
                  {getGreeting()}, {user.full_name}!
                </h2>
              </div>
              <p className="text-white/90 mb-1">
                {getAfricanGreeting()}! Ready to share your story with the Ubuntu community?
              </p>
              <p className="text-white/80 text-sm">{user.country && `Writing from ${user.country} 🌍`}</p>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/create">
                <Button
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Andika - Write
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
