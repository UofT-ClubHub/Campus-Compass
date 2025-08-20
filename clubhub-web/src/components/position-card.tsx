"use client";

import { useState } from "react";
import { MapPin, Users, Building2 } from "lucide-react";
import type { Club } from "@/model/types";
import { ExpandablePositionCard } from './expandable-position-card';

interface PositionCardProps {
  position: any;
  club: Club;
  className?: string;
}

export function PositionCard({ position, club, className = "" }: PositionCardProps) {
  const [showExpandable, setShowExpandable] = useState(false);

  const handleCardClick = () => {
    setShowExpandable(true);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-club-card-bg rounded-xl shadow-sm border-2 border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer flex flex-col w-full max-w-lg ${className}`}
    >
      {/* Position Title Header */}
      <div className="p-4 text-center pb-1">
        <h3 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
          {position.title || `Position at ${club.name}`}
        </h3>
        <div className="w-16 h-0.5 bg-primary mx-auto"></div>
      </div>

      {/* Club Information */}
      <div className="p-4 flex items-center gap-4">
        {club.image ? (
          <img
            src={club.image}
            alt={club.name}
            className="w-16 h-16 rounded-lg object-cover border border-border"
          />
        ) : (
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border border-border">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-card-foreground">
            {club.name}
          </h4>
        </div>
      </div>

      {/* Club Description */}
      <div className="px-4 pb-4">
        <p className="text-muted-foreground text-center text-sm line-clamp-3">
          {position.description}
        </p>
      </div>

      {/* Bottom Button/Tags */}
      <div className="mt-auto p-4 pt-0">
        <div className="bg-primary/20 rounded-full p-3 flex items-center justify-between border-0 dark:border-0 light:border light:border-border backdrop-blur-sm">
          <div className="flex items-center gap-2 px-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-foreground font-medium text-xs">{club.campus}</span>
          </div>
          <div className="w-px h-5 bg-foreground/30"></div>
          <div className="flex items-center gap-2 px-2 justify-center">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-foreground font-medium text-xs text-center">
              {position.department || club.department || 'Student Organization'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Expandable Position Card */}
      {showExpandable && (
        <ExpandablePositionCard
          position={position}
          club={club}
          onClose={() => setShowExpandable(false)}
        />
      )}
    </div>
  );
}
