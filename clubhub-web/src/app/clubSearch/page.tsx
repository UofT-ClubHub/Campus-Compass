"use client"

import { useState, useEffect } from "react"
import type { Club, User } from "@/model/types"
import { ClubCard } from "../../../components/club-card"
import { useAuth } from "@/hooks/useAuth"

export default function clubSearchPage() {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [nameFilter, setNameFilter] = useState("")
  const [campusFilter, setCampusFilter] = useState("")
  const [descriptionFilter, setDescriptionFilter] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 2;
  

  // Fetch current user data
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

  const clubSearch = async (isNewSearch = false) => {
    try {
      console.log("YURRRR")
      const params = new URLSearchParams()

      nameFilter ? params.append("name", nameFilter) : null
      campusFilter ? params.append("campus", campusFilter) : null
      descriptionFilter ? params.append("description", descriptionFilter) : null
      params.append("sort_by", "followers")
      params.append("sort_order", "desc") // or 'asc' for ascending
      params.append("offset", offset.toString()) // Pagination
      params.append("limit", limit.toString());
      const res = await fetch(`/api/clubs?${params.toString()}`, {
        method: "GET",
      })

      if (!res.ok) {
        throw new Error("Failed to fetch clubs")
      }

      const data = await res.json()
      
      setOffset(offset + data.length);
      //setLoading(false);
      setHasMore(data.length === limit);
      console.log("hasMore", hasMore);
      

      if (isNewSearch){
        setClubs(data as Club[])
      } else{
        setClubs(prevClubs => [...prevClubs, ...(data as Club[])])
      }

      //setHasMore(data.length > 0) // Check if there are more clubs to load

      // console.log("Searching for clubs with filters:", {nameFilter, campusFilter, descriptionFilter});
      console.log("Club list updated:", data)
      console.log("page", page)
    } catch (error) {
      console.log("Error fetching clubs:", error)
    } finally {
      setLoading(false)
      console.log("we here", page);
      // console.log("Searching for clubs with filters:", {nameFilter, campusFilter, descriptionFilter});
      // console.log('Club list updated:', data);
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1); // Reset to first page on new search
      setHasMore(true); // Reset hasMore for new search
      clubSearch(true);
    }, 500); // waits 500ms after user stops typing
  
    return () => clearTimeout(delay); // cancel previous timeout if input changes
  }, [nameFilter, campusFilter, descriptionFilter]);

//   // Fetch data when the page changes (pagination)
// useEffect(() => {
//   if (offset > 0) {
//       clubSearch();
//   }
// }, [offset]);

// Infinite scrolling logic
// Infinite scrolling logic
useEffect(() => {
  const handleScroll = () => {
    // Check if we're near the bottom of the page
    if (
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 &&  
      hasMore
    ) {
      console.log("Near bottom, fetching more...");
      clubSearch();
    }
  };

  // Add scroll event listener
  window.addEventListener('scroll', handleScroll);
  console.log("Scroll event listener added");
  console.log("check here", window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100, hasMore);

  // Cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, [hasMore, offset]); // Include loading in dependencies

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header and Search Section */}
      <div className="w-full bg-gray-50 pt-6 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-blue-600 text-center mb-6">Club Search</h1>

          {/* Compact Search Filters */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Club Name Filter */}
              <input
                type="text"
                placeholder="Club Name"
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
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="w-full bg-gray-50 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Club Results</h2>

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
              ) : clubs.length === 0 ? (
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
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No clubs found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters to find more clubs</p>
              </div>            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {clubs.map((club: Club) => (
                  // console.log("Rendering club:", club),
                  <ClubCard key={club.id} club={club} currentUser={currentUser} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div id="scroll-anchor" style={{ height: "1px" }}></div>
    </div>
  )
}