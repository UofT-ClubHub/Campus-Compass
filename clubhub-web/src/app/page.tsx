"use client"
import { auth } from "@/model/firebase"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { Autocomplete } from "@mantine/core"
import { PostCard } from "@/components/post-card"
import { ClubCard } from "@/components/club-card"
import type { Post, User, Club } from "@/model/types"
import { useState, useEffect, useRef } from "react"

export default function HomePage() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followedEvents, setFollowedEvents] = useState<Post[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingClubs, setLoadingClubs] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clubScrollRef = useRef<HTMLDivElement>(null)
  const postScrollRef = useRef<HTMLDivElement>(null)
  const followedScrollRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [duplicatedPosts, setDuplicatedPosts] = useState<Post[]>([])
  const [duplicatedFollowed, setDuplicatedFollowed] = useState<Post[]>([])
  const [duplicatedClubs, setDuplicatedClubs] = useState<Club[]>([])

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true)
      const response = await fetch("/api/posts?sort_by=likes&sort_order=desc")
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`)
      }
      const data: Post[] = await response.json()
      // Filter posts to only include those from followed clubs
      if (currentUser && currentUser.followed_clubs) {
        const followedClubIds = currentUser.followed_clubs
        const filteredPosts = data.filter((post) => followedClubIds.includes(post.club))
        setFollowedEvents(filteredPosts)
      }
      setPosts(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      setPosts([])
    } finally {
      setLoadingPosts(false)
    }
  }

  const fetchClubs = async () => {
    try {
      setLoadingClubs(true)
      const response = await fetch("/api/clubs")
      if (!response.ok) {
        throw new Error(`Failed to fetch clubs: ${response.statusText}`)
      }
      const data: Club[] = await response.json()
      setClubs(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      setClubs([])
    } finally {
      setLoadingClubs(false)
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

  useEffect(() => {
    if (!loading) {
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

  useEffect(() => {
    const container = clubScrollRef.current
    if (!container) return
    const third = container.scrollWidth / 3
    // Scroll to the middle set on mount
    const setInitialScroll = () => {
      container.scrollLeft = third
    }
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
  }, [duplicatedPosts, duplicatedFollowed, duplicatedClubs])

  useEffect(() => {
    const container = postScrollRef.current
    if (!container) return
    const third = container.scrollWidth / 3
    // Scroll to the middle set on mount
    const setInitialScroll = () => {
      container.scrollLeft = third
    }
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
  }, [duplicatedPosts, duplicatedFollowed, duplicatedClubs])

  useEffect(() => {
    const container = followedScrollRef.current
    if (!container) return
    const third = container.scrollWidth / 3
    // Scroll to the middle set on mount
    const setInitialScroll = () => {
      container.scrollLeft = third
    }
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
  }, [duplicatedPosts, duplicatedFollowed, duplicatedClubs])

  useEffect(() => {
    setDuplicatedPosts([...posts, ...posts, ...posts])
  }, [posts])

  useEffect(() => {
    setDuplicatedFollowed([...followedEvents, ...followedEvents, ...followedEvents])
  }, [followedEvents])

  useEffect(() => {
    setDuplicatedClubs([...clubs, ...clubs, ...clubs])
  }, [clubs])

  const handleUserScroll = () => {
    isUserScrollingRef.current = true
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current)
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
      setIsAutoScrolling(true)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/40 z-10" />

        {/* Background Image */}
        <img
          src="/utsc.jpg"
          alt="UofT Image"
          className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-[20s] ease-out hover:scale-110"
        />

        {/* Content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white px-6">
          <div className="text-center max-w-5xl mx-auto">
            {/* Main Title */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-none tracking-tight">
                <span className="block bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-2xl">
                  Campus
                </span>
                <span className="block bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl">
                  Compass
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-base md:text-lg lg:text-xl mb-12 text-blue-100/90 font-light leading-relaxed max-w-4xl mx-auto">
              Navigate your university journey with confidence. Discover clubs, events, and opportunities that shape
              your future.
            </p>

          </div>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-background to-transparent z-15" />
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

            {/* Loading State */}
            {loadingClubs && (
              <div className="flex justify-center items-center py-24">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-primary"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-24">
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-destructive font-semibold text-lg">Error loading clubs: {error}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingClubs && !error && clubs.length === 0 && (
              <div className="text-center py-24">
                <div className="bg-muted/50 border-2 border-border rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground font-medium text-lg">No clubs found.</p>
                </div>
              </div>
            )}

            {/* Clubs Grid */}
            {!loadingClubs && !error && clubs.length > 0 && (
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
                          currentUser={currentUser}
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

            {/* Loading State */}
            {loadingClubs && (
              <div className="flex justify-center items-center py-24">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-primary"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-24">
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-destructive font-semibold text-lg">Error loading clubs: {error}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingClubs && !error && clubs.length === 0 && (
              <div className="text-center py-24">
                <div className="bg-muted/50 border-2 border-border rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground font-medium text-lg">No clubs found.</p>
                </div>
              </div>
            )}

            {/* Auto-Scrolling Clubs */}
            {!loadingClubs && !error && clubs.length > 0 && (
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
                            currentUser={currentUser}
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
        <section className="py-12 bg-muted relative">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-3xl mb-4 shadow-lg">
                <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">
                Upcoming <span className="text-accent">Events</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Don't miss out on the exciting events happening across campus. Your next adventure awaits.
              </p>
            </div>

            {/* Loading State */}
            {loadingPosts && (
              <div className="flex justify-center items-center py-24">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-accent"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-accent/20"></div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-24">
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-destructive font-semibold text-lg">Error loading events: {error}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingPosts && !error && posts.length === 0 && (
              <div className="text-center py-24">
                <div className="bg-muted/50 border-2 border-border rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground font-medium text-lg">No events found.</p>
                </div>
              </div>
            )}

            {/* Events Grid */}
            {!loadingPosts && !error && posts.length > 0 && (
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 rounded-3xl blur-3xl"></div>

                {/* Main Container */}
                <div className="relative bg-card/80 backdrop-blur-sm border border-accent/20 rounded-3xl p-4 shadow-2xl overflow-hidden">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 75% 25%, var(--accent) 2px, transparent 2px)`,
                        backgroundSize: "40px 40px",
                      }}
                    ></div>
                  </div>

                  <div className="relative flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                    {posts.map((post: Post, index: any) => (
                      <div key={`${post.id}-${index}`} className="flex-shrink-0 w-64">
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

      {posts.length > 4 && !currentUser && (
        <section className="py-12 bg-muted relative">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-3xl mb-4 shadow-lg">
                <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">
                Upcoming <span className="text-accent">Events</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Don't miss out on the exciting events happening across campus. Your next adventure awaits.
              </p>
            </div>

            {/* Loading State */}
            {loadingPosts && (
              <div className="flex justify-center items-center py-24">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-accent"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-accent/20"></div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-24">
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-destructive font-semibold text-lg">Error loading events: {error}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingPosts && !error && posts.length === 0 && (
              <div className="text-center py-24">
                <div className="bg-muted/50 border-2 border-border rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground font-medium text-lg">No events found.</p>
                </div>
              </div>
            )}

            {/* Auto-Scrolling Events */}
            {!loadingPosts && !error && posts.length > 0 && (
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 rounded-3xl blur-3xl"></div>

                {/* Main Container */}
                <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm border border-accent/20 rounded-3xl shadow-2xl">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 75% 25%, var(--accent) 2px, transparent 2px)`,
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
                        <div key={`${post.id}-${index}`} className="flex-shrink-0 w-64">
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
              <div className="inline-flex items-center justify-center w-12 h-12 bg-success rounded-3xl mb-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">
                Discover <span className="text-primary">Clubs</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Stay connected with events from the clubs you follow. Your personalized campus experience.
              </p>
            </div>

            {/* Loading State */}
            {loadingPosts && (
              <div className="flex justify-center items-center py-24">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-success"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-success/20"></div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-24">
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-destructive font-semibold text-lg">Error loading events: {error}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingPosts && !error && posts.length === 0 && (
              <div className="text-center py-24">
                <div className="bg-muted/50 border-2 border-border rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground font-medium text-lg">No events found.</p>
                </div>
              </div>
            )}

            {/* Events Grid */}
            {!loadingPosts && !error && posts.length > 0 && (
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-success/5 via-success/10 to-success/5 rounded-3xl blur-3xl"></div>

                {/* Main Container */}
                <div className="relative bg-card/80 backdrop-blur-sm border border-success/20 rounded-3xl p-4 shadow-2xl overflow-hidden">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 75%, var(--success) 2px, transparent 2px)`,
                        backgroundSize: "40px 40px",
                      }}
                    ></div>
                  </div>

                  <div className="relative flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                    {followedEvents.map((post: Post, index: any) => (
                      <div key={`${post.id}-${index}`} className="flex-shrink-0 w-64">
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
              <div className="inline-flex items-center justify-center w-12 h-12 bg-success rounded-3xl mb-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6 tracking-tight">
                Your <span className="text-success">Events</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Stay connected with events from the clubs you follow. Your personalized campus experience.
              </p>
            </div>

            {/* Loading State */}
            {loadingPosts && (
              <div className="flex justify-center items-center py-24">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-success"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-success/20"></div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-24">
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-destructive font-semibold text-lg">Error loading events: {error}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingPosts && !error && posts.length === 0 && (
              <div className="text-center py-24">
                <div className="bg-muted/50 border-2 border-border rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground font-medium text-lg">No events found.</p>
                </div>
              </div>
            )}

            {/* Auto-Scrolling Followed Events */}
            {!loadingPosts && !error && posts.length > 0 && (
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-success/5 via-success/10 to-success/5 rounded-3xl blur-3xl"></div>

                {/* Main Container */}
                <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm border border-success/20 rounded-3xl shadow-2xl">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 75%, var(--success) 2px, transparent 2px)`,
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
                        <div key={`${post.id}-${index}`} className="flex-shrink-0 w-64">
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
