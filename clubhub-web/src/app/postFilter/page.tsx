"use client";

import Image from "next/image";
import firebase from "@/model/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Post } from "@/model/types";

export default function clubSearchPage() {
  const [clubList, setClubList] = useState<Post[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [campusFilter, setCampusFilter] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [hashtagsFilter, setHashtagsFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filterClubs = async () => {
    const params = new URLSearchParams();

    nameFilter ? params.append('title', nameFilter) : null;
    campusFilter ? params.append('campus', campusFilter) : null;
    clubFilter ? params.append('club', clubFilter) : null;
    categoryFilter ? params.append('category', categoryFilter) : null;
    descriptionFilter ? params.append('details', descriptionFilter) : null;
    params.append('sort_by', "likes");
    params.append('sort_order', "desc");

    if (hashtagsFilter) {
      const hashtags = hashtagsFilter.split(',').map(tag => tag.trim());
      // Ensure hashtags are lowercase 
      params.append('hashtags', JSON.stringify(hashtags.map(tag => tag.toLowerCase())));
    }
    

    const response = await fetch(`/api/posts?${params.toString()}`, {
      method: "GET",
    })
    if (!response.ok) {
      console.error("Failed to fetch posts:", response.statusText);
      return;
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error("Unexpected response format:", data);
      return;
    }
    setClubList(data as Post[]);

    console.log("Filtered clubs:", data);
  }



  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
        <h1 className="text-2xl font-bold">Post Search</h1>
        <div className="flex flex-col gap-4 w-full max-w-md">
          <input
            type="text"
            placeholder="Post Name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Description"
            value={descriptionFilter}
            onChange={(e) => setDescriptionFilter(e.target.value)}
            className="p-2 border rounded"
          />
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select Campus</option>
            <option value="UTSC">UTSC</option>
            <option value="UTSG">UTSG</option>
            <option value="UTM">UTM</option>
          </select>
          <input
            type="text"
            placeholder="Club Name"
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Hashtags (comma separated)"
            value={hashtagsFilter}
            onChange={(e) => setHashtagsFilter(e.target.value)}
            className="p-2 border rounded"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select Type of Event</option>
            <option value="UTSC">Event</option>
            <option value="UTSG">Gala</option>
            <option value="UTM">Hackathon</option>
          </select>
        </div>
        <button
          onClick={() => {
            // Implement search logic here
            console.log("Searching for posts with filters:", {nameFilter, campusFilter, descriptionFilter, clubFilter, hashtagsFilter, categoryFilter});
            filterClubs();
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >Search for Posts 
        </button>
      </div>
    </div>
  );
}
