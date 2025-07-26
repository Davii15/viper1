"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"
import { followUser, unfollowUser, checkIfFollowing } from "@/lib/posts"

interface FollowButtonProps {
  userId: string
  username: string
  onFollowChange?: (isFollowing: boolean) => void
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
}

export function FollowButton({
  userId,
  username,
  onFollowChange,
  size = "default",
  variant = "default",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    checkFollowStatus()
  }, [userId])

  const checkFollowStatus = async () => {
    try {
      const following = await checkIfFollowing(userId)
      setIsFollowing(following)
    } catch (error) {
      console.error("Error checking follow status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowToggle = async () => {
    setActionLoading(true)
    try {
      if (isFollowing) {
        await unfollowUser(userId)
        setIsFollowing(false)
        onFollowChange?.(false)
      } else {
        await followUser(userId)
        setIsFollowing(true)
        onFollowChange?.(true)
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    )
  }

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={handleFollowToggle}
      disabled={actionLoading}
      className={isFollowing ? "hover:bg-red-50 hover:text-red-600 hover:border-red-200" : ""}
    >
      {actionLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {actionLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  )
}
