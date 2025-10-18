"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { ClubCard } from "@/components/club-card"
import type { Club } from "@/model/types"

interface ClubsCarouselProps {
  clubs: Club[]
  isLoading: boolean
  maxDisplay?: number
}

export function ClubsCarousel({ clubs, isLoading, maxDisplay = 12 }: ClubsCarouselProps) {
  const clubScrollRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [duplicatedClubs, setDuplicatedClubs] = useState<Club[]>([])

  // Limit clubs to maxDisplay
  const limitedClubs = useMemo(() => {
    return clubs.slice(0, maxDisplay)
  }, [clubs, maxDisplay])

  // Duplicate clubs for infinite scroll effect
  const duplicatedClubsMemo = useMemo(() => {
    return limitedClubs.length > 0 ? [...limitedClubs, ...limitedClubs, ...limitedClubs] : []
  }, [limitedClubs])

  useEffect(() => {
    setDuplicatedClubs(duplicatedClubsMemo)
  }, [duplicatedClubsMemo])

  // Handle infinite scroll reset
  useEffect(() => {
    const container = clubScrollRef.current
    if (!container || duplicatedClubs.length === 0) return
    
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

  const scrollDuration = useMemo(() => {
    const baseItemCount = 12
    const baseDuration = 60
    return (limitedClubs.length / baseItemCount) * baseDuration
  }, [limitedClubs.length])

  if (!isLoading && limitedClubs.length === 0) {
    return null
  }

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

        {/* Carousel */}
        {isLoading ? (
          <div className="relative">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>

            {/* Main Container */}
            <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl shadow-2xl p-8 sm:p-10">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading clubs...</p>
              </div>
            </div>
          </div>
        ) : limitedClubs.length <= 4 ? (
          // Static grid for few clubs
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
              <div className="relative flex gap-4 overflow-x-auto pb-6 scrollbar-hide w-full max-w-[calc(100vw-2rem)]">
                {limitedClubs.map((club: Club, index: number) => (
                  <div key={`${club.id}-${index}`} className="flex-shrink-0 w-64 sm:w-80">
                    <ClubCard
                      club={club}
                      className="h-full transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Auto-scrolling carousel for many clubs
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
                ref={clubScrollRef}
                className="overflow-x-auto scroll-smooth pb-6 scrollbar-hide manual-scroll-container p-6 sm:p-8 w-full max-w-[calc(100vw-2rem)]"
                onScroll={handleUserScroll}
                onTouchStart={handleUserScroll}
                onTouchMove={handleUserScroll}
              >
                <div
                  className={`flex gap-4 ${isAutoScrolling && limitedClubs.length >= 3 ? "animate-smooth-scroll transition-transform duration-100 ease-out" : ""}`}
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
                  {duplicatedClubs.map((club: Club, index: number) => (
                    <div key={`${club.id}-${index}`} className="flex-shrink-0 w-64 sm:w-80">
                      <ClubCard
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
  )
}
