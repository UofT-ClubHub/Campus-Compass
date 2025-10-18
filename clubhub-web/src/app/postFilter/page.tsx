"use client";

import { Search, X, Hash, FileText, Filter, CalendarDays } from "lucide-react"
import { useState, useEffect, useRef, Suspense } from "react";
import { Post, User } from "@/model/types";
import { PostCard } from "@/components/post-card";
import { auth } from "@/model/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from '@/contexts/ThemeContext';

// Separate component that uses useSearchParams
function PostFilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [query, setQuery] = useState(searchParams.get('q') || "");
  const [nameFilter, setNameFilter] = useState(searchParams.get('name') || "");
  const [campusFilter, setCampusFilter] = useState(searchParams.get('campus') || "");
  const [descriptionFilter, setDescriptionFilter] = useState(searchParams.get('description') || "");
  const [hashtagsFilter, setHashtagsFilter] = useState(searchParams.get('hashtags') || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || "");
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') || "");

  const [initialLoading, setInitialLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 9;
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);
  const [sort_by, setSortBy] = useState(searchParams.get('sort_by') || "");
  const [sort_order, setSortOrder] = useState(searchParams.get('sort_order') || "desc");
  const [showSortOrder, setShowSortOrder] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFilters = campusFilter || categoryFilter || departmentFilter;
  const campusOptions = ["UTSC", "UTSG", "UTM"];
  const departmentOptions = ["Computer, Math, & Stats", "Engineering", "Business/Management", "Health & Medicine", "Law", "Cultural", "Sports", "Design Team", "Other"];
  const categoryOptions = ["Event", "Hiring Opportunity", "General Announcement", "Survey"];

  // Clear all filters function
  const clearAllFilters = () => {
    setCampusFilter("");
    setCategoryFilter("");
    setDepartmentFilter("");
  };

  useEffect(() => {
    setShowSortOrder(sort_by !== "");
    // If sort_by is selected and sort_order is empty, default to 'desc'
    if (sort_by && !sort_order) {
      setSortOrder('desc');
    }
  }, [sort_by]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
  const params = new URLSearchParams();
  
  if (query) params.set('q', query);
  if (campusFilter) params.set('campus', campusFilter);   
  if (categoryFilter) params.set('category', categoryFilter); 
  if (sort_by) params.set('sort_by', sort_by);
  if (sort_order) params.set('sort_order', sort_order);
  if (departmentFilter) params.set('department', departmentFilter);
  // Update URL without refreshing page
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({ ...window.history.state, as: url, url }, '', url);
}, [query, campusFilter, categoryFilter, sort_by, sort_order, departmentFilter]);

  const filterPosts = async (isNewSearch = false) => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log("Filter posts already in progress, skipping...");
      return;
    }
    
    loadingRef.current = true;

    const currentOffset = isNewSearch ? 0 : offset;

    if (isNewSearch) {
      setPosts([]);
      setInitialLoading(true);
    }

    try {
      const params = new URLSearchParams();

      if (query) {
        params.append('search', query) // Use the new combined search parameter
      }
      campusFilter ? params.append("campus", campusFilter) : null;
      categoryFilter ? params.append("category", categoryFilter) : null;
      departmentFilter ? params.append("department", departmentFilter) : null;
      params.append("sort_by", sort_by);
      params.append("sort_order", sort_order);
      params.append("offset", currentOffset.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/posts?${params.toString()}`, {
        method: "GET",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();

      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format");
      }

      setOffset(currentOffset + data.length);
      setHasMore(data.length === limit);

      if (isNewSearch) {
        setPosts(data as Post[]);
      } else {
        setPosts((prevPosts) => {
          const newPosts = data.filter(
            (newPost: Post) =>
              !prevPosts.some((existingPost) => existingPost.id === newPost.id)
          );
          return [...prevPosts, ...newPosts];
        });
      }

      console.log("Filtered posts:", data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      // Reset loading states on error
      setHasMore(false);
    } finally {
      if (isNewSearch) {
        setInitialLoading(false);
      }
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser) {
        const token = await authUser.getIdToken();
        const response = await fetch(`/api/users?id=${authUser.uid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
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
      // Cancel any ongoing requests
      loadingRef.current = false;
      setHasMore(true); // Reset hasMore to true for new search
      setOffset(0); // Reset offset for new search
      setInitialLoading(true); // Show loading state for new search
      filterPosts(true);
    }, 300); // Reduced from 500ms to 300ms for faster response

    return () => {
      clearTimeout(delay);
      // Cancel any ongoing requests when component unmounts or dependencies change
      loadingRef.current = false;
    };
  }, [
    query,
    campusFilter,
    categoryFilter,
    departmentFilter,
    sort_by,
    sort_order,
  ]);

  // Infinite Scrolling Logic with debouncing
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;
    let lastScrollTime = 0;

    const handleScroll = () => {
      const now = Date.now();
      
      // Prevent rapid successive calls
      if (now - lastScrollTime < 100) {
        return;
      }
      lastScrollTime = now;

      if (
        window.innerHeight + document.documentElement.scrollTop <
          document.documentElement.offsetHeight - 300 || // Increased threshold
        !hasMore ||
        loadingRef.current
      ) {
        return;
      }

      // Clear any existing timeout
      clearTimeout(scrollTimeout);
      
      // Set a longer debounce to prevent rapid calls
      scrollTimeout = setTimeout(() => {
        if (!loadingRef.current && hasMore) {
          filterPosts();
        }
      }, 300); // Increased debounce time
    };

    // Add scroll event listener with throttling
    window.addEventListener("scroll", handleScroll, { passive: true });
    console.log("Scroll event listener added");

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [hasMore, offset]);

  // Handle like updates to keep posts in sync
  const handleLikeUpdate = (
    postId: string,
    newLikes: number,
    isLiked: boolean
  ) => {
    // Update posts
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId ? { ...post, likes: newLikes } : post
      )
    );

    // Update currentUser liked_posts
    setCurrentUser((prevUser) => {
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
        updatedLikedPosts = currentLikedPosts.filter((id) => id !== postId);
      }

      return {
        ...prevUser,
        liked_posts: updatedLikedPosts,
      };
    });
  };

  const handleHashtagClick = (hashtag: string) => {
    setQuery(hashtag); // Update query state
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle post deletion
  const handleDeletePost = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  // Refresh posts from API
  const refreshPosts = async () => {
    setOffset(0);
    setHasMore(true);
    await filterPosts(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-theme-gradient" data-theme={theme}>
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-animated-elements">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={`element-${i + 1}`}></div>
        ))}
      </div>

      {/* Header and Search Section */}
      <div className="relative z-10 max-w-4xl mx-auto pt-8 pb-8 px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-primary text-center ">Post Search</h1>
          </div>
          <p className="text-muted-foreground">Find events, hiring opportunities, announcements, and surveys from student organizations</p>
          <div className="space-y-2 mt-6">
               <label className="text-lg font-medium text-primary"></label>
              {/* Search and Filter Container */}
              <div className="flex gap-4 items-center">
                {/* Main search container */}
                <div className={`flex-1 relative bg-card border border-white/20 rounded-2xl shadow-lg transition-all duration-300 ${
                  isFocused 
                    ? 'scale-[1.02] shadow-2xl [box-shadow:0_0_30px_rgba(var(--primary-rgb),0.3)] border-primary/30' 
                    : 'hover:shadow-xl'
                }`}>
                  <div className="relative flex items-center">
                    {/* Search icon with animation */}
                    <div className="absolute left-5 flex items-center">
                      <Search
                        className={`w-5 h-5 transition-all duration-300 ${
                          isFocused ? "text-primary scale-110 drop-shadow-sm" : "text-muted-foreground group-hover:text-primary/70"
                        }`}
                      />
                    </div>

                    {/* Search input */}
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search posts by title, description, or hashtags..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className="w-full pl-14 pr-5 py-3 sm:py-4 bg-transparent border-0 rounded-2xl 
                               focus:outline-none focus:ring-0
                               text-card-foreground placeholder-muted-foreground/70
                               text-lg font-medium"
                    />
                  </div>
                </div>

                {/* Filter Toggle Button */}
                <button
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 sm:py-4 sm:min-w-[120px] bg-primary/10 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-lg hover:shadow-xl hover:bg-primary/20 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                >
                  <Filter className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium text-sm hidden sm:inline">
                    {isFiltersExpanded ? 'Hide' : 'Filters'}
                  </span>
                </button>
              </div>
             </div>
        </div>

        {/* Sort Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <button
            onClick={() => setSortBy("date_posted")}
            className={`cursor-pointer px-3 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              sort_by === "date_posted" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl border-2 border-blue-400" 
                : "bg-card/40 backdrop-blur-xl border-2 border-white/30 text-primary hover:bg-primary/15 hover:border-primary/50 hover:shadow-lg"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
              Date Posted
            </div>
          </button>
          <button
            onClick={() => setSortBy("likes")}
            className={`cursor-pointer px-3 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              sort_by === "likes" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl border-2 border-blue-400" 
                : "bg-card/40 backdrop-blur-xl border-2 border-white/30 text-primary hover:bg-primary/15 hover:border-primary/50 hover:shadow-lg"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
              </svg>
              Most Liked
            </div>
          </button>
          <button
            onClick={() => setSortBy("date_occurring")}
            className={`cursor-pointer px-3 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              sort_by === "date_occurring" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl border-2 border-blue-400" 
                : "bg-card/40 backdrop-blur-xl border-2 border-white/30 text-primary hover:bg-primary/15 hover:border-primary/50 hover:shadow-lg"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
              </svg>
              Date Occurring
            </div>
          </button>
          <button
            onClick={() => setSortBy("")}
            className={`cursor-pointer px-3 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              sort_by === "" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl border-2 border-blue-400" 
                : "bg-card/40 backdrop-blur-xl border-2 border-white/30 text-primary hover:bg-primary/15 hover:border-primary/50 hover:shadow-lg"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
              </svg>
              Default
            </div>
          </button>
        </div>

        {/* Collapsible Filters */}
        {isFiltersExpanded && (
          <div className="bg-card/30 backdrop-blur-xl rounded-lg shadow-lg border border-white/20 p-4 mb-4 form-glow animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 gap-4">
              {/* Campus Filter */}
              <div className="space-y-2">
                <label className="text-lg font-medium text-primary text-left block ml-2">Campus:</label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {campusOptions.map((campus) => (
                      <button 
                        key={campus}
                        className={`cursor-pointer flex items-center justify-center px-3 py-2 rounded-full font-medium transition-all duration-200 ${
                        campusFilter === campus
                          ? "bg-primary text-primary-foreground shadow-lg" 
                          : "bg-card/30 backdrop-blur-xl border border-white/20 text-primary hover:bg-primary/10 hover:border-primary/30"
                        }`}
                        onClick={() => setCampusFilter(campus)}
                      >
                        <span className="text-sm">{campus}</span>
                      </button>
                    ))}
                 </div>
                </div>
              </div>

              {/* Department Filter */}
              <div className="space-y-2">
                <label className="text-lg font-medium text-primary text-left block ml-2">Department:</label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 mb-2">
                  {departmentOptions.map((dep) => (
                      <button 
                        key={dep}
                        className={`cursor-pointer flex items-center justify-center px-3 py-2 rounded-full font-medium transition-all duration-200 ${
                        departmentFilter === dep
                          ? "bg-primary text-primary-foreground shadow-lg" 
                          : "bg-card/30 backdrop-blur-xl border border-white/20 text-primary hover:bg-primary/10 hover:border-primary/30"
                        }`}
                        onClick={() => setDepartmentFilter(dep)}
                      >
                        <span className="text-sm">{dep}</span>
                      </button>
                    ))}
                 </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-lg font-medium text-primary text-left block ml-2">Post Type:</label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {categoryOptions.map((category) => (
                      <button 
                        key={category}
                        className={`cursor-pointer flex items-center justify-center px-3 py-2 rounded-full font-medium transition-all duration-200 ${
                        categoryFilter === category
                          ? "bg-primary text-primary-foreground shadow-lg" 
                          : "bg-card/30 backdrop-blur-xl border border-white/20 text-primary hover:bg-primary/10 hover:border-primary/30"
                        }`}
                        onClick={() => setCategoryFilter(category)}
                      >
                        <span className="text-sm">{category}</span>
                      </button>
                    ))}
                 </div>
                </div>
              </div>
            </div>

            { /* Clear All Filters Button */}
            {hasFilters && (
              <div className="flex justify-center mt-4">
                <button onClick={clearAllFilters} className="cursor-pointer px-6 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-full hover:bg-destructive/20 hover:border-destructive/30 transition-all duration-200 text-sm font-medium">
                  Clear All Filters
                </button>
              </div>  
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="relative z-10 w-full pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-card/30 backdrop-blur-xl rounded-lg shadow-lg border border-white/20 p-6 form-glow">
            <h2 className="text-2xl font-bold text-primary mb-6 text-center">
              Post Results
            </h2>

            {initialLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg
                    className="w-12 h-12 text-muted-foreground mx-auto mb-3"
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
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  No posts found
                </h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your filters to find more posts
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post: Post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onLikeUpdate={handleLikeUpdate}
                      onDelete={handleDeletePost}
                      onRefresh={refreshPosts}
                      onHashtagClick={handleHashtagClick}
                    />
                  ))}
                </div>
                
                {/* End of results indicator */}
                {!hasMore && posts.length > 0 && (
                  <div className="mt-8 py-4 text-center">
                    <p className="text-muted-foreground">No more posts to load</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div id="scroll-anchor" style={{ height: "1px" }}></div>
    </div>
  );
}

// Loading fallback component
function PostFilterLoading() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-theme-gradient">
      {/* Background elements for loading state */}
      <div className="absolute inset-0 bg-animated-elements">
        <div className="element-1"></div>
        <div className="element-2"></div>
        <div className="element-3"></div>
        <div className="element-4"></div>
        <div className="element-5"></div>
        <div className="element-6"></div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto pt-8 pb-8 px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-primary text-center">Post Search</h1>
          </div>
          <p className="text-muted-foreground">Find events, hiring opportunities, announcements, and surveys from student organizations</p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    </div>
  );
}

// Main exported component with Suspense boundary
export default function PostFilterPage() {
  return (
    <Suspense fallback={<PostFilterLoading />}>
      <PostFilterContent />
    </Suspense>
  );
}
