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
    clubId: string
    positionID: string
  }>
}

export default function applyPage({ params }: PageProps) {
    const [positionID, setPositionID] = useState<string>("")
    const [clubId, setClubId] = useState<string>("")
    const [position, setPosition] = useState<any | null>(null)
    const [club, setClub] = useState<any | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [submitMessage, setSubmitMessage] = useState<string | null>(null)

    useEffect(() => {
        const initializeComponent = async () => {
          const resolvedParams = await params
          const id = resolvedParams.positionID
          const club = resolvedParams.clubId
          setPositionID(id)
          setClubId(club)
        }
    
        initializeComponent()
      }, [params])

    useEffect(() => {
      const fetchPosition = async () => {
        if (!clubId || !positionID) return
        setLoading(true)
        setError(null)
        try {
          const response = await fetch(`/api/positions?id=${clubId}&positionId=${positionID}`)
          if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err?.message || "Failed to load position")
          }
          const data = await response.json()
          setPosition(data?.position ?? null)
          setClub(data?.club ?? null)
          console.log(data)
        } catch (e: any) {
          setError(e.message || "Failed to load position")
          setPosition(null)
          setClub(null)
        } finally {
          setLoading(false)
        }
      }
      fetchPosition()
    }, [clubId, positionID])

    const handleBackToClub = () => {
      router.push(`/clubPage/${clubId}`)
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
                style={{ backgroundImage: `url(${club?.image || "/placeholder.jpg"})` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/50"></div>
              <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center justify-center">
                {/* Logo and Title Section */}
                <div className="flex flex-col items-center gap-6 mb-6">
                  <img
                    src={club?.image || "/placeholder.jpg"}
                    alt={`${club?.name || 'Club'} logo`}
                    className="w-20 h-20 rounded-full border-4 border-white/50 shadow-lg backdrop-blur-sm"
                  />
                  <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
                      {club?.name}
                    </h1>
                    <p className="text-white/90 text-lg font-medium leading-relaxed">
                      {club?.description}
                    </p>
                  </div>
                </div>
                {/* Club Info */}
                <div className="flex flex-wrap gap-6">
                  {club?.department && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-white/70" />
                      <span className="text-white/90 font-medium">{club?.department}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-white/70" />
                    <span className="text-white/90 font-medium">{club?.followers || 0} Followers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-white/70" />
                    <span className="text-white/90 font-medium">{club?.campus}</span>
                  </div>
                  {club?.instagram && (
                    <a
                      href={`https://instagram.com/${(club.instagram as string).replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-accent transition-colors"
                    >
                      <Instagram className="w-5 h-5 text-accent" />
                      <span className="text-white/90 font-medium">@{(club.instagram as string).replace(/^@/, "")}</span>
                    </a>
                  )}
                </div>
                {/* External Links */}
                {club?.links && Object.keys(club.links as Record<string, string>).length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(club.links as Record<string, string>)
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

            {/* Application Questions */}
            {position?.questions && Object.keys(position.questions as Record<string, any>).length > 0 && (
              <section className="bg-card/30 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 form-glow">
                <h2 className="text-xl font-semibold text-foreground mb-4">Application Questions</h2>
                <div className="space-y-4">
                  {Object.entries(position.questions as Record<string, any>)
                    .sort(([a], [b]) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")))
                    .map(([key, value]) => {
                      const questionText = typeof value === 'string' ? value : (value?.question ?? key)
                      const typeText = typeof value === 'object' && value !== null ? (value.type ?? 'text') : 'text'
                      return (
                        <div key={key} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-background/40">
                          <div className="flex items-start gap-3">
                            <span className="text-muted-foreground font-medium min-w-10">{key}</span>
                            <div>
                              <p className="text-foreground font-medium">{questionText}</p>
                            </div>
                          </div>
                          <textarea
                            value={answers[key] || ""}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                            placeholder="Enter your response..."
                            className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground resize-vertical min-h-[96px]"
                          />
                        </div>
                      )
                    })}
                </div>
              </section>
            )}
            {/* Submit Actions */}
            {position && (
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!clubId || !positionID) return
                    setIsSubmitting(true)
                    setSubmitMessage(null)
                    try {
                      const user = auth.currentUser
                      if (!user) {
                        setSubmitMessage("Please log in to submit your application.")
                        setIsSubmitting(false)
                        router.push("/auth")
                        return
                      }
                      const token = await user.getIdToken()
                      const res = await fetch('/api/submitted-applications', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          clubId,
                          positionId: positionID,
                          userId: user.uid,
                          answers,
                        }),
                      })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || 'Failed to submit application')
                      }
                      setSubmitMessage('Application submitted successfully!')
                    } catch (e: any) {
                      setSubmitMessage(e.message || 'Submission failed')
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                  disabled={isSubmitting || Object.keys(answers).length === 0}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-lg font-semibold transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
                {submitMessage && (
                  <span className="text-sm text-muted-foreground">{submitMessage}</span>
                )}
              </div>
            )}
          </div>

          
        </main>
      </div>
    )
}
