"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/model/firebase"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { collection, query, where, getDocs, getFirestore } from "firebase/firestore"
import db from "@/model/firebase"
import type { User } from "@/model/types"
import { ArrowLeft, Building2, Users, MapPin, Instagram, ExternalLink, Plus, X, Save } from "lucide-react"
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
  const [positions, setPositions] = useState<any[]>([])
  const [isExecutive, setIsExecutive] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [backPage, setBackPage] = useState<'exec' | 'club'>('exec')
  const router = useRouter()

  // Add position form state
  const [newPosition, setNewPosition] = useState({
    title: '',
    description: '',
    requirements: [''],
    questions: { Q1: { question: '', type: 'text' } } as Record<string, { question: string; type: string }>,
    deadline: ''
  })

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      const resolvedParams = await params
      const id = resolvedParams.clubID
      setClubID(id)

      // Determine which page user came from based on referrer
      const referrer = document.referrer
      console.log('Referrer:', referrer, 'Club ID:', id)
      
      if (referrer.includes('/exec')) {
        setBackPage('exec')
        console.log('Set back page to exec')
      } else if (referrer.includes('/clubPage/')) {
        setBackPage('club')
        console.log('Set back page to club')
      } else {
        // Check if referrer contains the club ID in any form
        if (referrer.includes(id)) {
          setBackPage('club')
          console.log('Set back page to club (found club ID in referrer)')
        } else {
          // Default to exec if we can't determine
          setBackPage('exec')
          console.log('Set back page to exec (default)')
        }
      }

      // Fetch club data
      try {
        const firestore = getFirestore(db)
        const clubRef = collection(firestore, "Clubs")
        const clubQuery = query(clubRef, where("__name__", "==", id))
        const clubSnapshot = await getDocs(clubQuery)

        if (!clubSnapshot.empty) {
          const fetchedClubData = clubSnapshot.docs[0].data()
          setClubData(fetchedClubData)
          
          // Fetch positions using existing API
          await fetchPositions(id)
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

  // Check executive status when both user data and clubID are available
  useEffect(() => {
    if (currentUser && clubID) {
      // Check if user is executive of THIS SPECIFIC club ONLY
      const isClubExecutive = currentUser.managed_clubs?.includes(clubID) || false
      setIsExecutive(isClubExecutive)
      console.log('Executive check:', {
        clubID,
        managedClubs: currentUser.managed_clubs,
        isClubExecutive
      })
    } else {
      setIsExecutive(false)
    }
  }, [currentUser, clubID])

  // Fetch positions using existing API endpoint
  const fetchPositions = async (clubId: string) => {
    try {
      const response = await fetch(`/api/positions?id=${clubId}&show_open=true&show_closed=true`)
      if (response.ok) {
        const fetchedPositions = await response.json()
        setPositions(fetchedPositions)
      }
    } catch (error) {
      console.error("Error fetching positions:", error)
    }
  }

  const handleBackNavigation = () => {
    if (backPage === 'club') {
      router.push(`/clubPage/${clubID}`)
    } else {
      router.push('/exec')
    }
  }

  // Add new position using existing API
  const handleAddPosition = async () => {
    if (!authUser || !newPosition.title || !newPosition.description) {
      alert('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    try {
      const token = await authUser.getIdToken()
      const response = await fetch(`/api/positions?id=${clubID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          positionId: `pos-${Date.now()}`, // Generate unique ID
          currentStatus: 'open',
          title: newPosition.title,
          description: newPosition.description,
          requirements: newPosition.requirements.filter(req => req.trim() !== ''),
          questions: newPosition.questions,
          deadline: newPosition.deadline || null,
          status: 'open'
        })
      })

      if (response.ok) {
        // Refresh positions
        await fetchPositions(clubID)
        
        // Reset form
        setNewPosition({
          title: '',
          description: '',
          requirements: [''],
          questions: { Q1: { question: '', type: 'text' } },
          deadline: ''
        })
        setShowAddForm(false)
        alert('Position added successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Failed to add position'}`)
      }
    } catch (error) {
      console.error('Error adding position:', error)
      alert('Failed to add position. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Helper functions for form management
  const addRequirement = () => {
    setNewPosition(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }))
  }

  const updateRequirement = (index: number, value: string) => {
    setNewPosition(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }))
  }

  const removeRequirement = (index: number) => {
    setNewPosition(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const addQuestion = () => {
    const questionCount = Object.keys(newPosition.questions).length + 1
    setNewPosition(prev => ({
      ...prev,
      questions: {
        ...prev.questions,
        [`Q${questionCount}`]: { question: '', type: 'text' }
      }
    }))
  }

  const updateQuestion = (key: string, field: 'question' | 'type', value: string) => {
    setNewPosition(prev => ({
      ...prev,
      questions: {
        ...prev.questions,
        [key]: {
          ...prev.questions[key],
          [field]: value
        }
      }
    }))
  }

  const removeQuestion = (key: string) => {
    setNewPosition(prev => {
      const newQuestions = { ...prev.questions }
      delete newQuestions[key]
      return {
        ...prev,
        questions: newQuestions
      }
    })
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
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-3 px-6 py-3 bg-card/30 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg hover:shadow-xl hover:bg-primary/20 transition-all duration-200 hover:scale-[1.02] text-sm font-medium"
            >
              <ArrowLeft className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-primary">
                {backPage === 'club' ? 'Back to Club Page' : 'Back to Executive Page'}
              </span>
            </button>
          </div>

          {/* Club Header Section */}
          <header className="relative text-white rounded-2xl p-8 mb-8 shadow-xl overflow-hidden bg-card/30 backdrop-blur-xl border border-white/20 form-glow">
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-md"
              style={{ backgroundImage: `url(${clubData?.image || "/placeholder.svg"})` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/50"></div>
            <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center justify-center">
              {/* Logo and Title Section */}
              <div className="flex flex-col items-center gap-6 mb-6">
                <img
                  src={clubData?.image || "/placeholder.svg"}
                  alt={`${clubData?.name} logo`}
                  className="w-20 h-20 rounded-full border-4 border-white/50 shadow-lg backdrop-blur-sm"
                />
                <div className="text-center">
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Club Positions</h2>
              {isExecutive && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Add New Position
                </button>
              )}
            </div>

            {/* Add Position Form */}
            {showAddForm && isExecutive && (
              <div className="mb-8 p-6 bg-card/50 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-foreground">Add New Position</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Position Title *</label>
                    <input
                      type="text"
                      value={newPosition.title}
                      onChange={(e) => setNewPosition(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                      placeholder="Enter position title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
                    <textarea
                      value={newPosition.description}
                      onChange={(e) => setNewPosition(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground resize-none"
                      placeholder="Enter position description"
                    />
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Application Deadline</label>
                    <input
                      type="date"
                      value={newPosition.deadline ? new Date(newPosition.deadline).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          // Create date at noon local time to avoid timezone issues
                          const selectedDate = new Date(e.target.value + 'T12:00:00')
                          setNewPosition(prev => ({ ...prev, deadline: selectedDate.toISOString() }))
                        } else {
                          setNewPosition(prev => ({ ...prev, deadline: '' }))
                        }
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    />
                  </div>

                  {/* Requirements */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-foreground">Requirements</label>
                      <button
                        onClick={addRequirement}
                        className="text-primary hover:text-primary/80 text-sm"
                      >
                        + Add Requirement
                      </button>
                    </div>
                    <div className="space-y-2">
                      {newPosition.requirements.map((req, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => updateRequirement(index, e.target.value)}
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                            placeholder="Enter requirement"
                          />
                          <button
                            onClick={() => removeRequirement(index)}
                            className="px-3 py-2 text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-foreground">Application Questions</label>
                      <button
                        onClick={addQuestion}
                        className="text-primary hover:text-primary/80 text-sm"
                      >
                        + Add Question
                      </button>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(newPosition.questions).map(([key, questionData]) => (
                        <div key={key} className="p-3 bg-background/50 rounded-lg border border-border">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-foreground">{key}</label>
                            <button
                              onClick={() => removeQuestion(key)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={questionData.question}
                              onChange={(e) => updateQuestion(key, 'question', e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                              placeholder="Enter question text"
                            />
                            <select
                              value={questionData.type}
                              onChange={(e) => updateQuestion(key, 'type', e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                            >
                              <option value="text">Short Text</option>
                              <option value="textarea">Long Text</option>
                              <option value="file">File Upload</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleAddPosition}
                      disabled={isCreating || !newPosition.title || !newPosition.description}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4" />
                      {isCreating ? 'Creating...' : 'Create Position'}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Display all positions using PositionCard component */}
            {positions.length > 0 ? (
              <div className="space-y-4">
                {positions.map((position: any) => {
                  // Check if deadline has passed to determine actual status
                  const deadline = position.deadline ? new Date(position.deadline) : null;
                  const isDeadlinePassed = deadline && deadline < new Date();
                  const actualStatus = isDeadlinePassed ? 'closed' : (position.status || 'open');
                  
                  const transformedPosition = {
                    positionId: position.id || position.positionId,
                    title: position.title || "Position",
                    description: position.description || "No description provided",
                    requirements: position.requirements || [],
                    deadline: position.deadline,
                    date_posted: position.date_posted,
                    status: actualStatus as 'open' | 'closed',
                    questions: position.questions || {},
                    clubId: position.clubId || clubID,
                    clubName: position.clubName || clubData?.name,
                    clubCampus: position.clubCampus || clubData?.campus || '',
                    clubDepartment: position.clubDepartment || clubData?.department || ''
                  }
                  
                  return (
                    <PositionCard 
                      key={transformedPosition.positionId} 
                      position={transformedPosition}
                      onPositionUpdate={() => fetchPositions(clubID)}
                    />
                  )
                })}
              </div>
            ) : (
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
                  {isExecutive && " Click 'Add New Position' to create one!"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
