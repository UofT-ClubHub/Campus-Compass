"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { PostCard } from "@/components/post-card"
import type { Post, User } from "@/model/types"

interface EventsCarouselProps {
  posts: Post[]
  currentUser: User | null
  isLoading: boolean
  maxDisplay?: number
  onLikeUpdate: (postId: string, newLikes: number, isLiked: boolean) => void
  onPostDelete: () => void
}

export function EventsCarousel({ 
  posts, 
  currentUser, 
  isLoading, 
  maxDisplay = 12,
  onLikeUpdate,
  onPostDelete
}: EventsCarouselProps) {
  const postScrollRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [duplicatedPosts, setDuplicatedPosts] = useState<Post[]>([])

  // Limit posts to maxDisplay
  const limitedPosts = useMemo(() => {
    return posts.slice(0, maxDisplay)
  }, [posts, maxDisplay])

  // Duplicate posts for infinite scroll effect
  const duplicatedPostsMemo = useMemo(() => {
    return limitedPosts.length > 0 ? [...limitedPosts, ...limitedPosts, ...limitedPosts] : []
  }, [limitedPosts])

  useEffect(() => {
    setDuplicatedPosts(duplicatedPostsMemo)
  }, [duplicatedPostsMemo])

  // Handle infinite scroll reset
  useEffect(() => {
    const container = postScrollRef.current
    if (!container || duplicatedPosts.length === 0) return
    
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

  // Calculate scroll duration based on number of items to maintain consistent speed
  // Base: 60s for 12 items (5 pixels per second per item)
  const scrollDuration = useMemo(() => {
    const baseItemCount = 12
    const baseDuration = 60
    return (limitedPosts.length / baseItemCount) * baseDuration
  }, [limitedPosts.length])

  // Don't render if no posts
  if (!isLoading && limitedPosts.length === 0) {
    return null
  }

  const sectionTitle = currentUser ? "Your" : "Upcoming"
  const sectionDescription = currentUser 
    ? "Stay connected with events from the clubs you follow. Your personalized campus experience."
    : "Don't miss out on the exciting events happening across campus. Your next adventure awaits."

  return (
    <section className="py-12 relative w-full max-w-full">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-full">
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
            {sectionTitle} <span className="text-primary">Events</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {sectionDescription}
          </p>
        </div>

        {/* Carousel */}
        {isLoading ? (
          <div className="relative">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>

            {/* Main Container */}
            <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl shadow-2xl p-8 sm:p-10">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                <p className="mt-4 text-sm text-muted-foreground animate-pulse">
                  Loading {currentUser ? "your " : ""}events...
                </p>
              </div>
            </div>
          </div>
        ) : limitedPosts.length <= 4 ? (
          // Static grid for few posts
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>
            <div className="relative bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, var(--primary) 2px, transparent 2px)`,
                    backgroundSize: "40px 40px",
                  }}
                ></div>
              </div>
              <div className="relative flex gap-4 overflow-x-auto pb-6 scrollbar-hide w-full max-w-[calc(100vw-2rem)]" data-testid="posts-container">
                {limitedPosts.map((post: Post, index: number) => (
                  <div key={`${post.id}-${index}`} className="flex-shrink-0 w-64 sm:w-80">
                    <PostCard
                      post={post}
                      currentUser={currentUser}
                      onLikeUpdate={onLikeUpdate}
                      onRefresh={onPostDelete}
                      className="h-full transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Auto-scrolling carousel for many posts
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>
            <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl shadow-2xl">
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
                className="overflow-x-auto scroll-smooth pb-6 scrollbar-hide manual-scroll-container p-6 sm:p-8 w-full max-w-[calc(100vw-2rem)]"
                onScroll={handleUserScroll}
                onTouchStart={handleUserScroll}
                onTouchMove={handleUserScroll}
              >
                <div
                  className={`flex gap-4 ${isAutoScrolling && limitedPosts.length >= 3 ? "animate-smooth-scroll transition-transform duration-100 ease-out" : ""}`}
                  style={{ 
                    width: "fit-content",
                    "--scroll-duration": `${scrollDuration}s`
                  } as React.CSSProperties & { "--scroll-duration": string }}
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
                  {duplicatedPosts.map((post: Post, index: number) => (
                    <div key={`${post.id}-${index}`} className="flex-shrink-0 w-64 sm:w-80">
                      <PostCard
                        post={post}
                        currentUser={currentUser}
                        onLikeUpdate={onLikeUpdate}
                        onRefresh={onPostDelete}
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
  )
}
