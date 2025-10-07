"use client";

import { useState, useEffect } from "react";
import { MapPin, Briefcase, Users, CheckCircle, Building2 } from "lucide-react";
import { Modal } from "./modal";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ExpandablePositionCardProps {
  position: any;
  onClose: () => void;
}

export function ExpandablePositionCard({ position, onClose }: ExpandablePositionCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Prevent event bubbling to parent by using setTimeout
      setTimeout(() => {
        onClose();
      }, 0);
    }
  };

  const handleLinkClick = () => {
    router.push(`/apply/${position.clubId}/${position.id}`);
  };

  const requirements = position.requirements || [];

  return (
    <Modal
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={`${position.title || 'Position'} at ${position.clubName}`}
      className="p-4"
      backgroundClass="bg-card/95 backdrop-blur-xl"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Club Image */}
            <div className="flex-shrink-0">
              {position.clubImage ? (
                <img
                  src={position.clubImage}
                  alt={position.clubName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Position and Club Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {position.title || `Position at ${position.clubName}`}
              </h2>
              <h3 className="text-lg font-semibold text-primary mb-2">
                <Link href={`/clubPage/${position.clubId}`} className="hover:underline">
                  {position.clubName}
                </Link>
              </h3>
              
              {/* Position Details */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {position.clubCampus}
                </span>
                {position.clubDepartment && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {position.clubDepartment}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="ml-6 mr-6 border-b border-border"></div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Position Description */}
          {position.description && (
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Position Description
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {position.description}
                </p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Requirements
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <ul className="space-y-2">
                  {requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Club Description */}
          {position.clubDescription && (
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                About {position.clubName}
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-muted-foreground leading-relaxed">
                  {position.clubDescription}
                </p>
              </div>
            </div>
          )}
        
          {/* Apply Button */}
          {/* TODO: Change to a link to the application form */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleLinkClick}
              className="cursor-pointer w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Apply for this Position
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
} 