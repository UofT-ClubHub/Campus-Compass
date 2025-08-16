"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Heart } from "lucide-react";
import type { Post, Club } from "@/model/types";
import { useRouter } from 'next/navigation';

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
  const [clubName, setClubName] = useState("");
  const router = useRouter();

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
    router.push(`/postFilter/postPage/${post.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-post-card-bg rounded-xl shadow-md border-2 border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer ${className}`}
    >
      {/* Image Section */}
      <div className="relative h-64 bg-muted">
        <img
          src={post.image || "/placeholder.jpg"}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content Section */}
      <div className="p-8 space-y-5">
        <h3 className="text-xl font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        {post.details && (
          <p className="text-base text-muted-foreground line-clamp-3">{post.details}</p>
        )}

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-base text-muted-foreground">{post.category}</span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-destructive" />
            <span className="text-base text-muted-foreground">{post.campus}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-base text-muted-foreground">{clubName || "Loading..."}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-accent" />
            <span className="text-base text-muted-foreground">{post.likes || 0} likes</span>
          </div>
        </div>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.hashtags.slice(0, 3).map((hashtag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                #{hashtag}
              </span>
            ))}
            {post.hashtags.length > 3 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                +{post.hashtags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}