"use client"
import { auth } from "@/model/firebase"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { PostCard } from "@/components/post-card"
import { ClubCard } from "@/components/club-card"
import type { Post, User, Club } from "@/model/types"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useTheme } from "@/contexts/ThemeContext"

// Typewriter component for subtitle
function TypewriterText() {
  const [currentText, setCurrentText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const texts = [
    "Navigate your university journey with confidence. Discover clubs, events, and opportunities that shape your future.",
    "Connect with like-minded students and explore your passions through our diverse community of clubs.",
    "Your gateway to campus life. Find events, join clubs, and make the most of your university experience."
  ]

  useEffect(() => {
    const currentFullText = texts[currentIndex]
    
    if (!isDeleting) {
      if (currentText.length < currentFullText.length) {
        const timeout = setTimeout(() => {
          setCurrentText(currentFullText.slice(0, currentText.length + 1))
        }, 50)
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => {
          setIsDeleting(true)
        }, 2000)
        return () => clearTimeout(timeout)
      }
    } else {
      if (currentText.length > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, currentText.length - 1))
        }, 30)
        return () => clearTimeout(timeout)
      } else {
        setIsDeleting(false)
        setCurrentIndex((prev) => (prev + 1) % texts.length)
      }
    }
  }, [currentText, currentIndex, isDeleting, texts])

  return (
    <div className="mb-12 h-8 md:h-10 lg:h-12 flex items-center justify-center">
      <p className="text-base md:text-lg lg:text-xl font-light leading-relaxed max-w-4xl mx-auto text-primary-foreground">
        {currentText}
        <span className="text-primary-foreground animate-pulse">|</span>
      </p>
    </div>
  )
}

export default function HomePage() {
  const { theme } = useTheme()
  const isLightTheme = theme === 'light' || theme === 'warm-light'
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followedEvents, setFollowedEvents] = useState<Post[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [hasMoreClubs, setHasMoreClubs] = useState(true)
  const POSTS_PER_PAGE = 10
  const CLUBS_PER_PAGE = 8

  const clubScrollRef = useRef<HTMLDivElement>(null)
  const postScrollRef = useRef<HTMLDivElement>(null)
  const followedScrollRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [duplicatedPosts, setDuplicatedPosts] = useState<Post[]>([])
  const [duplicatedFollowed, setDuplicatedFollowed] = useState<Post[]>([])
  const [duplicatedClubs, setDuplicatedClubs] = useState<Club[]>([])

  const fetchPosts = async (page = 1, append = false) => {
    try {
      const response = await fetch(`/api/posts?sort_by=likes&sort_order=desc&limit=${POSTS_PER_PAGE}&page=${page}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`)
      }
      const data: Post[] = await response.json()
      
      if (append) {
        setPosts(prev => [...prev, ...data])
      } else {
        setPosts(data)
      }
      
      setHasMorePosts(data.length === POSTS_PER_PAGE)
      
      // Filter posts to only include those from followed clubs
      if (currentUser && currentUser.followed_clubs) {
        const followedClubIds = currentUser.followed_clubs
        const filteredPosts = data.filter((post) => followedClubIds.includes(post.club))
        setFollowedEvents(filteredPosts)
      }
    } catch (err: any) {
      setPosts([])
      setHasMorePosts(false)
    }
  }

  const fetchClubs = async (page = 1, append = false) => {
    try {
      const response = await fetch(`/api/clubs?sort_by=followers&sort_order=desc&limit=${CLUBS_PER_PAGE}&page=${page}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch clubs: ${response.statusText}`)
      }
      const data: Club[] = await response.json()
      
      if (append) {
        setClubs(prev => [...prev, ...data])
      } else {
        setClubs(data)
      }
      
      setHasMoreClubs(data.length === CLUBS_PER_PAGE)
    } catch (err: any) {
      setClubs([])
      setHasMoreClubs(false)
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
    fetchClubs(1, false)
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchPosts(1, false)
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
    fetchPosts(1, false)
  }

  const loadMorePosts = () => {
    if (hasMorePosts) {
      const nextPage = Math.ceil(posts.length / POSTS_PER_PAGE) + 1
      fetchPosts(nextPage, true)
    }
  }

  const loadMoreClubs = () => {
    if (hasMoreClubs) {
      const nextPage = Math.ceil(clubs.length / CLUBS_PER_PAGE) + 1
      fetchClubs(nextPage, true)
    }
  }

  useEffect(() => {
    const container = clubScrollRef.current
    if (!container) return
    const third = container.scrollWidth / 3
    const handleInfiniteScroll = () => {
      const scrollLeft = container.scrollLeft
      if (scrollLeft <= third / 2) {
        container.style.scrollBehavior = "auto"
        container.scrollLeft += third
        container.style.scrollBehavior = "smooth"
      } else if (scrollLeft >= third * 1.5) {
        container.style.scrollBehavior = "auto"
        container.scrollLeft -= third
        container.style.scrollBehavior = "smooth"
      }
    }
    container.addEventListener("scroll", handleInfiniteScroll)
    return () => {
      container.removeEventListener("scroll", handleInfiniteScroll)
    }
  }, [duplicatedClubs])

  useEffect(() => {
    const container = postScrollRef.current
    if (!container) return
    const third = container.scrollWidth / 3
    const handleInfiniteScroll = () => {
      const scrollLeft = container.scrollLeft
      if (scrollLeft <= third / 2) {
        container.style.scrollBehavior = "auto"
        container.scrollLeft += third
        container.style.scrollBehavior = "smooth"
      } else if (scrollLeft >= third * 1.5) {
        container.style.scrollBehavior = "auto"
        container.scrollLeft -= third
        container.style.scrollBehavior = "smooth"
      }
    }
    container.addEventListener("scroll", handleInfiniteScroll)
    return () => {
      container.removeEventListener("scroll", handleInfiniteScroll)
    }
  }, [duplicatedPosts])

  useEffect(() => {
    const container = followedScrollRef.current
    if (!container) return
    const third = container.scrollWidth / 3
    const handleInfiniteScroll = () => {
      const scrollLeft = container.scrollLeft
      if (scrollLeft <= third / 2) {
        container.style.scrollBehavior = "auto"
        container.scrollLeft += third
        container.style.scrollBehavior = "smooth"
      } else if (scrollLeft >= third * 1.5) {
        container.style.scrollBehavior = "auto"
        container.scrollLeft -= third
        container.style.scrollBehavior = "smooth"
      }
    }
    container.addEventListener("scroll", handleInfiniteScroll)
    return () => {
      container.removeEventListener("scroll", handleInfiniteScroll)
    }
  }, [duplicatedFollowed])

  const duplicatedPostsMemo = useMemo(() => {
    return posts.length > 0 ? [...posts, ...posts, ...posts] : []
  }, [posts])

  const duplicatedFollowedMemo = useMemo(() => {
    return followedEvents.length > 0 ? [...followedEvents, ...followedEvents, ...followedEvents] : []
  }, [followedEvents])

  const duplicatedClubsMemo = useMemo(() => {
    return clubs.length > 0 ? [...clubs, ...clubs, ...clubs] : []
  }, [clubs])

  useEffect(() => {
    setDuplicatedPosts(duplicatedPostsMemo)
  }, [duplicatedPostsMemo])

  useEffect(() => {
    setDuplicatedFollowed(duplicatedFollowedMemo)
  }, [duplicatedFollowedMemo])

  useEffect(() => {
    setDuplicatedClubs(duplicatedClubsMemo)
  }, [duplicatedClubsMemo])

  const handleUserScroll = useCallback(() => {
    isUserScrollingRef.current = true
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current)
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
      setIsAutoScrolling(true)
    }, 2000)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[500px] overflow-hidden">
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br z-10 ${
          isLightTheme
            ? 'from-black/50 via-black/40 to-black/30' 
            : 'from-black/70 via-black/60 to-black/s0'
        }`} />

        {/* Background Image */}
        <img
          src="/utsc.jpg"
          alt="UofT Image"
          className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-[20s] ease-out hover:scale-110"
        />

        {/* Content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-5xl mx-auto">
            {/* Main Title with Icons */}
            <div className="mb-8 flex items-center justify-center gap-8 md:gap-12 lg:gap-16">
              {/* Left Icon */}
              <span className="hidden md:inline-flex">
                <svg 
                  className="w-12 h-12" 
                  fill="none" 
                  stroke="#fff" 
                  strokeWidth={2} 
                  viewBox="0 0 24 24"
                  style={{
                    filter: `
                      drop-shadow(1px 1px 4px #000)
                      drop-shadow(0 2px 8px #000)
                      drop-shadow(0 0 12px #a5b4fc)
                    `
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418 0-8-5.373-8-10A8 8 0 1 1 20 11c0 4.627-3.582 10-8 10z" />
                  <circle cx="12" cy="11" r="3" />
                </svg>
              </span>
              
              {/* Main Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-none tracking-tight">
                <span
                  className="block font-sans font-extrabold tracking-tight"
                  style={{
                    color: "#fff",
                    textShadow: `
                      1px 1px 4px #000,
                      0 2px 8px #000,
                      0 0 12px #a5b4fc
                    `
                  }}
                >
                  Campus Compass
                </span>
              </h1>
              
              {/* Right Icon */}
              <span className="hidden md:inline-flex">
                <svg 
                  className="w-12 h-12" 
                  fill="none" 
                  stroke="#fff" 
                  strokeWidth={2} 
                  viewBox="0 0 24 24"
                  style={{
                    filter: `
                      drop-shadow(1px 1px 4px #000)
                      drop-shadow(0 2px 8px #000)
                      drop-shadow(0 0 12px #a5b4fc)
                    `
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
            </div>

            {/* Subtitle */}
            <TypewriterText />
          </div>
        </div>

        {/* Bottom Fade */}
        <div
          className={`
            absolute bottom-0 left-0 w-full h-40 z-15
            bg-gradient-to-t from-background to-transparent
          `}
        />
      </section>

      {/* Clubs Section */}
      {clubs.length <= 4 && (
        <section className="py-12 bg-background relative">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-3xl mb-4 shadow-lg">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">
                Discover <span className="text-primary">Clubs</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Connect with like-minded students and explore your passions through our diverse community of clubs.
              </p>
            </div>

            {/* Clubs Grid */}
            {clubs.length > 0 && (
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>

                {/* Main Container */}
                <div className="relative bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl p-4 shadow-2xl overflow-hidden">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, var(--primary) 2px, transparent 2px)`,
                        backgroundSize: "40px 40px",
                      }}
                    ></div>
                  </div>

                  <div className="relative flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                    {clubs.map((club: Club, index: any) => (
                      <div key={`${club.id}-${index}`} className="flex-shrink-0 w-64">
                        <ClubCard
                          key={club.id}
                          club={club}
                          className="h-full transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {clubs.length > 4 && (
        <section className="py-12 bg-background relative">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-3xl mb-4 shadow-lg">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">
                Discover <span className="text-primary">Clubs</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Connect with like-minded students and explore your passions through our diverse community of clubs.
              </p>
            </div>

            {/* Auto-Scrolling Clubs */}
            {clubs.length > 0 && (
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>

                {/* Main Container */}
                <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl shadow-2xl">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, var(--primary) 2px, transparent 2px)`,
                        backgroundSize: "40px 40px",
                      }}
                    ></div>
                  </div>

                  <div
                    ref={clubScrollRef}
                    className="overflow-x-auto scroll-smooth pb-6 scrollbar-hide manual-scroll-container p-4"
                    onScroll={handleUserScroll}
                    onTouchStart={handleUserScroll}
                    onTouchMove={handleUserScroll}
                  >
                    <div
                      className={`flex gap-4 ${isAutoScrolling && duplicatedClubs.length >= 3 ? "animate-smooth-scroll transition-transform duration-100 ease-out" : ""}`}
                      style={{ width: "fit-content" }}
                      onMouseEnter={(e) => {
                        if (e.target === e.currentTarget) {
                          setIsAutoScrolling(false)
                        }
                      }}
                      onMouseLeave={(e) => {
                        const target = e.relatedTarget
                        if (!(target instanceof Node) || !e.currentTarget.contains(target)) {
                          if (!isUserScrollingRef.current) {
                            setIsAutoScrolling(true)
                          }
                        }
                      }}
                    >
                      {duplicatedClubs.map((club: Club, index: any) => (
                        <div key={`${club.id}-${index}`} className="flex-shrink-0 w-64">
                          <ClubCard
                            key={club.id}
                            club={club}
                            className="h-full transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* General Events Section */}
      {posts.length <= 4 && !currentUser && (
        <section className="py-12 bg-background relative">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-3xl mb-4 shadow-lg">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">
                Upcoming <span className="text-primary">Events</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Don't miss out on the exciting events happening across campus. Your next adventure awaits.
              </p>
            </div>

            {/* Events Grid */}
            {posts.length > 0 && (
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>

                {/* Main Container */}
                <div className="relative bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl p-4 shadow-2xl overflow-hidden">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, var(--primary) 2px, transparent 2px)`,
                        backgroundSize: "40px 40px",
                      }}
                    ></div>
                  </div>

                  <div className="relative flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                    {posts.map((post: Post, index: any) => (
                      <div key={`${post.id}-${index}`} className="flex-shrink-0 w-80">
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onLikeUpdate={handleLikeUpdate}
                          onRefresh={handlePostDelete}
                          className="h-full transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Fading Line Separator */}
      {!currentUser && (
        <div className="py-8 bg-background">
          <div className="container mx-auto px-6">
            <div className="relative flex items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-75"></div>
            </div>
          </div>
        </div>
      )}

      {posts.length > 4 && !currentUser && (
        <section className="py-12 bg-background relative">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-3xl mb-4 shadow-lg">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">
                Upcoming <span className="text-primary">Events</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Don't miss out on the exciting events happening across campus. Your next adventure awaits.
              </p>
            </div>

            {/* Auto-Scrolling Events */}
            {posts.length > 0 && (
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>

                {/* Main Container */}
                <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl shadow-2xl">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, var(--primary) 2px, transparent 2px)`,
                        backgroundSize: "40px 40px",
                      }}
                    ></div>
                  </div>

                  <div
                    ref={postScrollRef}
                    className="overflow-x-auto scroll-smooth pb-6 scrollbar-hide manual-scroll-container p-4"
                    onScroll={handleUserScroll}
                    onTouchStart={handleUserScroll}
                    onTouchMove={handleUserScroll}
                  >
                    <div
                      className={`flex gap-4 transition-transform duration-100 ease-out ${isAutoScrolling ? "animate-smooth-scroll" : ""}`}
                      style={{ width: "fit-content" }}
                      onMouseEnter={(e) => {
                        if (e.target === e.currentTarget) {
                          setIsAutoScrolling(false)
                        }
                      }}
                      onMouseLeave={(e) => {
                        const target = e.relatedTarget
                        if (!(target instanceof Node) || !e.currentTarget.contains(target)) {
                          if (!isUserScrollingRef.current) {
                            setIsAutoScrolling(true)
                          }
                        }
                      }}
                    >
                      {duplicatedPosts.map((post: Post, index: any) => (
                        <div key={`${post.id}-${index}`} className="flex-shrink-0 w-80">
                          <PostCard
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            onLikeUpdate={handleLikeUpdate}
                            onRefresh={handlePostDelete}
                            className="h-full transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Simple Line Divider */}
      {currentUser && (
        <div className="py-8 bg-background">
          <div className="container mx-auto px-6">
            <div className="relative flex items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-75"></div>
            </div>
          </div>
        </div>
      )}

      {/* User Events Section */}
      {followedEvents.length <= 4 && currentUser && (
        <section className="py-8 bg-background relative">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-3xl mb-4 shadow-lg">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">
                Your <span className="text-primary">Events</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Stay connected with events from the clubs you follow. Your personalized campus experience.
              </p>
            </div>

            {/* Events Grid */}
            {followedEvents.length > 0 && (
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>

                {/* Main Container */}
                <div className="relative bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl p-4 shadow-2xl overflow-hidden">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, var(--primary) 2px, transparent 2px)`,
                        backgroundSize: "40px 40px",
                      }}
                    ></div>
                  </div>

                  <div className="relative flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                    {followedEvents.map((post: Post, index: any) => (
                      <div key={`${post.id}-${index}`} className="flex-shrink-0 w-80">
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onLikeUpdate={handleLikeUpdate}
                          onRefresh={handlePostDelete}
                          className="h-full transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {followedEvents.length > 4 && currentUser && (
        <section className="py-8 bg-background relative">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-3xl mb-4 shadow-lg">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">
                Your <span className="text-primary">Events</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Stay connected with events from the clubs you follow. Your personalized campus experience.
              </p>
            </div>

            {/* Auto-Scrolling Followed Events */}
            {followedEvents.length > 0 && (
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>

                {/* Main Container */}
                <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl shadow-2xl">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, var(--primary) 2px, transparent 2px)`,
                        backgroundSize: "40px 40px",
                      }}
                    ></div>
                  </div>

                  <div
                    ref={followedScrollRef}
                    className="overflow-x-auto scroll-smooth pb-6 scrollbar-hide manual-scroll-container p-4"
                    onScroll={handleUserScroll}
                    onTouchStart={handleUserScroll}
                    onTouchMove={handleUserScroll}
                  >
                    <div
                      className={`flex gap-4 transition-transform duration-100 ease-out ${isAutoScrolling ? "animate-smooth-scroll" : ""}`}
                      style={{ width: "fit-content" }}
                      onMouseEnter={(e) => {
                        if (e.target === e.currentTarget) {
                          setIsAutoScrolling(false)
                        }
                      }}
                      onMouseLeave={(e) => {
                        const target = e.relatedTarget
                        if (!(target instanceof Node) || !e.currentTarget.contains(target)) {
                          if (!isUserScrollingRef.current) {
                            setIsAutoScrolling(true)
                          }
                        }
                      }}
                    >
                      {duplicatedFollowed.map((post: Post, index: any) => (
                        <div key={`${post.id}-${index}`} className="flex-shrink-0 w-80">
                          <PostCard
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            onLikeUpdate={handleLikeUpdate}
                            onRefresh={handlePostDelete}
                            className="h-full transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
