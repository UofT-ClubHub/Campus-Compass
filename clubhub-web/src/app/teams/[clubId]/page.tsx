"use client"

import { useState, useEffect } from "react"
import db from "@/model/firebase"
import { collection, query, where, getDocs, getFirestore, orderBy } from "firebase/firestore"
import { auth } from "@/model/firebase"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import type { Club, Post, User } from "@/model/types"
import { PostCard } from "@/components/post-card"
import { Users, UserCheck, Instagram, MapPin, Heart, HeartOff, ExternalLink, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageProps {
  params: Promise<{
    clubId: string
  }>
}


export default function TeamPage({ params }: { params: any }) {
  // Do NOT access params synchronously — initialize to null and resolve in useEffect
  const [clubId, setClubId] = useState<string | null>(null)

  useEffect(() => {
    if (!params) return
    if (typeof (params as any).then === 'function') {
      ;(params as any).then((p: any) => setClubId(p.clubId))
    } else if (params.clubId) {
      setClubId(params.clubId)
    }
  }, [params])

  // track firebase auth state so we can attach ID token to protected API
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState<boolean>(true)
  const router = useRouter()
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  type Team = {
    id?: string;
    team: string;
    teamLeads: string[];
  };

  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState("");

  // Add Lead modal state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    // don't attempt fetch until Firebase auth finishes initializing
    console.log('Teams useEffect:', { clubId, authLoading, authUser: authUser?.uid })
    if (authLoading) return
    // require authenticated user for protected endpoint
    if (!authUser) {
      setError('You must be signed in to view teams')
      // optional: redirect to auth page
      // router.push('/auth')
      setLoading(false)
      return
    }

    const fetchTeams = async () => {
       try {
         setLoading(true)
         setError(null)

         const headers: Record<string, string> = { 'Content-Type': 'application/json' }
         if (authUser) {
           const token = await authUser.getIdToken()
           headers['Authorization'] = `Bearer ${token}`
         }

         console.log('Fetching teams for clubId:', clubId)
         const res = await fetch(`/api/teams?clubId=${encodeURIComponent(clubId ?? '')}`, { headers })
         console.log('API response status:', res.status)
         
         if (!res.ok) {
           const body = await res.json().catch(() => ({}))
           console.error('API error response:', body)
           throw new Error(body.message || body.error || `Failed to fetch teams (${res.status})`)
         }

         const data = await res.json()
         console.log('API response data:', data)
         // normalize returned structure
         const returned = Array.isArray(data) ? data : data?.teams ?? []
         console.log('Normalized teams array:', returned)
         setTeams(returned as Team[])
       }
       catch (err: any) {
         console.error('Error loading teams:', err)
         setError(err.message || 'An unexpected error occurred')
       }
       finally {
         setLoading(false)
       }
     }

     if (clubId) {
       fetchTeams()
     }
  }, [clubId, authUser, authLoading, router])

return (
    <div className="min-h-screen bg-theme-gradient bg-animated-elements relative overflow-hidden">
      {/* Animated background elements that adapt to theme */}
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
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mb-8 md:mb-12">
            <div className="bg-card/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl border border-border/20 form-glow">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 drop-shadow-lg">
                  Teams
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg font-medium mb-6">
                  Organize and manage your team structure
                </p>

                <button
                  onClick={() => setShowModal(true)}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg font-semibold text-sm sm:text-base hover:shadow-lg hover:scale-105 transition-all duration-200 border border-primary/50"
                >
                  + Add Team
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm sm:text-base">Loading teams...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-destructive/20 border border-destructive/50 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-destructive-foreground text-sm">{error}</p>
            </div>
          )}

          {teams.length === 0 && !loading && !error && (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground/80 mb-2">
                No teams yet
              </h3>
              <p className="text-muted-foreground">Create your first team to get started</p>
            </div>
          )}

          {teams.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {teams.map((team: any) => (
                <div
                  key={team.team}
                  className="bg-card/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-border/20 hover:border-border/40 hover:bg-card/40 transition-all duration-300 hover:shadow-2xl hover:scale-105 flex flex-col justify-between min-h-60 card-glow"
                >
                  <div>
                    <h2 className="font-bold text-2xl sm:text-3xl text-foreground text-center mb-4 break-words">
                      {team.team}
                    </h2>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
                  </div>

                  {team.teamLeads && team.teamLeads.length > 0 ? (
                    <div className="mb-4 text-center">
                      <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-3">
                        Team Leads:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {team.teamLeads.map((lead: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-primary/30 text-primary-foreground px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-primary/50 backdrop-blur-sm"
                          >
                            {lead}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm mb-4 text-center italic">
                      No leads assigned yet
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setSelectedTeamId(team.id || null);
                      setShowLeadModal(true);
                    }}
                    className="w-full bg-primary/80 hover:bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 border border-primary/50 hover:border-primary mt-auto"
                  >
                    + Add Lead
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-border/20 form-glow">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-card-foreground mb-6">Add Team</h2>

              <input
                type="text"
                placeholder="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all mb-6"
              />

              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground rounded-lg font-semibold transition-all duration-200 border border-secondary/20 hover:border-secondary/40"
                  onClick={() => {
                    setShowModal(false);
                    setTeamName('');
                  }}
                >
                  Cancel
                </button>

                <button
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg font-semibold transition-all duration-200 border border-primary/50 hover:shadow-lg"
                  onClick={async () => {
                    if (!teamName) return alert('Enter a team name');
                    if (!clubId) return alert('Club ID is missing');

                    try {
                      const token = authUser ? await authUser.getIdToken() : undefined;

                      const res = await fetch(
                        `/api/teams?clubId=${encodeURIComponent(clubId)}`,
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': "application/json",
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {} ),
                          },
                          body: JSON.stringify({ team: teamName, teamLeads: [] } ),
                        }
                      );

                      if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        console.error('add team error:', body);
                        throw new Error(body.message || body.error || `Failed to add team (${res.status})`);
                      }

                      // Success - close modal and refresh
                      setShowModal(false);
                      setTeamName('');
                      window.location.reload();
                    } catch (err: any) {
                      console.error('Error adding team:', err);
                      alert(err.message || 'Failed to add team');
                      // Reset modal state even on error
                      setShowModal(false);
                      setTeamName('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLeadModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-border/20 form-glow">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-card-foreground mb-6">Add Team Lead</h2>

              <input
                type="text"
                placeholder="Lead name"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all mb-6"
              />

              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground rounded-lg font-semibold transition-all duration-200 border border-secondary/20 hover:border-secondary/40"
                  onClick={() => {
                    setShowLeadModal(false);
                    setLeadName('');
                    setSelectedTeamId(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg font-semibold transition-all duration-200 border border-primary/50 hover:shadow-lg"
                  onClick={async () => {
                    if (!leadName) return alert('Enter a lead name');
                    if (!selectedTeamId) return alert('No team selected');

                    try {
                      const token = await authUser?.getIdToken()
                      const selectedTeam = teams.find(t => t.id === selectedTeamId)
                      if (!selectedTeam) return alert("Team not found")

                      const updatedLeads = [...(selectedTeam.teamLeads || []), leadName]

                      const res = await fetch(`/api/teams?clubId=${clubId}&teamId=${selectedTeamId}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ 
                          team: selectedTeam.team,
                          teamLeads: updatedLeads 
                        }),
                      })

                      if (res.ok) {
                        setShowLeadModal(false)
                        setLeadName("")
                        setSelectedTeamId(null)
                        window.location.reload()
                      } else {
                        const errorBody = await res.json().catch(() => ({}))
                        console.error('Add lead error:', errorBody)
                        alert("Failed to add lead")
                      }
                    } catch (err) {
                      console.error("Error adding lead:", err)
                      alert("Error adding lead")
                    }
                  }}
                >
                  Add Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(20px);
          }
        }
      `}</style>
    </div>
  );
}
