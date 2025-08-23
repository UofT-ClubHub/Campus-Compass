"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/model/firebase"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { collection, query, where, getDocs, getFirestore } from "firebase/firestore"
import db from "@/model/firebase"
import type { User } from "@/model/types"
import { ArrowLeft, Building2, Users, MapPin, Instagram, ExternalLink } from "lucide-react"
import PositionCard from "@/components/PositionCard"

interface PageProps {
  params: Promise<{
    clubID: string
  }>
}

export default function ApplicationsPage({ params }: PageProps) {
  const [clubID, setClubID] = useState<string>("")
  const [clubData, setClubData] = useState<any>(null)
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      const resolvedParams = await params
      const id = resolvedParams.clubID
      setClubID(id)

      // Fetch club data
      try {
        const firestore = getFirestore(db)
        const clubRef = collection(firestore, "Clubs")
        const clubQuery = query(clubRef, where("__name__", "==", id))
        const clubSnapshot = await getDocs(clubQuery)

        if (!clubSnapshot.empty) {
          const fetchedClubData = clubSnapshot.docs[0].data()
          setClubData(fetchedClubData)
        }
      } catch (error) {
        console.error("Error fetching club data:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeComponent()
  }, [params])

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
    })

    return () => unsubscribe()
  }, [])

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (authUser) {
        try {
          const token = await authUser.getIdToken()
          const response = await fetch(`/api/users?id=${authUser.uid}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (response.ok) {
            const userData = await response.json()
            setCurrentUser(userData)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        setCurrentUser(null)
      }
    }

    fetchCurrentUser()
  }, [authUser])

  const handleBackToClub = () => {
    router.push(`/clubPage/${clubID}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading applications...</p>
        </div>
      </div>
    )
  }

  if (!clubData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full border border-border">
          <h2 className="text-xl font-semibold text-card-foreground mb-3">Club Not Found</h2>
          <p className="text-muted-foreground">The requested club could not be found.</p>
          <button
            onClick={() => router.push('/positionsPage')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Positions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-theme-gradient bg-animated-elements relative">
      {/* Animated background elements */}
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className={`element-${i + 1}`}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            filter: 'blur(48px)',
            willChange: 'opacity, transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        />
      ))}
      
      <main className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleBackToClub}
              className="flex items-center gap-2 px-4 py-2 bg-card/30 backdrop-blur-xl border border-white/20 rounded-lg shadow-lg hover:shadow-xl hover:bg-primary/20 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Back to Club</span>
            </button>
          </div>

          {/* Club Header Section */}
          <header className="relative text-white rounded-2xl p-8 mb-8 shadow-xl overflow-hidden bg-card/30 backdrop-blur-xl border border-white/20 form-glow">
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-md"
              style={{ backgroundImage: `url(${clubData?.image || "/placeholder.svg"})` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/50"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
              {/* Logo and Title Section */}
              <div className="flex items-center gap-6 mb-6">
                <img
                  src={clubData?.image || "/placeholder.svg"}
                  alt={`${clubData?.name} logo`}
                  className="w-20 h-20 rounded-full border-4 border-white/50 shadow-lg backdrop-blur-sm"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
                    {clubData?.name} - Open Positions
                  </h1>
                  <p className="text-white/90 text-lg font-medium leading-relaxed">
                    {clubData?.description}
                  </p>
                </div>
              </div>

              {/* Club Info */}
              <div className="flex flex-wrap gap-6">
                {clubData?.department && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-white/70" />
                    <span className="text-white/90 font-medium">{clubData?.department}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-white/70" />
                  <span className="text-white/90 font-medium">{clubData?.followers || 0} Followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-white/70" />
                  <span className="text-white/90 font-medium">{clubData?.campus}</span>
                </div>
                {clubData?.instagram && (
                  <a 
                    href={`https://instagram.com/${clubData.instagram.replace(/^@/, "")}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 hover:text-accent transition-colors"
                  >
                    <Instagram className="w-5 h-5 text-accent" />
                    <span className="text-white/90 font-medium">@{clubData.instagram.replace(/^@/, "")}</span>
                  </a>
                )}
              </div>

              {/* External Links */}
              {clubData?.links && Object.keys(clubData.links).length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(clubData.links as Record<string, string>)
                      .slice(0, 3)
                      .map(([key, link], index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-accent" />
                        <span className="text-white/90 text-sm font-medium">{key}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* All Positions Section */}
          <div className="bg-card/30 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 form-glow max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Club Positions</h2>
            
            {/* Display all positions using PositionCard component */}
            {(() => {
              // Combine open and closed positions
              const openPositions = clubData?.openPositions || [];
              const closedPositions = clubData?.closedPositions || [];
              const allPositions = [...openPositions, ...closedPositions];
              
              if (allPositions.length > 0) {
                return (
                  <div className="space-y-4">
                    {/* Open Positions First */}
                    {openPositions.map((position: any, index: number) => {
                      // Check if deadline has passed to determine actual status
                      const deadline = position.deadline ? new Date(position.deadline) : null;
                      const isDeadlinePassed = deadline && deadline < new Date();
                      const actualStatus = isDeadlinePassed ? 'closed' : 'open';
                      
                      const transformedPosition = {
                        positionId: position.positionId || `open-position-${index}`,
                        title: position.title || "Position",
                        description: position.description || "No description provided",
                        requirements: position.requirements || [],
                        deadline: position.deadline,
                        date_posted: position.date_posted,
                        status: actualStatus as 'open' | 'closed',
                        questions: position.questions || {},
                        clubId: clubID,
                        clubName: clubData.name,
                        clubCampus: clubData.campus || '',
                        clubDepartment: clubData.department || ''
                      }
                      
                      return (
                        <PositionCard 
                          key={transformedPosition.positionId} 
                          position={transformedPosition} 
                        />
                      )
                    })}
                    
                    {/* Closed Positions */}
                    {closedPositions.map((position: any, index: number) => {
                      const transformedPosition = {
                        positionId: position.positionId || `closed-position-${index}`,
                        title: position.title || "Position",
                        description: position.description || "No description provided",
                        requirements: position.requirements || [],
                        deadline: position.deadline,
                        date_posted: position.date_posted,
                        status: 'closed' as const,
                        questions: position.questions || {},
                        clubId: clubID,
                        clubName: clubData.name,
                        clubCampus: clubData.campus || '',
                        clubDepartment: clubData.department || ''
                      }
                      
                      return (
                        <PositionCard 
                          key={transformedPosition.positionId} 
                          position={transformedPosition} 
                        />
                      )
                    })}
                  </div>
                );
              } else {
                return (
                  <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <svg
                      className="w-16 h-16 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <h3 className="text-xl font-semibold text-white mb-2">No Positions Available</h3>
                    <p className="text-gray-300 text-center max-w-md">
                      {clubData?.name} doesn't have any positions at the moment. 
                      Check back soon for available opportunities!
                    </p>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </main>
    </div>
  )
}
