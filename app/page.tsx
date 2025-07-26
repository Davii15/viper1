"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Heart, Users, TrendingUp, ArrowRight, Check, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"

const categories = [
  { id: "sports", name: "Sports", icon: "⚽", color: "bg-green-500", pattern: "🏃‍♂️🏀⚽🏈" },
  { id: "health", name: "Health", icon: "🏥", color: "bg-red-500", pattern: "💊🩺❤️🏥" },
  { id: "agriculture", name: "Agriculture", icon: "🌾", color: "bg-yellow-500", pattern: "🌱🚜🌾🥕" },
  { id: "beauty", name: "Beauty", icon: "💄", color: "bg-pink-500", pattern: "💄💅✨👑" },
  { id: "lifestyle", name: "Lifestyle", icon: "✨", color: "bg-purple-500", pattern: "🌟🎨🏡☕" },
  { id: "finance", name: "Finance", icon: "💰", color: "bg-emerald-500", pattern: "💰📈💳🏦" },
  { id: "technology", name: "Technology", icon: "💻", color: "bg-blue-500", pattern: "💻📱⚡🔬" },
  { id: "economics", name: "Economics", icon: "📈", color: "bg-indigo-500", pattern: "📊💹🌍📈" },
  { id: "security", name: "Security", icon: "🔒", color: "bg-gray-500", pattern: "🔒🛡️🔐⚠️" },
  { id: "food", name: "Food", icon: "🍕", color: "bg-orange-500", pattern: "🍕🥘🍛🌶️" },
  { id: "travel", name: "Travel", icon: "✈️", color: "bg-cyan-500", pattern: "✈️🗺️🏖️🎒" },
  { id: "education", name: "Education", icon: "📚", color: "bg-violet-500", pattern: "📚🎓✏️🧠" },
]

function HomePage() {
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        router.push("/dashboard")
        return
      }
    } catch (error) {
      console.log("No authenticated user")
    }

    const timer = setTimeout(() => {
      setLoading(false)
      setShowOnboarding(true)
    }, 3000)

    return () => clearTimeout(timer)
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handleContinue = () => {
    if (currentStep === 0) {
      setCurrentStep(1)
    } else {
      localStorage.setItem("selectedCategories", JSON.stringify(selectedCategories))
      router.push("/auth/signup")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
        {/* African Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl animate-pulse">🌍</div>
          <div className="absolute top-20 right-20 text-4xl animate-bounce">🦁</div>
          <div className="absolute bottom-20 left-20 text-5xl animate-pulse">🌴</div>
          <div className="absolute bottom-10 right-10 text-4xl animate-bounce">🐘</div>
          <div className="absolute top-1/2 left-1/4 text-3xl animate-pulse">🦒</div>
          <div className="absolute top-1/3 right-1/3 text-3xl animate-bounce">🌺</div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-24 h-24 mx-auto mb-8 bg-white rounded-full flex items-center justify-center shadow-2xl"
          >
            <Sparkles className="w-12 h-12 text-orange-500" />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-7xl font-bold text-white mb-4 drop-shadow-lg"
          >
            Posti
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-2xl text-white/90 mb-8 drop-shadow"
          >
            Ubuntu - Where Stories Unite Us
          </motion.p>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "300px" }}
            transition={{ delay: 1, duration: 1.5 }}
            className="h-2 bg-white/30 rounded-full mx-auto overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 1.5, duration: 1 }}
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {showOnboarding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden"
        >
          {/* African Pattern Background */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-10 left-10 text-4xl animate-pulse">🌍</div>
            <div className="absolute top-20 right-20 text-3xl animate-bounce">🦁</div>
            <div className="absolute bottom-20 left-20 text-4xl animate-pulse">🌴</div>
            <div className="absolute bottom-10 right-10 text-3xl animate-bounce">🐘</div>
            <div className="absolute top-1/2 left-1/4 text-2xl animate-pulse">🦒</div>
            <div className="absolute top-1/3 right-1/3 text-2xl animate-bounce">🌺</div>
          </div>

          {/* Theme Toggle */}
          {mounted && (
            <div className="absolute top-4 right-4 z-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {currentStep === 0 ? (
            <div className="container mx-auto px-4 py-16 relative z-10">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-16"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-purple-700 bg-clip-text text-transparent mb-4">
                  Karibu Posti
                </h1>
                <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  The ultimate African platform for creators, writers, and storytellers. Share your passion, connect
                  with your community, and celebrate our rich heritage together. <span className="text-2xl">🌍</span>
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                  <Card className="p-8 text-center h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:scale-105">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Heart className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Create & Share</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Write beautiful stories with our advanced editor. Share your African experiences with the world.
                      📝✨
                    </p>
                  </Card>
                </motion.div>

                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                  <Card className="p-8 text-center h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:scale-105">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Connect & Engage</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Follow creators, engage with content, and build meaningful Ubuntu connections. 🤝🌍
                    </p>
                  </Card>
                </motion.div>

                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
                  <Card className="p-8 text-center h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:scale-105">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <TrendingUp className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Grow & Monetize</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Build your audience and earn from your content with our creator tools. 💰📈
                    </p>
                  </Card>
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center"
              >
                <Button
                  onClick={handleContinue}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 hover:from-orange-600 hover:via-red-600 hover:to-purple-700 text-white px-12 py-6 text-xl rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                >
                  Anza Safari - Start Journey
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </motion.div>
            </div>
          ) : (
            <div className="container mx-auto px-4 py-16 relative z-10">
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-12">
                <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Chagua Mada Yako
                </h2>
                <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                  Select the topics that interest you. You can always change these later in your settings. 🎯
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12"
              >
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-xl relative overflow-hidden ${
                        selectedCategories.includes(category.id)
                          ? "ring-4 ring-orange-400 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 shadow-2xl"
                          : "hover:shadow-lg bg-white dark:bg-gray-800"
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      {/* Pattern Background */}
                      <div className="absolute inset-0 opacity-5 text-xs overflow-hidden">
                        {category.pattern.repeat(20)}
                      </div>

                      <div className="text-center relative z-10">
                        <div
                          className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform transition-transform duration-300 ${
                            selectedCategories.includes(category.id) ? "scale-110" : ""
                          }`}
                        >
                          <span className="text-3xl">{category.icon}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{category.name}</h3>
                        {selectedCategories.includes(category.id) && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                  {selectedCategories.length} categories selected 🎉
                </p>
                <Button
                  onClick={handleContinue}
                  size="lg"
                  disabled={selectedCategories.length === 0}
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 hover:from-orange-600 hover:via-red-600 hover:to-purple-700 text-white px-12 py-6 text-xl rounded-full disabled:opacity-50 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                >
                  Jisajili - Sign Up
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Page() {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  )
}
