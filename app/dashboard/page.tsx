"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  Search,
  Plus,
  BookOpen,
  Settings,
  LogOut,
  Home,
  Compass,
  PenTool,
  UserIcon,
  RefreshCw,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("for-you")

  // ✅ Let middleware handle redirects primarily
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("🔒 No user found, redirecting to signin")
      router.replace("/auth/signin")
    }
  }, [user, authLoading, router])

  // ✅ Show optimized loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Accessing your global account...</p>
        </motion.div>
      </div>
    )
  }

  // ✅ Don't render if no user (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 relative">
      {/* African Pattern Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 text-2xl animate-pulse">🌍</div>
        <div className="absolute top-20 right-20 text-xl animate-bounce">🦁</div>
        <div className="absolute bottom-20 left-20 text-2xl animate-pulse">🌴</div>
        <div className="absolute bottom-10 right-10 text-xl animate-bounce">🐘</div>
        <div className="absolute top-1/2 left-1/4 text-lg animate-pulse">🦒</div>
        <div className="absolute top-1/3 right-1/3 text-lg animate-bounce">🌺</div>
      </div>

      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Posti
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Compass className="w-4 h-4" />
                  <span>Explore</span>
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </Button>
              </Link>
              <Link href="/create">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <PenTool className="w-4 h-4" />
                  <span>Write</span>
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{user.full_name?.[0] || user.email?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block font-medium">{user.full_name || "User"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.full_name || "User"}</p>
                    <p className="text-xs text-gray-500">@{user.username || user.email?.split("@")[0]}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/create">
                  <Button className="w-full justify-start bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Messages
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Compass className="w-4 h-4 mr-2" />
                    Explore
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <UserIcon className="w-4 h-4 mr-2" />
                    My Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Greeting */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-2">Karibu, {user.full_name || "User"}! 🌍</h1>
                <p className="text-gray-600">
                  Welcome to your global Ubuntu community. Share your stories from anywhere in the world.
                </p>
                <div className="mt-4 bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm font-medium">🌍 Global Account Active!</p>
                  <p className="text-green-600 text-xs mt-1">
                    You can access Posti from any device, anywhere in the world. Your stories are safely stored in the
                    cloud.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="for-you">For You</TabsTrigger>
                  <TabsTrigger value="following">Following</TabsTrigger>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Welcome to Posti!</h3>
                <p className="text-gray-600 mb-4">Be the first to share your story with the Ubuntu community!</p>
                <Link href="/create">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Post
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30 pb-safe">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2 min-h-[44px]">
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2 min-h-[44px]">
              <Compass className="w-5 h-5" />
              <span className="text-xs">Explore</span>
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2 min-h-[44px]">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Chat</span>
            </Button>
          </Link>
          <Link href="/create">
            <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2 min-h-[44px]">
              <Plus className="w-5 h-5" />
              <span className="text-xs">Create</span>
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2 min-h-[44px]">
              <UserIcon className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
