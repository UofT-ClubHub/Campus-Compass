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
      <div className="relative h-80 bg-muted overflow-hidden">
        <img
          src={post.image || "/placeholder.jpg"}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Fade overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-post-card-bg to-transparent group-hover:scale-105 transition-transform duration-300"></div>
        <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          <span className="text-sm font-semibold text-foreground">{post.likes || 0}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-5">
        <h3 className="text-xl font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors text-center">
          {post.title}
        </h3>

        <hr className="border-border mb-4" />

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Category</p>
              <p className="text-sm text-foreground font-semibold truncate">{post.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Campus</p>
              <p className="text-sm text-foreground font-semibold truncate">{post.campus}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 col-span-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Users className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Organized by</p>
              <p className="text-sm text-foreground font-semibold truncate">{clubName || "Loading..."}</p>
            </div>
          </div>
        </div>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-nowrap gap-2 pt-2 border-t border-border items-center justify-center px-2">
            {post.hashtags.slice(0, 3).map((hashtag, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap"
              >
                #{hashtag}
              </span>
            ))}
            {post.hashtags.length > 3 && (
              <span className="px-3 py-1 rounded-full border border-border bg-background text-foreground text-xs font-medium flex-shrink-0 whitespace-nowrap">
                +{post.hashtags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
