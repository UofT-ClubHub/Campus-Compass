"use client";

import { useState, useEffect } from "react";
import { Post, User } from "@/model/types";
import { PostCard } from "../../../components/post-card";
import { useAuth } from "@/hooks/useAuth";

export default function PostFilterPage() {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [campusFilter, setCampusFilter] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [hashtagsFilter, setHashtagsFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 2;
  const [hasMore, setHasMore] = useState(true);

  const filterPosts = async (isNewSearch = false) => {
    if (loadingMore) return;

    const currentOffset = isNewSearch ? 0 : offset;

    if (isNewSearch) {
      setPosts([]);
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try{

      const params = new URLSearchParams();
      
      nameFilter ? params.append('title', nameFilter) : null;
      campusFilter ? params.append('campus', campusFilter) : null;
      clubFilter ? params.append('club', clubFilter) : null;
      categoryFilter ? params.append('category', categoryFilter) : null;
      descriptionFilter ? params.append('details', descriptionFilter) : null;
      params.append('sort_by', "likes");
      params.append('sort_order', "desc");
      params.append("offset", currentOffset.toString())
      params.append("limit", limit.toString());
      
      if (hashtagsFilter) {
        const hashtags = hashtagsFilter.split(',').map(tag => tag.trim());
        // Ensure hashtags are lowercase 
        params.append('hashtags', JSON.stringify(hashtags.map(tag => tag.toLowerCase())));
      }
      
      
      const response = await fetch(`/api/posts?${params.toString()}`, {
        method: "GET",
      })
      if (!response.ok) {
        throw new Error("Failed to fetch clubs") // Throws error to be caught
      }
      
      const data = await response.json();

      setOffset(currentOffset + data.length);
      setHasMore(data.length === limit);
      
      if (isNewSearch){
        setPosts(data as Post[])
      } else{
        setPosts(prevPosts => {
          return [...prevPosts, ...data as Post[]];
        })
      }

      
      console.log("Filtered posts:", data);
    } catch (error) {
      console.log("Error fetching clubs:", error)
    } finally {
      if (isNewSearch) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
      console.log("yurr", offset);
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser) {
        const response = await fetch(`/api/users?id=${authUser.uid}`);
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      }
    };
    fetchUserData();
  }, [authUser]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setHasMore(true); // Reset hasMore to true for new search
      setOffset(0); // Reset offset for new search
      filterPosts(true);
    }, 500); // waits 500ms after user stops typing
  
    return () => clearTimeout(delay); // cancel previous timeout if input changes
  }, [nameFilter, campusFilter, descriptionFilter, clubFilter, hashtagsFilter, categoryFilter]);

  // Infinite Scrolling Logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) {
        return;
      }
      setLoadingMore(true);
      setTimeout(() => {
        filterPosts();
      }, 500);
    };
  
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    console.log("Scroll event listener added");
  
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, offset, loadingMore]);
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header and Search Section */}
      <div className="w-full bg-gray-50 pt-6 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-blue-600 text-center mb-6">Post Search</h1>

          {/* Compact Search Filters */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Post Name Filter */}
              <input
                type="text"
                placeholder="Post Name"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none text-sm text-gray-700 placeholder-gray-400"
              />

              {/* Description Filter */}
              <input
                type="text"
                placeholder="Description"
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none text-sm text-gray-700 placeholder-gray-400"
              />

              {/* Campus Filter */}
              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none text-sm text-gray-700 bg-white"
              >
                <option value="">Select Campus</option>
                <option value="UTSC">UTSC</option>
                <option value="UTSG">UTSG</option>
                <option value="UTM">UTM</option>
              </select>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {/* Club Name Filter */}
              <input
                type="text"
                placeholder="Club Name"
                value={clubFilter}
                onChange={(e) => setClubFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none text-sm text-gray-700 placeholder-gray-400"
              />

              {/* Hashtags Filter */}
              <input
                type="text"
                placeholder="Hashtags (comma separated)"
                value={hashtagsFilter}
                onChange={(e) => setHashtagsFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none text-sm text-gray-700 placeholder-gray-400"
              />

              {/* Category Filter */}              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none text-sm text-gray-700 bg-white"
              >
                <option value="">Select Type of Post</option>
                <option value="Event">Event</option>
                <option value="Hiring Opportunity">Hiring Opportunity</option>
                <option value="General Announcement">General Announcement</option>
                <option value="Survey">Survey</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="w-full bg-gray-50 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Post Results</h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-3"
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
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters to find more posts</p>
              </div>            
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post: Post) => (
                  <PostCard key={post.id} post={post} currentUser={currentUser} onLikeUpdate={handleLikeUpdate} />
                ))}
              </div>
            )}
            {loadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div id="scroll-anchor" style={{ height: "1px" }}></div>
    </div>
  )
}