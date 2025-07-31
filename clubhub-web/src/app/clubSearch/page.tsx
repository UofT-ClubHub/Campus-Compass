"use client"

import { Users, Search, Filter } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import type { Club, User } from "@/model/types"
import { ClubCard } from "@/components/club-card"
import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';


export default function clubSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clubs, setClubs] = useState<Club[]>([])

  const [nameFilter, setNameFilter] = useState(searchParams.get('name') || "")
  const [campusFilter, setCampusFilter] = useState(searchParams.get('campus') || "")
  const [descriptionFilter, setDescriptionFilter] = useState(searchParams.get('description') || "")
  const [sortOrder, setsortOrder] = useState(searchParams.get('sort_order') || "")

  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const limit = 4;
  const loadingRef = useRef(false);

  const hasFilters = nameFilter || descriptionFilter || campusFilter || sortOrder

  // Clear all filters function
  const clearAllFilters = () => {
    setNameFilter("");
    setCampusFilter("");
    setDescriptionFilter("");
    setsortOrder("");
  };
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser) {
        try {
          const token = await authUser.getIdToken();
          const response = await fetch(`/api/users?id=${authUser.uid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, [authUser]);

  // Update URL from search parameters
  useEffect(() => {
  const params = new URLSearchParams();
  
  if (nameFilter) params.set('name', nameFilter);
  if (campusFilter) params.set('campus', campusFilter);
  if (descriptionFilter) params.set('description', descriptionFilter);
  if (sortOrder) params.set('sort_order', sortOrder);
  
  // Update URL as filters are applied
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({ ...window.history.state, as: url, url }, '', url);
}, [nameFilter, campusFilter, descriptionFilter, sortOrder]);

  const clubSearch = async (isNewSearch = false) => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log("Club search already in progress, skipping...");
      return;
    }
    
    loadingRef.current = true;

    const currentOffset = isNewSearch ? 0 : offset;

    if (isNewSearch) {
      setClubs([]);
      setInitialLoading(true);
    }

    try {
      const params = new URLSearchParams()

      nameFilter ? params.append("name", nameFilter) : null
      campusFilter ? params.append("campus", campusFilter) : null
      descriptionFilter ? params.append("description", descriptionFilter) : null
      sortOrder ? params.append("sort_by", "followers") : null
      sortOrder ? params.append("sort_order", sortOrder) : null
      params.append("offset", currentOffset.toString())
      params.append("limit", limit.toString());

      const res = await fetch(`/api/clubs?${params.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch clubs: ${res.status}`);
      }

      const data = await res.json()
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format");
      }
      
      setOffset(currentOffset + data.length);
      setHasMore(data.length === limit);
      
      if (isNewSearch){
        setClubs(data as Club[])
      } else{
        setClubs(prevClubs => {
          const newClubs = data.filter((newClub: Club) => !prevClubs.some(existingClub => existingClub.id === newClub.id));
          return [...prevClubs, ...newClubs];
        })
      }

      console.log("Club list updated:", data)
    } catch (error) {
      console.error("Error fetching clubs:", error);
      // Reset loading states on error
      setHasMore(false);
    } finally {
      if (isNewSearch) {
        setInitialLoading(false);
      }
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      // Cancel any ongoing requests
      loadingRef.current = false;
      setHasMore(true); // Reset hasMore for new search
      setOffset(0); // Reset offset for new search
      setInitialLoading(true); // Show loading state for new search
      clubSearch(true);
    }, 300); // Reduced from 500ms to 300ms for faster response
  
    return () => {
      clearTimeout(delay);
      // Cancel any ongoing requests when component unmounts or dependencies change
      loadingRef.current = false;
    };
  }, [nameFilter, campusFilter, descriptionFilter, sortOrder]);

  // Infinite scrolling logic with debouncing
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
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
        clubSearch();
      }
    }, 300); // Increased debounce time
  };

  // Add scroll event listener with throttling
  window.addEventListener('scroll', handleScroll, { passive: true });
  console.log("Scroll event listener added");

  // Cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll);
    clearTimeout(scrollTimeout);
  };
}, [hasMore, offset]);

  return (
    <div className="min-h-screen bg-background">

      {/* Header and Search Section */}
      <div className="max-w-4xl mx-auto pt-8 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-primary text-center ">Club Search</h1>
          </div>
          <p className="text-muted-foreground">Discover and connect with student organizations</p>
        </div>

         {/* Compact Search Filters */}
         <div className="bg-card rounded-lg shadow-md border border-border p-4 mb-4 form-glow">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Club Name Filter */}
             <div className="space-y-2">
               <label className="text-lg font-medium text-primary">Club Name</label>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                 <input
                  type="text"
                  placeholder="Search by club name..."
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
           </div>

           <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Campus Filter */}
             <div className="space-y-2">
              <label className="text-lg font-medium text-primary">Campus</label>
              <div className="relative">
                <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-200 outline-none text-sm text-card-foreground placeholder-muted-foreground bg-input"
              >
                <option value="">Select Campus</option>
                <option value="UTSC">UTSC</option>
                <option value="UTSG">UTSG</option>
                <option value="UTM">UTM</option>
              </select>
              </div>
             </div>

             {/* Sort By Filter */}
             <div className="space-y-2">
              <label className="text-lg font-medium text-primary">Sort By</label>
              <div className="relative">
                <select
                value={sortOrder}
                onChange={(e) => setsortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-200 outline-none text-sm text-card-foreground placeholder-muted-foreground bg-input"
              >
                <option value="desc">Follows (Descending)</option>
                <option value="asc">Follows (Ascending)</option>
              </select>
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
            <h2 className="text-2xl font-bold text-primary mb-6 text-center">Club Results</h2>

            {initialLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : clubs.length === 0 ? (
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
                <h3 className="text-lg font-semibold text-card-foreground mb-2">No clubs found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your filters to find more clubs</p>
              </div>            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {clubs.map((club: Club) => (
                      <ClubCard
                        key={club.id} 
                        club={club} 
                      />
                  ))}
                </div>
                
                {/* End of results indicator */}
                {!hasMore && clubs.length > 0 && (
                  <div className="mt-8 py-4 text-center">
                    <p className="text-muted-foreground">No more clubs to load</p>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
      <div id="scroll-anchor" style={{ height: "1px" }}></div>
    </div>
  )
}