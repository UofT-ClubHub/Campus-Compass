"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Heart } from "lucide-react";
import type { Post, Club } from "@/model/types";
import { ExpandablePostCard } from "./expandable-post-card";

interface PostCardProps {
  post: Post;
  currentUser?: any; // Flexible to handle either firebase.User or custom User
  onEdit?: (post: Post) => void;
  onUpdate?: () => void; // Callback to refresh parent component
  onLikeUpdate?: (postId: string, newLikes: number, isLiked: boolean) => void; // Callback for like updates
  onDelete?: (postId: string) => void; // Callback for post deletion
  onRefresh?: () => void; // Callback to refresh parent component's post list
  className?: string;
}

export function PostCard({ 
  post, 
  currentUser, 
  onEdit,
  onUpdate,
  onLikeUpdate,
  onDelete,
  onRefresh,
  className = "" 
}: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [clubName, setClubName] = useState("");

  useEffect(() => {
    const fetchClubName = async () => {
      if (post.club) {
        try {
          const res = await fetch(`/api/clubs?id=${post.club}`);
          if (res.ok) {
            const clubData: Club = await res.json();
            setClubName(clubData.name);
          } else {
            setClubName("Unknown Club");
          }
        } catch (error) {
          console.log("Error fetching club name:", error);
          setClubName("Unknown Club");
        }
      }
    };

    fetchClubName();
  }, [post.club]);

  const handleCardClick = () => {
    setIsExpanded(true);
  };

  const handleCloseOverlay = () => {
    setIsExpanded(false);
  };

  return (
    <>
      {/* Main Card */}
      <div
        onClick={handleCardClick}
        className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer ${className}`}
      >
        {/* Image Section */}
        <div className="relative h-48 bg-gray-200">
          <img
            src={post.image || "/placeholder.jpg"}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>

          {post.details && (
            <p className="text-sm text-gray-600 line-clamp-3">{post.details}</p>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">{post.category}</span>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="text-sm text-gray-600">{post.campus}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{clubName || "Loading..."}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <span className="text-sm text-gray-600">{post.likes || 0} likes</span>
            </div>
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.hashtags.slice(0, 3).map((hashtag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  #{hashtag}
                </span>
              ))}
              {post.hashtags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{post.hashtags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Overlay */}
      {isExpanded && (
        <ExpandablePostCard 
          post={post} 
          currentUser={currentUser}
          onClose={handleCloseOverlay}
          onEdit={onEdit}
          onLikeUpdate={onLikeUpdate}
          onDelete={onDelete}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}