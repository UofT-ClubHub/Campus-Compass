'use client';

import { useState, useEffect } from 'react';
import { Club } from '@/model/types';



export default function clubSearchPage() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(false);
    const [clubList, setClubList] = useState<Club[]>([]);
    const [nameFilter, setNameFilter] = useState('');
    const [campusFilter, setCampusFilter] = useState('');
    const [descriptionFilter, setDescriptionFilter] = useState('');

    const clubSearch = async () => {
      try {

          const params = new URLSearchParams();

          nameFilter ? params.append('name', nameFilter) : null;
          campusFilter ? params.append('campus', campusFilter) : null;
          descriptionFilter ? params.append('description', descriptionFilter) : null;
          params.append('sort_by', 'followers');
          params.append('sort_order', 'desc'); // or 'asc' for ascending

          const res = await fetch(`/api/clubs?${params.toString()}`, {
            method: 'GET',
          });

          if (!res.ok) {
              throw new Error('Failed to fetch clubs');
          }

          const data = await res.json();
          if (!Array.isArray(data)) {
              throw new Error('Invalid response format');
          }

          setClubList(data as Club[]);

          // console.log("Searching for clubs with filters:", {nameFilter, campusFilter, descriptionFilter});
          console.log('Club list updated:', data);

      } catch (error) {
          console.error('Error fetching clubs:', error);
      } finally {
          setLoading(false);
          // console.log("Searching for clubs with filters:", {nameFilter, campusFilter, descriptionFilter});
          // console.log('Club list updated:', data);
      }
    }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-12 max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-blue-600 text-center">Club Search</h1>

        <div className="flex flex-col gap-6 w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Club Name Filter */}
          <input
            type="text"
            placeholder="Club Name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-700 placeholder-gray-400 font-medium"
          />

          {/* Event Description Filter */}
          <input
            type="text"
            placeholder="Description"
            value={descriptionFilter}
            onChange={(e) => setDescriptionFilter(e.target.value)}
            className="p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-700 placeholder-gray-400 font-medium"
          />

          {/* Campus Filter */}
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-700 font-medium bg-white"
          >
            <option value="">Select Campus</option>
            <option value="UTSC">UTSC</option>
            <option value="UTSG">UTSG</option>
            <option value="UTM">UTM</option>
          </select>
        </div>

        <button
          onClick={() => {
            console.log("Searching for clubs with filters:", { nameFilter, campusFilter, descriptionFilter })
            clubSearch()
          }}
          className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Searching...
            </span>
          ) : (
            "Search for Clubs"
          )}
        </button>
      </div>

      {/* Wider search results section - moved up */}
      <div className="w-full max-w-7xl mx-auto px-8 pb-12 -mt-32">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-8 text-center">Club Results</h1>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : clubList.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No clubs found</h3>
              <p className="text-gray-500">Try adjusting your filters to find more clubs</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {clubList.map((club) => (
                <li
                key={club.id}
                className="bg-gray-50 rounded-xl shadow-md hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col h-80"
                >
                {/* Club Image */}
                <div className="relative h-48 bg-gray-200">
                    <img
                    src="/placeholder.svg?height=200&width=400"
                    alt={club.name}
                    className="w-full h-full object-cover"
                    />
                </div>

                <div className="p-4 flex flex-col flex-grow">
                    {/* Club Name */}
                    <h2 className="text-xl font-bold text-blue-600 leading-tight mb-1 text-center">{club.name}</h2>

                    {/* Followers and Campus - styled properly */}
                    <div className="flex items-center gap-3 flex-wrap justify-center mt-auto">
                    {/* Followers */}
                    <p className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                        </svg>
                        {club.followers} Followers
                    </p>

                    {/* Campus */}
                    <p className="flex items-center gap-2 bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        Campus: {club.campus}
                    </p>
                    </div>
                </div>
                </li>
            ))}
            </ul>

          )}
        </div>
      </div>
    </div>
  )
}