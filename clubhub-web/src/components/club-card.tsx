"use client";

import { useState, useEffect } from "react";
import { MapPin, Users } from "lucide-react";
import type { Club } from "@/model/types";
import { useRouter } from 'next/navigation';

interface ClubCardProps {
  club: Club;
  className?: string;
}

export function ClubCard({ club, className = "" }: ClubCardProps) {
  const [followerCount, setFollowerCount] = useState(club.followers);
  const router = useRouter();

  useEffect(() => {
    setFollowerCount(club.followers);
  }, [club.followers]);

  const handleCardClick = () => {
    router.push(`/clubPage/${club.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-club-card-bg rounded-xl shadow-sm border-2 border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer flex flex-col ${className}`}
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
          <img
            src={club?.image || "/placeholder.jpg"}
            alt={club.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Fade overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-club-card-bg to-transparent group-hover:scale-110 transition-transform duration-500"></div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 text-center">
          {club.name}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1 text-center">
          {club.description}
        </p>

        <hr className="border-border mb-4" />

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 bg-primary/20 px-3 py-1 rounded-full text-sm border-0 dark:border-0 light:border light:border-border text-foreground backdrop-blur-sm ml-4">
            <MapPin className="h-4 w-4 text-primary" />
            {club.campus}
          </span>
          <span className="flex items-center gap-1 bg-primary/20 px-4 py-1 rounded-full text-sm border-0 dark:border-0 light:border light:border-border text-foreground backdrop-blur-sm mr-4">
            <Users className="h-4 w-4 text-primary" />
            {followerCount}
          </span>
        </div>
      </div>
    </div>
  );
}
