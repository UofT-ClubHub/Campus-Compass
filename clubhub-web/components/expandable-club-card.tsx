"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, MapPin, Users, ExternalLink } from "lucide-react";
import type { Club, User } from "@/model/types";
import firebase from "@/model/firebase";

interface ExpandableClubCardProps {
  club: Club;
  currentUser?: any;
  onManagePosts?: (clubId: string) => void;
  onClose: () => void;
  onFollowerCountUpdate?: (newCount: number) => void;
  onPostUpdate?: () => void;
}

export function ExpandableClubCard({ 
  club, 
  currentUser, 
  onManagePosts,
  onClose,
  onFollowerCountUpdate,
  onPostUpdate
}: ExpandableClubCardProps) {
  const router = useRouter();
  const [executives, setExecutives] = useState<User[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(club.followers);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const isClubExecutive = currentUser?.managed_clubs?.includes(club.id) || false;

  // Update follower count when club prop changes
  useEffect(() => {
    setFollowerCount(club.followers);
  }, [club.followers]);

  useEffect(() => {
    if (currentUser?.followed_clubs) {
      setIsFollowing(currentUser.followed_clubs.includes(club.id));
    }
  }, [currentUser, club.id]);

  useEffect(() => {
    const fetchExecutives = async () => {
      if (club.executives && club.executives.length > 0) {
        try {
          const executivePromises = club.executives.map(execId =>
            fetch(`/api/users?id=${execId}`).then(res => res.ok ? res.json() : null)
          );
          const executiveData = await Promise.all(executivePromises);
          setExecutives(executiveData.filter((e): e is User => e !== null));
        } catch (error) {
          console.log("Failed to fetch executives:", error);
        }
      }
    };

    fetchExecutives();
  }, [club.executives]);

  const handleManagePosts = () => {
    router.push('/exec');
  };

  const handleCloseOverlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleLinkClick = (e: React.MouseEvent, link: string) => {
    e.stopPropagation();
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleFollowClub = async () => {
    console.log('Follow button clicked', { currentUser, isFollowLoading });
    
    if (isFollowLoading) {
      console.log('Already loading, skipping...');
      return;
    }

    setIsFollowLoading(true);
    try {
      const user = firebase.auth().currentUser;
      console.log('Firebase user:', user?.uid);
      
      if (!user) {
        console.log('User not authenticated');
        alert('Please log in to follow clubs');
        return;
      }

      const idToken = await user.getIdToken();
      console.log('Making API call to follow club:', club.id);
      
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ clubId: club.id })
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Follow response data:', data);
        setIsFollowing(data.following);
        setFollowerCount(data.followersCount);
        onFollowerCountUpdate?.(data.followersCount);
      } else {
        const errorData = await response.text();
        console.log('Failed to follow/unfollow club:', response.status, errorData);
        alert('Failed to follow/unfollow club');
      }
    } catch (error) {
      console.log('Error following/unfollowing club:', error);
      alert('Error occurred while following/unfollowing club');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const handle = club.instagram.startsWith('@') ? club.instagram.substring(1) : club.instagram;
    window.open(`https://www.instagram.com/${handle}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCloseOverlay}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header Image */}
        <div className="relative h-64 bg-gray-200">
          <img
            src={club.image || "/placeholder.svg?height=160&width=320"}
            alt={club.name}
            className="w-full h-full object-cover"
          />
          {/* Close button */}
          <button
            onClick={handleCloseOverlay}
            className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{club.name}</h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {club.campus}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {followerCount} followers
            </span>
          </div>

          <div className="space-y-4">
            {/* Full Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {club.description}
              </p>
            </div>

            {/* Executives */}
            {executives.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Executives ({executives.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {executives.slice(0, 5).map((exec) => (
                    <span
                      key={exec.id}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {exec.name}
                    </span>
                  ))}
                  {club.executives.length > 5 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      +{club.executives.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Instagram */}
            {club.instagram && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Instagram</h3>
                <button
                  onClick={handleInstagramClick}
                  className="flex items-center gap-2 text-pink-600 hover:text-pink-800 transition-colors text-sm font-medium"
                >
                  {club.instagram.startsWith('@') ? club.instagram : `@${club.instagram}`}
                </button>
              </div>
            )}

            {/* Links */}
            {club.links && club.links.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Related Links</h3>
                <div className="space-y-2">
                  {club.links.map((link, index) => (
                    <button
                      key={index}
                      onClick={(e) => handleLinkClick(e, link)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {link}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 mt-auto">
          <div className="flex gap-3 justify-center">
            {isClubExecutive && (
              <button
                onClick={handleManagePosts}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Manage
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleFollowClub();
              }}
              disabled={isFollowLoading || !currentUser}
              className={`px-8 py-3 rounded-lg transition-colors font-medium w-40 text-center ${isFollowing
                  ? 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                } ${(isFollowLoading || !currentUser) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFollowLoading ? (
                <div className="flex justify-center items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : currentUser && isFollowing ? (
                'Unfollow'
              ) : (
                'Follow'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
