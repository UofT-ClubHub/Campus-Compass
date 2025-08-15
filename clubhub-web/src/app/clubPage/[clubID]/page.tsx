"use client"

import { useState, useEffect } from "react"
import db from "@/model/firebase"
import { collection, query, where, getDocs, getFirestore } from "firebase/firestore"
import { auth } from "@/model/firebase"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import type { Post, User } from "@/model/types"
import { PostCard } from "@/components/post-card"
import { Users, UserCheck, Instagram, MapPin, Heart, HeartOff, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageProps {
  params: Promise<{
    clubID: string
  }>
}

async function getClubPosts(clubID: string) {
  try {
    const firestore = getFirestore(db)
    //Get name of the club
    const clubRef = collection(firestore, "Clubs")
    const clubQuery = query(clubRef, where("__name__", "==", clubID))
    const clubSnapshot = await getDocs(clubQuery)

    let clubData = null
    if (!clubSnapshot.empty) {
      clubData = clubSnapshot.docs[0].data()
    }

    // Get posts for this club
    const postsRef = collection(firestore, "Posts")
    const postsQuery = query(postsRef, where("club", "==", clubID))
    const postsSnapshot = await getDocs(postsQuery)

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[]

    return { clubData, posts }
  } catch (error) {
    console.error("Error fetching club posts:", error)
    return { clubData: null, posts: [] }
  }
}

export default function ClubPage({ params }: PageProps) {
  const [clubID, setClubID] = useState<string>("")
  const [clubData, setClubData] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [executives, setExecutives] = useState<User[]>([])
  const [executivesLoading, setExecutivesLoading] = useState(false)
  const [ig, setIg] = useState("");
  const [links, setLinks] = useState<{ [key: string]: string }>({})
  const router = useRouter()

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      const resolvedParams = await params
      const id = resolvedParams.clubID
      setClubID(id)

      const { clubData: fetchedClubData, posts: fetchedPosts } = await getClubPosts(id)
      setClubData(fetchedClubData)
      setPosts(fetchedPosts)
      setFollowerCount(fetchedClubData?.followers || 0)
      setLoading(false)
      setIg((fetchedClubData?.instagram || "").replace(/^@/, ""));
      setLinks(fetchedClubData?.links || {});
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

  // Fetch executives data
  useEffect(() => {
    const fetchExecutives = async () => {
      if (clubData?.executives && Array.isArray(clubData.executives) && clubData.executives.length > 0) {
        setExecutivesLoading(true)
        try {
          const user = auth.currentUser
          const executivePromises = clubData.executives.map(async (execId: string) => {
            try {
              const headers: Record<string, string> = {}
              if (user) {
                const token = await user.getIdToken()
                headers.Authorization = `Bearer ${token}`
              }
              
              const res = await fetch(`/api/users?id=${execId}`, {
                headers,
              })
              return res.ok ? await res.json() : null
            } catch {
              return null
            }
          })

          const executiveData = await Promise.all(executivePromises)
          setExecutives(executiveData.filter((e): e is User => e !== null))
        } catch (error) {
          console.error("Failed to fetch executives:", error)
        } finally {
          setExecutivesLoading(false)
        }
      }
    }

    fetchExecutives()
  }, [clubData])

  // Check if user is following this club
  useEffect(() => {
    if (currentUser?.followed_clubs && clubID) {
      setIsFollowing(currentUser.followed_clubs.includes(clubID))
    }
  }, [currentUser, clubID])

  const handleFollowClub = async () => {
    if (isFollowLoading) return
    setIsFollowLoading(true)

    try {
      const user = auth.currentUser

      if (!user) {
        alert("Please log in to follow clubs")
        return
      }

      const idToken = await user.getIdToken()

      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ clubId: clubID }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.following)
        setFollowerCount(data.followersCount)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error)
      }
    } catch (error) {
      alert("Error occurred while following/unfollowing club")
    } finally {
      setIsFollowLoading(false)
    }
  }

     const handleManageClub = () => {
     router.push("/exec")
   }

   // Handle like updates to keep posts in sync
   const handleLikeUpdate = (postId: string, newLikes: number, isLiked: boolean) => {
     // Update posts
     setPosts(prevPosts => 
       prevPosts.map(post => 
         post.id === postId 
           ? { ...post, likes: newLikes }
           : post
       )
     );
     
     // Update currentUser liked_posts
     setCurrentUser(prevUser => {
       if (!prevUser) return prevUser;
       
       const currentLikedPosts = prevUser.liked_posts || [];
       let updatedLikedPosts;
       
       if (isLiked) {
         // Add postId if not already present
         updatedLikedPosts = currentLikedPosts.includes(postId) 
           ? currentLikedPosts 
           : [...currentLikedPosts, postId];
       } else {
         // Remove postId
         updatedLikedPosts = currentLikedPosts.filter(id => id !== postId);
       }
       
       return {
         ...prevUser,
         liked_posts: updatedLikedPosts
       };
     });
   };

     // Check if current user is a club executive
  const isClubExecutive = currentUser?.managed_clubs?.includes(clubID) || false

  // Handle post edit
  const handlePostEdit = (updatedPost: Post) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  // Handle post deletion
  const handlePostDelete = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  // Handle post refresh
  const handlePostRefresh = async () => {
    const { posts: refreshedPosts } = await getClubPosts(clubID);
    setPosts(refreshedPosts);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading club information...</p>
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
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
         <header className="relative text-white rounded-2xl p-12 mb-10 shadow-xl overflow-hidden bg-card/30 backdrop-blur-xl border border-white/20 form-glow">
           <div
             className="absolute inset-0 bg-cover bg-center filter blur-md"
             style={{ backgroundImage: `url(${clubData?.image || "/placeholder.svg"})` }}
           ></div>
           <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/50"></div>
           

           <div className="relative z-10 max-w-4xl mx-auto text-center">
            {/* Logo and Title Section */}
            <div className="mb-10 flex flex-col items-center">
              <img
                src={clubData?.image || "/placeholder.svg"}
                alt={`${clubData?.name} logo`}
                className="w-28 h-28 rounded-full mb-6 border-4 border-white/50 shadow-lg backdrop-blur-sm"
              />
              <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">{clubData?.name}</h1>
              <p className="text-white/90 text-xl font-medium leading-relaxed max-w-2xl">{clubData?.description}</p>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-white/30">
               <div className="flex items-center gap-3 text-white">
                 <Users className="w-5 h-5 text-white/80" />
                 <span className="font-semibold text-lg">{followerCount}</span>
                 <span className="text-white/80 text-sm font-medium">Followers</span>
               </div>
               <div className="flex items-center gap-3 text-white">
                 <UserCheck className="w-5 h-5 text-success" />
                 <span className="font-semibold text-lg">{executives.length}</span>
                 <span className="text-white/80 text-sm font-medium">Executives</span>
               </div>
               {ig && (<a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white hover:underline hover:text-accent transition text-white">
                 <Instagram className="w-5 h-5 text-accent" />
                 <span className="font-semibold text-lg">@{ig}</span>
               </a>
               )}
               <div className="flex items-center gap-3 text-white">
                 <MapPin className="w-5 h-5 text-warning" />
                 <span className="font-semibold text-lg">{clubData?.campus}</span>
               </div>
             </div>

              {clubData?.links && Object.keys(clubData.links).length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground mb-0 mt-4">External Links:</p>
                                  <div className="flex flex-wrap justify-center gap-8 pt-2">
                    {Object.entries(clubData.links as Record<string, string>)
                      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                      .slice(0, 3)
                      .map(([key, link], index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-white hover:underline hover:text-accent transition text-white"
                      >
                        <ExternalLink className="w-5 h-5 text-accent" />
                        <span className="font-semibold text-lg">{key}</span>
                      </a>
                    ))}
                  {Object.keys(clubData.links).length > 3 && (
                    <div className="flex items-center gap-3 text-white">
                      <span className="font-semibold text-lg">+{Object.keys(clubData.links).length - 3} more</span>
                    </div>
                  )}
                </div>
                </div>
              )}

              {/* Compact Executives Display */}
              {!executivesLoading && executives.length > 0 && (
                <div className="pt-6">
                  <div className="flex flex-wrap justify-center gap-3">
                    {executives.map((executive) => (
                      <div
                        key={executive.id}
                        className="bg-primary/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-primary/30"
                      >
                        <p className="text-white text-sm font-medium">
                          {executive.name || "Executive"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

               {/* Action Buttons */}
               {authUser && (
                 <div className="mt-6 flex justify-center gap-4">
                   {isClubExecutive && (
                     <button
                       onClick={handleManageClub}
                       className="cursor-pointer px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all duration-200 border border-primary"
                     >
                       Manage Club
                     </button>
                   )}
                     <button
                     onClick={handleFollowClub}
                     disabled={isFollowLoading}
                     className={`cursor-pointer px-6 py-2 rounded-lg font-medium transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed ${
                       isFollowing 
                       ? "bg-pink-500 hover:bg-pink-600 text-white border-pink-500" 
                       : "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary"
                     }`}
                     >
                     {isFollowLoading ? (
                       <div className="flex items-center justify-center">
                       <div className="w-4 h-4 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                       Loading...
                       </div>
                     ) : isFollowing ? (
                       <div className="flex items-center gap-2">
                       <HeartOff className="w-4 h-4" />
                       Unfollow
                       </div>
                     ) : (
                       <div className="flex items-center gap-2">
                       <Heart className="w-4 h-4" />
                       Follow
                       </div>
                     )}
                     </button>
                 </div>
               )}
          </div>
        </header>



        

        {/* Posts Section */}
        <div className="mb-8">
          <div className="bg-card/30 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8 form-glow">

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-6">
                  <svg
                    className="w-16 h-16 text-muted-foreground mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">No posts found</h3>
                <p className="text-muted-foreground">This club hasn't posted anything yet</p>
              </div>
            ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {posts.map((post) => (
                   <PostCard 
                     key={post.id} 
                     post={post} 
                     currentUser={currentUser}
                     onLikeUpdate={handleLikeUpdate}
                     onDelete={handlePostDelete}
                     onRefresh={handlePostRefresh}
                   />
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
      </main>
    </div>
  )
}