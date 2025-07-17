"use client";

import { useState, useEffect } from "react";
import { MapPin, Users } from "lucide-react";
import type { Club, User } from "@/model/types";
import { auth } from "@/model/firebase";
import { ExpandableClubCard } from "./expandable-club-card";
import React from 'react';

interface ClubCardProps {
  club: Club;
  currentUser?: any;
  onManagePosts?: (clubId: string) => void;
  className?: string;
}

export function ClubCard({ club, currentUser, onManagePosts, className = "" }: ClubCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [executives, setExecutives] = useState<User[]>([]);
  const [followerCount, setFollowerCount] = useState(club.followers);

  useEffect(() => {
    setFollowerCount(club.followers);
  }, [club.followers]);

  useEffect(() => {
    const fetchExecutives = async () => {
      if (club.executives && club.executives.length > 0) {
        try {
          const user = auth.currentUser;
          if (!user) return;
          
          const token = await user.getIdToken();
          const executivePromises = club.executives.map(async (execId) => {
            try {
              const res = await fetch(`/api/users?id=${execId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              return res.ok ? res.json() : null;
            } catch {
              return null;
            }
          });
          const executiveData = await Promise.all(executivePromises);
          setExecutives(executiveData.filter((e): e is User => e !== null));
        } catch (error) {
          console.log("Failed to fetch executives:", error);
        }
      }
    };

    fetchExecutives();
  }, [club.executives]);

  const handleCardClick = () => {
    setIsExpanded(true);
  };

  const handleCloseOverlay = () => {
    setIsExpanded(false);
  };

  const handleFollowerCountUpdate = (newCount: number) => {
    setFollowerCount(newCount);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer flex flex-col ${className}`}
      >
        <div className="relative h-40 bg-gray-200">
          <img
            src={club.image || "placeholder.jpg"}
            alt={club.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-blue-600 leading-tight mb-2 text-center group-hover:text-blue-700 transition-colors">
            {club.name}
          </h3>
          <p className="text-gray-600 text-xs mb-3 line-clamp-3 flex-grow">
            {club.description}
          </p>
          {executives.length > 0 && (
            <div className="mb-3 text-center">
              <p className="text-xs text-gray-800 font-bold">Executives</p>
              <p className="text-xs text-gray-600">
                {executives.map(e => e.name).join(', ')}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap justify-center mb-3">
            <span className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
              <MapPin className="w-3 h-3" />
              {club.campus}
            </span>
            <span className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
              <Users className="w-3 h-3" />
              {followerCount}
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <ExpandableClubCard
          club={club}
          currentUser={currentUser}
          onClose={handleCloseOverlay}
          onManagePosts={onManagePosts}
          onFollowerCountUpdate={handleFollowerCountUpdate}
        />
      )}
    </>
  );
}
