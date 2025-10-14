"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/model/firebase"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import type { User } from "@/model/types"
import { ArrowLeft, Users, Calendar, CheckCircle, Clock, X, AlertTriangle, Eye, FileText, Mail, User as UserIcon } from "lucide-react"

interface PageProps {
  params: Promise<{
    clubID: string
    positionId: string
  }>
}

interface Application {
  id: string
  userId: string
  answers: Record<string, string>
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  submittedAt: string
  positionId: string
  clubId: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  school_email?: string
}

interface Position {
  id: string
  title: string
  description: string
  questions?: Record<string, { question: string; type: string }>
  deadline?: string
  clubName?: string
}

export default function PositionApplicationsPage({ params }: PageProps) {
  const [clubID, setClubID] = useState<string>("")
  const [positionId, setPositionId] = useState<string>("")
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map())
  const [position, setPosition] = useState<Position | null>(null)
  const [isExecutive, setIsExecutive] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const router = useRouter()

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      const resolvedParams = await params
      const cId = resolvedParams.clubID
      const pId = resolvedParams.positionId
      setClubID(cId)
      setPositionId(pId)
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

  // Fetch current user data and check executive status
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
            
            // Check if user is executive of this specific club
            if (clubID) {
              const isClubExecutive = userData.managed_clubs?.includes(clubID) || false
              setIsExecutive(isClubExecutive)
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        setCurrentUser(null)
        setIsExecutive(false)
      }
    }

    if (authUser && clubID) {
      fetchCurrentUser()
    }
  }, [authUser, clubID])

  // Fetch applications and position data
  useEffect(() => {
    const fetchData = async () => {
      if (!authUser || !clubID || !positionId || !isExecutive) {
        setLoading(false)
        return
      }

      try {
        const token = await authUser.getIdToken()

        // Fetch applications for this position
        const appsResponse = await fetch(
          `/api/submitted-applications?clubId=${clubID}&positionId=${positionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (appsResponse.ok) {
          const appsData = await appsResponse.json()
          // Filter out draft applications - only show submitted ones
          const submittedApps = appsData.filter((app: Application) => app.status !== 'draft')
          setApplications(submittedApps)

          // Fetch user profiles for all applicants
          const userIds = [...new Set(submittedApps.map((app: Application) => app.userId))]
          const profilePromises = userIds.map(async (userId) => {
            const userResponse = await fetch(`/api/users?id=${userId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (userResponse.ok) {
              const userData = await userResponse.json()
              return { userId, userData }
            }
            return null
          })

          const profiles = await Promise.all(profilePromises)
          const profileMap = new Map()
          profiles.forEach((profile) => {
            if (profile) {
              profileMap.set(profile.userId, profile.userData)
            }
          })
          setUserProfiles(profileMap)
        }

        // Fetch position details
        const posResponse = await fetch(`/api/positions?id=${clubID}`)
        if (posResponse.ok) {
          const positions = await posResponse.json()
          const currentPosition = positions.find((pos: any) => pos.id === positionId || pos.positionId === positionId)
          if (currentPosition) {
            setPosition({
              id: currentPosition.id || currentPosition.positionId,
              title: currentPosition.title,
              description: currentPosition.description,
              questions: currentPosition.questions,
              deadline: currentPosition.deadline,
              clubName: currentPosition.clubName
            })
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authUser, clubID, positionId, isExecutive])

  const handleStatusUpdate = async (applicationId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    if (!authUser) return

    setUpdatingStatus(applicationId)
    try {
      const token = await authUser.getIdToken()
      const application = applications.find(app => app.id === applicationId)
      if (!application) return

      const response = await fetch('/api/submitted-applications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId,
          status: newStatus,
          clubId: clubID,
          userId: application.userId
        })
      })

      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        )
        alert(`Application ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'updated'} successfully!`)
      } else {
        alert('Failed to update application status')
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Failed to update application status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return dateString
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <X className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  if (!authUser || !isExecutive) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full border border-border">
          <h2 className="text-xl font-semibold text-card-foreground mb-3">Access Denied</h2>
          <p className="text-muted-foreground">You need to be an executive of this club to view applications.</p>
          <button
            onClick={() => router.push(`/applicationsPage/${clubID}`)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Club Positions
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/applicationsPage/${clubID}`)}
              className="inline-flex items-center gap-3 px-6 py-3 bg-card/30 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg hover:shadow-xl hover:bg-primary/20 transition-all duration-200 hover:scale-[1.02] text-sm font-medium"
            >
              <ArrowLeft className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-primary">Back to Club Positions</span>
            </button>
          </div>

          {/* Header */}
          <div className="bg-card/30 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8 mb-8 form-glow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {position?.title || 'Position'} Applications
                </h1>
                <p className="text-muted-foreground">
                  {position?.clubName && `${position.clubName} • `}
                  {applications.length} application{applications.length !== 1 ? 's' : ''} submitted
                </p>
              </div>
            </div>

            {position?.description && (
              <div className="bg-background/50 rounded-lg p-4 border border-border">
                <p className="text-card-foreground">{position.description}</p>
              </div>
            )}

            {position?.deadline && (
              <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Deadline: {formatDate(position.deadline)}</span>
              </div>
            )}
          </div>

          {/* Applications List */}
          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((application) => {
                const userProfile = userProfiles.get(application.userId)
                return (
                  <div
                    key={application.id}
                    className="bg-card/30 backdrop-blur-xl rounded-lg shadow-lg border border-white/20 overflow-hidden form-glow"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {userProfile?.name || 'Unknown User'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span>{userProfile?.email || userProfile?.school_email || 'No email available'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </div>
                          <button
                            onClick={() => setSelectedApplication(selectedApplication?.id === application.id ? null : application)}
                            className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            {selectedApplication?.id === application.id ? 'Hide' : 'View'} Details
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Submitted {formatDate(application.submittedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{Object.keys(application.answers).length} response{Object.keys(application.answers).length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {application.status === 'pending' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'approved')}
                            disabled={updatingStatus === application.id}
                            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {updatingStatus === application.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            disabled={updatingStatus === application.id}
                            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            {updatingStatus === application.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {application.status !== 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(application.id, 'pending')}
                          disabled={updatingStatus === application.id}
                          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50"
                        >
                          <Clock className="w-4 h-4" />
                          {updatingStatus === application.id ? 'Updating...' : 'Reset to Pending'}
                        </button>
                      )}
                    </div>

                    {/* Application Details */}
                    {selectedApplication?.id === application.id && (
                      <div className="border-t border-border bg-background/30 p-6">
                        <h4 className="text-lg font-semibold text-foreground mb-4">Application Responses</h4>
                        <div className="space-y-4">
                          {position?.questions && Object.entries(position.questions).map(([questionKey, questionData]) => {
                            const questionText = typeof questionData === 'string' ? questionData : questionData.question
                            const answer = application.answers[questionKey] || 'No response provided'
                            
                            return (
                              <div key={questionKey} className="bg-card/50 rounded-lg p-4 border border-border">
                                <h5 className="font-medium text-foreground mb-2">{questionText}</h5>
                                <p className="text-card-foreground/80 whitespace-pre-wrap">{answer}</p>
                              </div>
                            )
                          })}
                          
                          {(!position?.questions || Object.keys(position.questions).length === 0) && (
                            <div className="space-y-4">
                              {Object.entries(application.answers).map(([key, answer]) => (
                                <div key={key} className="bg-card/50 rounded-lg p-4 border border-border">
                                  <h5 className="font-medium text-foreground mb-2">{key}</h5>
                                  <p className="text-card-foreground/80 whitespace-pre-wrap">{answer}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-card/30 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-12 text-center form-glow">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No Applications Yet</h2>
              <p className="text-muted-foreground">
                No applications have been submitted for this position yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}