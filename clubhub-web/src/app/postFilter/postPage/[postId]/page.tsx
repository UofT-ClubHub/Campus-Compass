"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { auth } from "@/model/firebase"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import type { Post, User, Club } from "@/model/types"
import { Users, UserCheck, Instagram, MapPin, Heart, HeartOff, ExternalLink, Calendar, Clock, Edit, Trash2, ArrowLeft, Save, X, Plus } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"

export default function PostPage() {
  const { theme } = useTheme()
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string
  
  const [post, setPost] = useState<Post | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [clubName, setClubName] = useState("")
  const [clubId, setClubId] = useState<string | null>(null)
  const [clubImage, setClubImage] = useState<string | null>(null)
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPost, setEditedPost] = useState<Post | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isImageExpanded, setIsImageExpanded] = useState(false)
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null)
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null)

  // Fetch post data
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const response = await fetch(`/api/posts?id=${postId}`)
        if (response.ok) {
          const postData = await response.json()
          setPost(postData)
          setEditedPost(postData) // Initialize edited post
          setLikes(postData.likes || 0)
        } else {
          setError("Post not found")
        }
      } catch (err) {
        setError("Failed to load post")
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPostData()
    }
  }, [postId])

  // Fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken()
          const response = await fetch(`/api/users?id=${user.uid}`, {
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
    })
    return () => unsubscribe()
  }, [])

  // Update liked status
  useEffect(() => {
    if (currentUser?.liked_posts && post?.id) {
      setIsLiked(currentUser.liked_posts.includes(post.id))
    }
  }, [currentUser, post?.id])

  // Fetch club data
  useEffect(() => {
    const fetchClubData = async () => {
      if (post && post.club) {
        try {
          const res = await fetch(`/api/clubs?id=${post.club}`)
          if (res.ok) {
            const clubData: Club = await res.json()
            setClubName(clubData.name)
            setClubId(clubData.id)
            setClubImage(clubData.image || null)
          } else {
            setClubName("Unknown Club")
            setClubImage(null)
          }
        } catch (error) {
          setClubName("Unknown Club")
          setClubImage(null)
        }
      }
    }
    fetchClubData()
  }, [post?.club])

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isLiking) return
    
    setIsLiking(true)
    
    try {
      const user = auth.currentUser
      
      if (!user) {
        setError('Please log in to like posts')
        return
      }

      const idToken = await user.getIdToken()
      
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          postId: post?.id
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes)
        setIsLiked(data.liked)
        
        // Update currentUser's liked_posts to keep the state in sync
        setCurrentUser(prevUser => {
          if (!prevUser) return prevUser
          
          const currentLikedPosts = prevUser.liked_posts || []
          let updatedLikedPosts
          
          if (data.liked) {
            // Add postId if not already present
            updatedLikedPosts = currentLikedPosts.includes(post?.id || '') 
              ? currentLikedPosts 
              : [...currentLikedPosts, post?.id || '']
          } else {
            // Remove postId
            updatedLikedPosts = currentLikedPosts.filter(id => id !== post?.id)
          }
          
          return {
            ...prevUser,
            liked_posts: updatedLikedPosts
          }
        })
      } else {
        const errorData = await response.json()
        console.error('Like API error:', errorData)
        setError(errorData.error || 'Failed to like post')
      }
    } catch (error) {
      console.error('Like operation error:', error)
      setError('Error occurred while liking/unliking post')
    } finally {
      setIsLiking(false)
    }
  }

  const handleExportToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!post?.date_occuring) {
      setError('No Event Date Specified')
      return
    }

    const start = new Date(post.date_occuring)
    const end = new Date(start.getTime() + 60 * 60 * 1000) // Default 1 hour event

    const formatDate = (date: Date) => {
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date')
      }
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const icsContent = 
      `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YourApp//EN
BEGIN:VEVENT
UID:${post.id}@yourapp.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${post.title}
DESCRIPTION:${post.details || ''}
LOCATION:${post.campus || ''}
END:VEVENT
END:VCALENDAR`.trim()
      
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${post.title.replace(/\s+/g, "_")}.ics`
      link.click()

      URL.revokeObjectURL(url) // clean up
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editedPost) return
    
    setIsSaving(true)
    try {
      const user = auth.currentUser
      if (!user) {
        setError('Please log in to edit posts')
        return
      }

      const token = await user.getIdToken()
      const response = await fetch(`/api/posts?id=${post?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editedPost),
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPost(updatedPost)
        setEditedPost(updatedPost)
        setIsEditing(false)
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update post')
      }
    } catch (error) {
      setError('Error occurred while updating post')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedPost(post)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      const user = auth.currentUser
      if (!user) {
        setError('Please log in to delete posts')
        return
      }

      const token = await user.getIdToken()
      const response = await fetch(`/api/posts?id=${post?.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        router.push('/postFilter')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete post')
      }
    } catch (error) {
      setError('Error occurred while deleting post')
    }
  }

  const handleInputChange = (field: keyof Post, value: any) => {
    if (editedPost) {
      setEditedPost(prev => prev ? { ...prev, [field]: value } : null)
    }
  }

  const addHashtag = () => {
    if (editedPost) {
      setEditedPost(prev => prev ? { ...prev, hashtags: [...(prev.hashtags || []), ''] } : null)
    }
  }

  const removeHashtag = (index: number) => {
    if (editedPost) {
      setEditedPost(prev => prev ? {
        ...prev,
        hashtags: prev.hashtags?.filter((_, i) => i !== index) || []
      } : null)
    }
  }

  const updateHashtag = (index: number, value: string) => {
    if (editedPost) {
      setEditedPost(prev => prev ? {
        ...prev,
        hashtags: prev.hashtags?.map((tag, i) => i === index ? value : tag) || []
      } : null)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB')
        return
      }

      setUploadedImageFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedImagePreview(result)
        // Update the edited post with the preview URL for immediate display
        handleInputChange('image', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeUploadedImage = () => {
    setUploadedImageFile(null)
    setUploadedImagePreview(null)
    handleInputChange('image', '')
  }

  const isClubAdmin = currentUser?.managed_clubs?.includes(clubId || '') || false

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-gradient bg-animated-elements relative" data-theme={theme}>
        {/* Animated background elements */}
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={`element-${i + 1}`}></div>
        ))}
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading post...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-gradient bg-animated-elements relative" data-theme={theme}>
        {/* Animated background elements */}
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={`element-${i + 1}`}></div>
        ))}
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-lg mb-4">
              <strong>Error:</strong> {error}
            </div>
            <button 
              onClick={() => router.push('/postFilter')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
            >
              Back to Posts
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-theme-gradient bg-animated-elements relative" data-theme={theme}>
        {/* Animated background elements */}
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={`element-${i + 1}`}></div>
        ))}
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Post not found</p>
            <button 
              onClick={() => router.push('/postFilter')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
            >
              Back to Posts
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-theme-gradient bg-animated-elements relative" 
      data-theme={theme}
    >
      {/* Animated background elements */}
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className={`element-${i + 1}`}></div>
      ))}
      
      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-1"
            >
              <div className="p-2 rounded-full bg-card border border-border group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-200">
                <ArrowLeft size={18} />
              </div>
              <span className="font-medium">Back to Posts</span>
            </button>
            
            {isClubAdmin && (
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-500 hover:bg-green-600 border border-green-500 text-white rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 text-sm sm:text-base flex-1 sm:flex-none justify-center"
                    >
                      <Save size={14} className="sm:size-4" />
                      <span className="font-medium">{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-500 hover:bg-gray-600 border border-gray-500 text-white rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 text-sm sm:text-base flex-1 sm:flex-none justify-center"
                    >
                      <X size={14} className="sm:size-4" />
                      <span className="font-medium">Cancel</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleEdit}
                      className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-card hover:bg-secondary border border-border hover:border-secondary-foreground/20 text-foreground rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 text-sm sm:text-base flex-1 sm:flex-none justify-center"
                    >
                      <Edit size={14} className="sm:size-4 group-hover:text-primary transition-colors" />
                      <span className="font-medium">Edit Event</span>
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/40 text-destructive rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 text-sm sm:text-base flex-1 sm:flex-none justify-center"
                    >
                      <Trash2 size={14} className="sm:size-4" />
                      <span className="font-medium">Delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hero Section with Post Information */}
          <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl mb-6 sm:mb-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-4 sm:mb-6">
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    value={editedPost?.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 leading-tight w-full bg-card/60 border-2 border-primary/40 hover:border-primary/60 focus:border-primary focus:outline-none rounded-lg px-3 sm:px-4 py-2 sm:py-3 shadow-lg transition-all duration-200 focus:bg-card/80"
                    placeholder="Click to edit event title..."
                  />
                  <div className="absolute top-2 right-2 sm:right-3 text-primary/60 text-xs sm:text-sm font-medium pointer-events-none">
                     Editing
                  </div>
                </div>
              ) : (
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 leading-tight">{post?.title}</h1>
              )}
              <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
            </div>

            {/* Enhanced Info Grid */}
            <div className="w-full mb-6 sm:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* Date */}
              <div className="group flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 hover:border-primary/20 transition-all duration-200">
                <div className="p-3 sm:p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <Calendar size={20} className="sm:size-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Date</p>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editedPost?.date_occuring ? (() => {
                        const date = new Date(editedPost.date_occuring);
                        if (isNaN(date.getTime())) return '';
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                      })() : ''}
                      onChange={(e) => handleInputChange('date_occuring', e.target.value)}
                      className="font-semibold text-foreground bg-transparent border border-border rounded px-2 py-1 text-xs sm:text-sm w-full"
                    />
                  ) : (
                    <p className="font-semibold text-foreground text-sm sm:text-base">
                      {post?.date_occuring ? new Date(post.date_occuring).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'TBD'}
                    </p>
                  )}
                </div>
              </div>

              {/* Campus */}
              <div className="group flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/10 hover:border-accent/20 transition-all duration-200">
                <div className="p-3 sm:p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors flex-shrink-0">
                  <MapPin size={20} className="sm:size-6 text-accent-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Location</p>
                  {isEditing ? (
                    <select
                      value={editedPost?.campus || ''}
                      onChange={(e) => handleInputChange('campus', e.target.value)}
                      className="font-semibold text-foreground bg-transparent border border-border rounded px-2 py-1 text-xs sm:text-sm w-full"
                    >
                      <option value="">Select campus</option>
                      <option value="UTSG">UTSG</option>
                      <option value="UTSC">UTSC</option>
                      <option value="UTM">UTM</option>
                    </select>
                  ) : (
                    <p className="font-semibold text-foreground text-sm sm:text-base">{post?.campus || 'TBD'}</p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="group flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-emerald-25 to-lime-25 dark:from-green-500/20 dark:to-emerald-500/20 border border-emerald-100 dark:border-green-700/50 hover:border-emerald-200 dark:hover:border-green-600/70 transition-all duration-200">
                <div className="p-3 sm:p-4 rounded-full bg-emerald-50 dark:bg-green-800/50 group-hover:bg-emerald-100 dark:group-hover:bg-green-700/70 transition-colors flex-shrink-0">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-300 dark:bg-green-400 flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white animate-pulse"></div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Status</p>
                  <p className="font-bold text-emerald-700 dark:text-green-400 text-sm sm:text-base">Upcoming</p>
                </div>
              </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={handleLike}
                disabled={isLiking || !currentUser}
                className={`group flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-sm sm:text-base ${
                  isLiked
                    ? "bg-gradient-to-r from-red-50 to-pink-50 text-red-600 border-2 border-red-200 hover:border-red-300 hover:from-red-100 hover:to-pink-100"
                    : "bg-gradient-to-r from-card to-muted/50 hover:from-muted hover:to-card text-foreground border-2 border-border hover:border-primary/30"
                } ${(isLiking || !currentUser) ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100' : 'cursor-pointer'}`}
                title={!currentUser ? 'Please log in to like posts' : ''}
              >
                <div className="relative">
                  {isLiked ? (
                    <Heart size={18} className="sm:size-5 fill-current text-red-500" />
                  ) : (
                    <HeartOff size={18} className="sm:size-5 group-hover:text-red-500 transition-colors" />
                  )}
                  {isLiking && (
                    <div className="absolute inset-0 animate-spin">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                <span className="hidden sm:inline">
                  {likes} {likes === 1 ? 'Like' : 'Likes'}
                </span>
                <span className="sm:hidden">
                  {likes}
                </span>
                {!currentUser && <span className="text-xs opacity-70 hidden sm:inline">(Login required)</span>}
              </button>

              <button
                onClick={handleExportToCalendar}
                className="group flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <Calendar size={18} className="sm:size-5 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Add to Calendar</span>
                <span className="sm:hidden">Calendar</span>
              </button>

              {post.links && post.links.length > 0 && (
                <a
                  href={post.links[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary text-secondary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  <ExternalLink size={18} className="sm:size-5 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">Event Link</span>
                  <span className="sm:hidden">Link</span>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Gallery & Description */}
            <div className="xl:col-span-2 space-y-6 sm:space-y-8">
              {/* Enhanced Gallery */}
              <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Event Gallery</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
                </div>
                
                {post.image || isEditing ? (
                  <div className="group relative overflow-hidden rounded-xl bg-card/50">
                    {isEditing ? (
                      <div className="space-y-4">
                        {/* Image Upload Input */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Event Image
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer border border-border rounded-lg bg-card"
                            />
                            {(uploadedImagePreview || editedPost?.image) && (
                              <button
                                type="button"
                                onClick={removeUploadedImage}
                                className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Supported formats: JPG, PNG, GIF, WebP (Max: 5MB)
                          </p>
                        </div>
                        
                        {/* Image Preview */}
                        {(uploadedImagePreview || editedPost?.image) && (
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Preview
                            </label>
                            <div className="relative">
                              <img 
                                src={uploadedImagePreview || editedPost?.image || ''} 
                                alt="Preview"
                                className="w-full h-auto max-h-60 object-contain rounded-xl border border-border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {!uploadedImagePreview && !editedPost?.image && (
                          <div className="flex flex-col items-center justify-center h-32 bg-gradient-to-br from-muted to-muted/50 rounded-xl border-2 border-dashed border-border">
                            <div className="p-3 rounded-full bg-muted-foreground/10 mb-2">
                              <Calendar size={20} className="text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-sm">No image uploaded</p>
                            <p className="text-xs text-muted-foreground/70">Select a file above to upload</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <img 
                          src={post.image} 
                          alt={post.title}
                          title="Click to expand"
                          className="w-full h-auto max-h-80 sm:max-h-[28rem] lg:max-h-[30rem] object-contain rounded-xl transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                          onClick={() => setIsImageExpanded(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
                        
                        {/* Hover tooltip */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                            Click to expand
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 sm:h-64 bg-gradient-to-br from-muted to-muted/50 rounded-xl border-2 border-dashed border-border">
                    <div className="p-3 sm:p-4 rounded-full bg-muted-foreground/10 mb-3 sm:mb-4">
                      <Calendar size={24} className="sm:size-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium text-sm sm:text-base">No images available yet</p>
                    <p className="text-xs sm:text-sm text-muted-foreground/70">Images will be added soon</p>
                  </div>
                )}
              </div>

              {/* Enhanced Description */}
              {(post?.details || isEditing) && (
                <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">About This Event</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
                  </div>
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    {isEditing ? (
                      <textarea
                        value={editedPost?.details || ''}
                        onChange={(e) => handleInputChange('details', e.target.value)}
                        rows={4}
                        className="w-full text-muted-foreground leading-relaxed text-sm sm:text-base bg-transparent border border-border rounded-lg p-3 sm:p-4 focus:border-primary focus:outline-none resize-vertical"
                        placeholder="Event description..."
                      />
                    ) : (
                      <div className="text-muted-foreground leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                        {post?.details}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Enhanced Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Enhanced Event Details */}
              <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Event Details</h2>
                  <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full mx-auto"></div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-muted-foreground font-medium text-sm sm:text-base">Club:</span>
                    <span className="text-foreground font-semibold text-sm sm:text-base truncate ml-2">{clubName}</span>
                  </div>
                  
                  {(post?.category || isEditing) && (
                    <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground font-medium text-sm sm:text-base">Category:</span>
                      {isEditing ? (
                        <select
                          value={editedPost?.category || ''}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="text-foreground font-semibold bg-transparent border border-border rounded px-2 py-1 text-xs sm:text-sm"
                        >
                          <option value="">Select category</option>
                          <option value="Event">Event</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Social">Social</option>
                          <option value="Competition">Competition</option>
                          <option value="Fundraiser">Fundraiser</option>
                          <option value="Volunteer Opportunity">Volunteer Opportunity</option>
                          <option value="Hiring Opportunity">Hiring Opportunity</option>
                          <option value="General Announcement">General Announcement</option>
                          <option value="Survey">Survey</option>
                        </select>
                      ) : (
                        <span className="text-foreground font-semibold text-sm sm:text-base truncate ml-2">{post?.category}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-muted-foreground font-medium text-sm sm:text-base">Posted:</span>
                    <span className="text-foreground font-semibold text-sm sm:text-base">
                      {post.date_posted ? new Date(post.date_posted).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Club Card */}
              <div 
                className="group bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl cursor-pointer transition-all duration-300 hover:border-primary/30 hover:-translate-y-1"
                onClick={() => router.push(`/clubPage/${clubId}`)}
              >
                <div className="text-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Hosted By</h2>
                  <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-accent to-accent/50 rounded-full mx-auto"></div>
                </div>
                <div className="text-center">
                  <div className="relative w-16 h-12 sm:w-20 sm:h-16 mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-all duration-300">
                    {clubImage ? (
                      <img
                        src={clubImage}
                        alt={clubName}
                        className="w-full h-full rounded-lg object-cover border-2 border-primary/20 group-hover:border-primary/40 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 border-2 border-primary/20 group-hover:border-primary/40 flex items-center justify-center transition-all duration-300">
                        <span className="text-primary font-bold text-base sm:text-lg">{clubName.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-base sm:text-lg font-bold text-foreground mb-2 truncate">{clubName}</p>
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    <span>View club page</span>
                    <ExternalLink size={14} className="sm:size-4 group-hover:rotate-12 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Enhanced Tags */}
              {((post?.hashtags && post.hashtags.length > 0) || isEditing) && (
                <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Event Tags</h2>
                      {isEditing && (
                        <button
                          onClick={addHashtag}
                          className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90"
                        >
                          <Plus className="h-3 w-3" />
                          <span className="hidden sm:inline">Add Tag</span>
                        </button>
                      )}
                    </div>
                    <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-secondary to-secondary/50 rounded-full mx-auto"></div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                    {isEditing ? (
                      <div className="w-full space-y-2">
                        {editedPost?.hashtags?.map((tag, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={tag}
                              onChange={(e) => updateHashtag(index, e.target.value)}
                              placeholder="Enter hashtag"
                              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground text-sm"
                            />
                            <button
                              onClick={() => removeHashtag(index)}
                              className="px-2 py-1.5 sm:py-2 text-destructive hover:bg-destructive/10 rounded"
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        )) || []}
                      </div>
                    ) : (
                      post?.hashtags?.map((tag, index) => (
                        <span
                          key={index}
                          className="group px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-primary border border-primary/20 hover:border-primary/30 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 cursor-default"
                        >
                          #{tag}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Expansion Modal */}
      {isImageExpanded && post.image && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageExpanded(false)}
        >
          <div className="relative max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center">
            <img 
              src={post.image} 
              alt={post.title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setIsImageExpanded(false)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
