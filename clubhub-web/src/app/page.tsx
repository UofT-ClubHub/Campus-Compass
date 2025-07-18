'use client';

import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Autocomplete } from "@mantine/core"
import { PostCard } from "@/components/post-card"
import { ClubCard } from "@/components/club-card"
import { Post, User, Club } from "@/model/types";
import { useState, useEffect, useRef, use } from "react";

export default function HomePage() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followedEvents, setFollowedEvents] = useState<Post[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clubScrollRef = useRef<HTMLDivElement>(null)
  const postScrollRef = useRef<HTMLDivElement>(null)
  const followedScrollRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [duplicatedPosts, setDuplicatedPosts] = useState<Post[]>([]);
  const [duplicatedFollowed, setDuplicatedFollowed] =  useState<Post[]>([]);
  const [duplicatedClubs, setDuplicatedClubs] = useState<Club[]>([]);

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await fetch('/api/posts?sort_by=likes&sort_order=desc');
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }
      const data: Post[] = await response.json();

      // Filter posts to only include those from followed clubs
      if (currentUser && currentUser.followed_clubs) {
        const followedClubIds = currentUser.followed_clubs;
        const filteredPosts = data.filter(post => followedClubIds.includes(post.club));
        setFollowedEvents(filteredPosts);
      }
      setPosts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchClubs = async () => {
    try{
      setLoadingClubs(true);
      const response = await fetch('/api/clubs');
      if (!response.ok) {
        throw new Error(`Failed to fetch clubs: ${response.statusText}`);
      }
      const data: Club[] = await response.json();
      setClubs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setClubs([]);
    } finally {
      setLoadingClubs(false);
    }
  };

  // Fetch user data when auth user changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser) {
        try {
          const token = await authUser.getIdToken();
          const response = await fetch(`/api/users?id=${authUser.uid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const userData: User = await response.json();
            setCurrentUser(userData);
          }
        } catch (error) {
          console.log('Error fetching user data:', error);
        }
      } else {
        setCurrentUser(null);
      }
    };

    fetchUserData();
  }, [authUser]);

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchPosts(); 
    }
  }, [loading, currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle like updates
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
        updatedLikedPosts = currentLikedPosts.includes(postId) 
          ? currentLikedPosts 
          : [...currentLikedPosts, postId];
      } else {
        updatedLikedPosts = currentLikedPosts.filter(id => id !== postId);
      }
      
      return {
        ...prevUser,
        liked_posts: updatedLikedPosts
      };
    });
  };

  const handlePostDelete = () => {
    fetchPosts();
  };

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
  }, [duplicatedPosts, duplicatedFollowed, duplicatedClubs]);

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
  }, [duplicatedPosts, duplicatedFollowed, duplicatedClubs]);

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
  }, [duplicatedPosts, duplicatedFollowed, duplicatedClubs]);

    useEffect(() => {
      setDuplicatedPosts([...posts, ...posts, ...posts]);
    }, [posts]);

    useEffect(() => {
      setDuplicatedFollowed([...followedEvents, ...followedEvents, ...followedEvents]);
    }, [followedEvents]);

    useEffect(() => {
      setDuplicatedClubs([...clubs, ...clubs, ...clubs]);
    }, [clubs]);

    const handleUserScroll = () => {
      isUserScrollingRef.current = true;

      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }

      userScrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
        setIsAutoScrolling(true);
      }, 2000);
  }

  return (
    <div>
      <section className="relative h-[60vh] min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />        
        <img
          src="/utsc.jpg"
          alt="UofT Image"
          className="z-0 object-cover w-full h-full"
        />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 text-center drop-shadow-lg">Campus Compass</h1>
          
          <div className="w-full max-w-md p-2">
            <Autocomplete
              placeholder="Search for resources"
              data={[
                "Clubs",
                "Events",
                "Resources",
                "Community Service",
                "Workshops",
                "Networking"
              ]}
              styles={{
                input: {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(8px)",
                  border: "none",
                  color: "#1f2937",
                  fontSize: "18px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  width: "100%",
                  boxSizing: "border-box",
                },
                dropdown: {
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                },
              }}
            />
          </div>
        </div>
      </section>

      {/* Clubs Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-center mb-4 text-[#1E3765]">Clubs</h2>
                <p className="text-center text-[#1E3765]">Stay updated with all the latest clubs available on campus.</p>
              </div>

              {loadingClubs && <p className="text-center">Loading clubs...</p>}
              {error && <p className="text-center text-red-500">Error loading clubs: {error}</p>}
              {!loadingClubs && !error && clubs.length === 0 && <p className="text-center">No clubs found.</p>}

              {!loadingClubs && !error && posts.length > 0 && (
                <div className="relative overflow-hidden">
                  { /* Manual Scroll Container */}
                  <div
                    ref={clubScrollRef}
                    className="overflow-x-auto scroll-smooth pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 manual-scroll-container scrollbar-hide"
                    onScroll={handleUserScroll}
                    onTouchStart={handleUserScroll}
                    onTouchMove={handleUserScroll}>

                    {/* Auto Scroll */}
                    <div
                      className={`flex gap-6 ${isAutoScrolling && duplicatedClubs.length >= 3 ? "animate-smooth-scroll transition-transform duration-100 ease-out" : ""}`}
                      style={{width: "fit-content",}}
                      onMouseEnter={(e) => {
                        if (e.target === e.currentTarget) {
                          setIsAutoScrolling(false);
                        }
                      }}
                      onMouseLeave={(e) => {
                        const target = e.relatedTarget;
                        if (!(target instanceof Node) || !e.currentTarget.contains(target)) {
                          if (!isUserScrollingRef.current) {
                            setIsAutoScrolling(true);
                          }
                        }
                      }}>

                      {duplicatedClubs.map((club: Club, index: any) => (
                      <div key={`${club.id}-${index}`} className="flex-shrink-0 w-80">
                        <ClubCard key={club.id} club={club} currentUser={currentUser} className="h-full" />
                      </div>
                      ))}

                    </div>
                  </div>
                </div>
              )}
        </div>
      </section>

      {/* General Events Section */}
      {!currentUser &&  <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-center mb-4 text-[#1E3765]">Upcoming Events</h2>
                <p className="text-center text-[#1E3765]">Stay updated with the latest events happening on campus.</p>
              </div>

              {loadingPosts && <p className="text-center">Loading events...</p>}
              {error && <p className="text-center text-red-500">Error loading events: {error}</p>}
              {!loadingPosts && !error && posts.length === 0 && <p className="text-center">No events found.</p>}

              {!loadingPosts && !error && posts.length > 0 && (
                <div className="relative overflow-hidden">
                  { /* Manual Scroll Container */}
                  <div
                    ref={postScrollRef}
                    className="overflow-x-auto scroll-smooth pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 manual-scroll-container scrollbar-hide"
                    onScroll={handleUserScroll}
                    onTouchStart={handleUserScroll}
                    onTouchMove={handleUserScroll}>

                    {/* Auto Scroll */}
                    <div
                      className={`flex gap-6 transition-transform duration-100 ease-out ${isAutoScrolling ? "animate-smooth-scroll" : ""}`}
                      style={{width: "fit-content",}}
                      onMouseEnter={(e) => {
                        if (e.target === e.currentTarget) {
                          setIsAutoScrolling(false);
                        }
                      }}
                      onMouseLeave={(e) => {
                        const target = e.relatedTarget;
                        if (!(target instanceof Node) || !e.currentTarget.contains(target)) {
                          if (!isUserScrollingRef.current) {
                            setIsAutoScrolling(true);
                          }
                        }
                      }}>

                      {duplicatedPosts.map((post: Post, index: any) => (
                      <div key={`${post.id}-${index}`} className="flex-shrink-0 w-80">
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onLikeUpdate={handleLikeUpdate}
                          onRefresh={handlePostDelete}
                          className="h-full"/>
                      </div>
                      ))}

                    </div>
                  </div>
                </div>
              )}
        </div>
      </section>}

      {/* User Events Section */}
      {currentUser &&  <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-center mb-4 text-[#1E3765]">Followed Events</h2>
                <p className="text-center text-[#1E3765]">Stay updated with the latest events from the clubs you follow.</p>
              </div>

              {loadingPosts && <p className="text-center">Loading events...</p>}
              {error && <p className="text-center text-red-500">Error loading events: {error}</p>}
              {!loadingPosts && !error && posts.length === 0 && <p className="text-center">No events found.</p>}

              {!loadingPosts && !error && posts.length > 0 && (
                <div className="relative overflow-hidden">
                  { /* Manual Scroll Container */}
                  <div
                    ref={followedScrollRef}
                    className="overflow-x-auto scroll-smooth pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 manual-scroll-container scrollbar-hide"
                    onScroll={handleUserScroll}
                    onTouchStart={handleUserScroll}
                    onTouchMove={handleUserScroll}>

                    {/* Auto Scroll */}
                    <div
                      className={`flex gap-6 transition-transform duration-100 ease-out ${isAutoScrolling ? "animate-smooth-scroll" : ""}`}
                      style={{width: "fit-content",}}
                      onMouseEnter={(e) => {
                        if (e.target === e.currentTarget) {
                          setIsAutoScrolling(false);
                        }
                      }}
                      onMouseLeave={(e) => {
                        const target = e.relatedTarget;
                        if (!(target instanceof Node) || !e.currentTarget.contains(target)) {
                          if (!isUserScrollingRef.current) {
                            setIsAutoScrolling(true);
                          }
                        }
                      }}>

                      {duplicatedFollowed.map((post: Post, index: any) => (
                      <div key={`${post.id}-${index}`} className="flex-shrink-0 w-80">
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onLikeUpdate={handleLikeUpdate}
                          onRefresh={handlePostDelete}
                          className="h-full"/>
                      </div>
                      ))}

                    </div>
                  </div>
                </div>
              )}
        </div>
      </section>}

    </div>
  );
}
