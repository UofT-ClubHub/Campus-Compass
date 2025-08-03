"use client";

import { Search, X, Hash, FileText, Filter, CalendarDays } from "lucide-react"
import { useState, useEffect, useRef, Suspense } from "react";
import { Post, User } from "@/model/types";
import { PostCard } from "@/components/post-card";
import { auth } from "@/model/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Separate component that uses useSearchParams
function PostFilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [nameFilter, setNameFilter] = useState(searchParams.get('name') || "");
  const [campusFilter, setCampusFilter] = useState(searchParams.get('campus') || "");
  const [descriptionFilter, setDescriptionFilter] = useState(searchParams.get('description') || "");
  const [hashtagsFilter, setHashtagsFilter] = useState(searchParams.get('hashtags') || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || "");

  const [initialLoading, setInitialLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 9;
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);
  const [sort_by, setSortBy] = useState(searchParams.get('sort_by') || "");
  const [sort_order, setSortOrder] = useState(searchParams.get('sort_order') || "desc");
  const [showSortOrder, setShowSortOrder] = useState(false);

  const hasFilters = nameFilter || campusFilter || descriptionFilter || hashtagsFilter || categoryFilter || sort_by;

  // Clear all filters function
  const clearAllFilters = () => {
    setNameFilter("");
    setCampusFilter("");
    setDescriptionFilter("");
    setHashtagsFilter("");
    setCategoryFilter("");
    setSortBy("");
    setSortOrder("");
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
  
  if (nameFilter) params.set('name', nameFilter);
  if (campusFilter) params.set('campus', campusFilter);   
  if (descriptionFilter) params.set('description', descriptionFilter); 
  if (hashtagsFilter) params.set('hashtags', hashtagsFilter); 
  if (categoryFilter) params.set('category', categoryFilter); 
  if (sort_by) params.set('sort_by', sort_by);
  if (sort_order) params.set('sort_order', sort_order);
  
  // Update URL without refreshing page
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({ ...window.history.state, as: url, url }, '', url);
}, [nameFilter, campusFilter, descriptionFilter, hashtagsFilter, 
    categoryFilter, sort_by, sort_order]);

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

      nameFilter ? params.append("title", nameFilter) : null;
      campusFilter ? params.append("campus", campusFilter) : null;
      categoryFilter ? params.append("category", categoryFilter) : null;
      descriptionFilter ? params.append("details", descriptionFilter) : null;
      params.append("sort_by", sort_by);
      params.append("sort_order", sort_order);
      params.append("offset", currentOffset.toString());
      params.append("limit", limit.toString());

      if (hashtagsFilter) {
        const hashtags = hashtagsFilter.split(",").map((tag) => tag.trim());
        // Ensure hashtags are lowercase
        params.append(
          "hashtags",
          JSON.stringify(hashtags.map((tag) => tag.toLowerCase()))
        );
      }

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
    nameFilter,
    campusFilter,
    descriptionFilter,
    hashtagsFilter,
    categoryFilter,
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
    <div className="min-h-screen bg-background">

      {/* Header and Search Section */}
      <div className="max-w-4xl mx-auto pt-8 pb-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-primary text-center ">Post Search</h1>
          </div>
          <p className="text-muted-foreground">Find events, hiring opportunities, announcements, and surveys from student organizations</p>
        </div>

        <div className="bg-card rounded-lg shadow-md border border-border p-4 mb-4 form-glow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-lg font-medium text-primary">Post Name</label>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                 <input
                  type="text"
                  placeholder="Search by post title..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-200 outline-none text-sm text-card-foreground placeholder-muted-foreground bg-input"
                 />
               </div>
            </div>

            {/* Description Filter */}
            <div className="space-y-2">
              <label className="text-lg font-medium text-primary">Description</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Description"
                  value={descriptionFilter}
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-200 outline-none text-sm text-card-foreground placeholder-muted-foreground bg-input"
                />
               </div>
             </div>
          
            {/* Hashtags Filter */}
            <div className="space-y-2">
              <label className="text-lg font-medium text-primary">Hashtags</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                type="text"
                placeholder="Hashtags (comma separated)"
                value={hashtagsFilter}
                onChange={(e) => setHashtagsFilter(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-200 outline-none text-sm text-card-foreground placeholder-muted-foreground bg-input"
              />
              </div>
            </div>
          </div>

          <div className="pt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Campus Filter */}
            <div className="space-y-2">
              <label className="text-lg font-medium text-primary">Campus</label>
              <div className="relative">
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-200 outline-none text-sm  text-card-foreground placeholder-muted-foreground bg-input"
                >
                  <option value="">Select Campus</option>
                  <option value="UTSC">UTSC</option>
                  <option value="UTSG">UTSG</option>
                  <option value="UTM">UTM</option>
                </select>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-lg font-medium text-primary">Post Type</label>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-200 outline-none text-sm text-card-foreground bg-input w-full"
                >
                  <option value="">Select Type of Post</option>
                  <option value="Event">Event</option>
                  <option value="Hiring Opportunity">Hiring Opportunity</option>
                  <option value="General Announcement">General Announcement</option>
                  <option value="Survey">Survey</option>
                </select>
              </div>
            </div>

            {/* Sort By Filter */}
             <div className="space-y-2">
              <label className="text-lg font-medium text-primary">Sort By</label>
              <div className="relative">
                <div className="flex flex-row gap-2 w-full items-end">
                <div className="flex-1">
                  <label htmlFor="sort-by" className="block text-xs font-medium text-muted-foreground mb-1 sr-only">Sort By</label>
                  <select
                    id="sort-by"
                    data-testid="sort-by"
                    value={sort_by}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2 sm:px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-200 outline-none text-xs sm:text-sm text-card-foreground bg-input w-full"
                  >
                    <option value="">Sort By</option>
                    <option value="date_posted">Date Posted</option>
                    <option value="likes">Likes</option>
                    <option value="date_occuring">Date Occuring</option>
                  </select>
                </div>
                {showSortOrder && (
                  <div className="flex-1">
                    <label htmlFor="sort-order" className="block text-xs font-medium text-muted-foreground mb-1 sr-only">Sort Order</label>
                    <select
                      id="sort-order"
                      data-testid="sort-order"
                      value={sort_order}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="px-2 sm:px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-200 outline-none text-xs sm:text-sm text-card-foreground bg-input w-full"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                )}
              </div>
              </div>
             </div>
          </div>

          { /* Clear All Filters Button */}
          {hasFilters && (
            <div className="flex justify-center mt-4">
              <button onClick={clearAllFilters} className="px-6 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md hover:bg-destructive/20 hover:border-destructive/30 transition-all duration-200 text-sm font-medium">
                Clear All Filters
              </button>
            </div>  
          )}

        </div>
      </div>

      {/* Results Section */}
      <div className="w-full bg-background pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-card rounded-lg shadow-md border border-border p-6 form-glow">
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto pt-8 pb-8">
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
