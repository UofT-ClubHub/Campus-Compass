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
      className={`bg-club-card-bg rounded-xl shadow-sm border border-border-2 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer flex flex-col ${className}`}
    >
      <div className="relative h-40 bg-muted">
        <img
          src={club.image || "placeholder.jpg"}
          alt={club.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {club.name}
        </h3>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {club.campus}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {followerCount}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
          {club.description}
        </p>
      </div>
    </div>
  );
}
