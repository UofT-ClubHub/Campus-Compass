"use client"

import { auth } from "@/model/firebase"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import type { Post, User, Club } from "@/model/types"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/contexts/ThemeContext"

// Import new components
import { HeroSection } from "@/components/home/HeroSection"
import { ClubsCarousel } from "@/components/home/ClubsCarousel"
import { EventsCarousel } from "@/components/home/EventsCarousel"
import { StatsBoxes } from "@/components/home/StatsBoxes"

export default function HomePage() {
  const { theme } = useTheme()
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [isLoadingClubs, setIsLoadingClubs] = useState(false)

  // Track the followed clubs to avoid unnecessary refetches
  const followedClubsRef = useRef<string[]>([])

  const fetchPosts = async () => {
    setIsLoadingPosts(true)
    try {
      // Build API URL with clubs filter if user is logged in and has followed clubs
      let apiUrl = `/api/posts?sort_by=likes&sort_order=desc&limit=50`
      
      // Use currentUser from state, but also check if we have followed clubs
      const followedClubs = currentUser?.followed_clubs || []
      
      if (followedClubs.length > 0) {
        // Filter by followed clubs only
        apiUrl += `&clubs=${encodeURIComponent(JSON.stringify(followedClubs))}`
      }
      
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`)
      }
      const data: Post[] = await response.json()
      
      setPosts(data)
      
    } catch (err: any) {
      console.error("Error fetching posts:", err)
      setPosts([])
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const fetchClubs = async () => {
    setIsLoadingClubs(true)
    try {
      const response = await fetch(`/api/clubs?sort_by=followers&sort_order=desc`)
      if (!response.ok) {
        throw new Error(`Failed to fetch clubs: ${response.statusText}`)
      }
      const data: Club[] = await response.json()
      
      setClubs(data)
    } catch (err: any) {
      console.error("Error fetching clubs:", err)
      setClubs([])
    } finally {
      setIsLoadingClubs(false)
    }
  }

  // Fetch user data when auth user changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser) {
        try {
          const token = await authUser.getIdToken()
          const response = await fetch(`/api/users?id=${authUser.uid}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (response.ok) {
            const userData: User = await response.json()
            setCurrentUser(userData)
          }
        } catch (error) {
          console.log("Error fetching user data:", error)
        }
      } else {
        setCurrentUser(null)
      }
    }
    fetchUserData()
  }, [authUser])

  useEffect(() => {
    fetchClubs()
  }, [])

  // Handle posts fetching - only when loading state changes or followed clubs change
  useEffect(() => {
    if (!loading) {
      const currentFollowedClubs = currentUser?.followed_clubs || []
      
      // Only refetch if the followed clubs have actually changed
      if (JSON.stringify(currentFollowedClubs) !== JSON.stringify(followedClubsRef.current)) {
        followedClubsRef.current = currentFollowedClubs
        fetchPosts()
      }
    }
  }, [loading, currentUser?.followed_clubs])

  // Handle initial load when user loads in
  useEffect(() => {
    if (!loading && currentUser && followedClubsRef.current.length === 0) {
      const currentFollowedClubs = currentUser.followed_clubs || []
      followedClubsRef.current = currentFollowedClubs
      fetchPosts()
    } else if (!loading && !currentUser) {
      fetchPosts()
    }
  }, [loading, currentUser])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Handle like updates
  const handleLikeUpdate = (postId: string, newLikes: number, isLiked: boolean) => {
    // Update posts
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, likes: newLikes } : post)))
    // Update currentUser liked_posts
    setCurrentUser((prevUser) => {
      if (!prevUser) return prevUser
      const currentLikedPosts = prevUser.liked_posts || []
      let updatedLikedPosts
      if (isLiked) {
        updatedLikedPosts = currentLikedPosts.includes(postId) ? currentLikedPosts : [...currentLikedPosts, postId]
      } else {
        updatedLikedPosts = currentLikedPosts.filter((id) => id !== postId)
      }
      return {
        ...prevUser,
        liked_posts: updatedLikedPosts,
      }
    })
  }

  const handlePostDelete = () => {
    fetchPosts()
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-theme-gradient bg-animated-elements relative" data-theme={theme}>
      {/* Animated background elements - constrained to viewport */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={`element-${i + 1}`}></div>
        ))}
      </div>

      <div className="relative z-10">
        <HeroSection />

        <StatsBoxes />

        <div className="py-4 w-full max-w-full">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-full">
            <div className="relative flex items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-75"></div>
            </div>
          </div>
        </div>
        
        <ClubsCarousel clubs={clubs} isLoading={isLoadingClubs} maxDisplay={12} />

        <div className="py-4 w-full max-w-full">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-full">
            <div className="relative flex items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-75"></div>
            </div>
          </div>
        </div>

        <EventsCarousel 
          posts={posts}
          currentUser={currentUser}
          isLoading={isLoadingPosts}
          maxDisplay={50}
          onLikeUpdate={handleLikeUpdate}
          onPostDelete={handlePostDelete}
        />

        <div className="mb-4"></div>
      </div>
    </div>
  )
}
