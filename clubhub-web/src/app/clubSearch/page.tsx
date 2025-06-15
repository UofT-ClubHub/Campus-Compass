"use client"

import { useState } from "react"
import type { Club } from "@/model/types"

export default function clubSearchPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [clubList, setClubList] = useState<Club[]>([])
  const [nameFilter, setNameFilter] = useState("")
  const [campusFilter, setCampusFilter] = useState("")
  const [descriptionFilter, setDescriptionFilter] = useState("")

  const clubSearch = async () => {
    try {
      const params = new URLSearchParams()

      nameFilter ? params.append("name", nameFilter) : null
      campusFilter ? params.append("campus", campusFilter) : null
      descriptionFilter ? params.append("description", descriptionFilter) : null
      params.append("sort_by", "followers")
      params.append("sort_order", "desc") // or 'asc' for ascending

      const res = await fetch(`/api/clubs?${params.toString()}`, {
        method: "GET",
      })

      if (!res.ok) {
        throw new Error("Failed to fetch clubs")
      }

      const data = await res.json()
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format")
      }

      setClubList(data as Club[])

      // console.log("Searching for clubs with filters:", {nameFilter, campusFilter, descriptionFilter});
      console.log("Club list updated:", data)
    } catch (error) {
      console.error("Error fetching clubs:", error)
    } finally {
      setLoading(false)
      // console.log("Searching for clubs with filters:", {nameFilter, campusFilter, descriptionFilter});
      // console.log('Club list updated:', data);
    }
  }

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

          {/* Search Button */}
          <div className="text-center">
            <button
              onClick={() => {
                console.log("Searching for clubs with filters:", { nameFilter, campusFilter, descriptionFilter })
                clubSearch()
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Searching...
                </span>
              ) : (
                "Search for Clubs"
              )}
            </button>
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
            ) : clubList.length === 0 ? (
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
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {clubList.map((club) => (
                  <div
                    key={club.id}
                    className="bg-gray-50 rounded-lg shadow-sm hover:shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  >
                    {/* Club Image */}
                    <div className="relative h-40 bg-gray-200">
                      <img
                        src={club.image || "/placeholder.svg?height=160&width=320"}
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      {/* Club Name */}
                      <h3 className="text-lg font-bold text-blue-600 leading-tight mb-2 text-center">{club.name}</h3>

                      {/* Description */}
                      <p className="text-gray-600 text-xs mb-3 line-clamp-3 flex-grow">{club.description}</p>

                      {/* Campus and Followers */}
                      <div className="flex items-center gap-2 flex-wrap justify-center mb-3">
                        <span className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {club.campus}
                        </span>

                        <span className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                            />
                          </svg>
                          {club.followers}
                        </span>
                      </div>

                      {/* Instagram Link */}
                      {club.instagram && (
                        <a
                          href={club.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-md text-xs font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                          Instagram
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
