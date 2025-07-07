"use client";

import { useState, useEffect } from "react";
import { X, Heart, Calendar, MapPin, Edit2, ExternalLink, Users, Save, Plus, Trash2 } from "lucide-react";
import type { Post, Club } from "@/model/types";
import firebase from "@/model/firebase";
import { useAuth } from '@/hooks/useAuth';

interface ExpandablePostCardProps {
  post: Post;
  currentUser?: any;
  onClose: () => void;
  onEdit?: (post: Post) => void;
  onSave?: (post: Post) => void;
  onSaveError?: (error: string) => void;
  onLikeUpdate?: (postId: string, newLikes: number, isLiked: boolean) => void;
  onDelete?: (postId: string) => void;
  onRefresh?: () => void;
  isCreating?: boolean;
}

export function ExpandablePostCard({ post, currentUser, onClose, onEdit, onSave, onSaveError, onLikeUpdate, onDelete, onRefresh, isCreating = false }: ExpandablePostCardProps) {
  const [clubName, setClubName] = useState("");
  const [isEditing, setIsEditing] = useState(isCreating); // Start in editing mode if creating
  const [editedPost, setEditedPost] = useState<Post>(post);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  const [likes, setLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Update likes when post prop changes
  useEffect(() => {
    setLikes(post.likes);
  }, [post.likes]);

  useEffect(() => {
    if (currentUser?.liked_posts) {
      setIsLiked(currentUser.liked_posts.includes(post.id));
    }
  }, [currentUser, post.id]);

  useEffect(() => {
    const fetchClubData = async () => {
      if (post.club) {
        try {
          const res = await fetch(`/api/clubs?id=${post.club}`);
          if (res.ok) {
            const clubData: Club = await res.json();
            setClubName(clubData.name);
            setClubId(clubData.id);
          } else {
            setClubName("Unknown Club");
          }
        } catch (error) {
          console.log("Error fetching club name:", error);
          setClubName("Unknown Club");
        }
      }
    };

    fetchClubData();
  }, [post.club]);

  const isClubAdmin = currentUser?.managed_clubs?.includes(clubId) || false;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        alert('Please log in to delete posts');
        return;
      }

      const idToken = await user.getIdToken();
      
      const response = await fetch(`/api/posts?id=${post.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        if (onDelete) {
          onDelete(post.id);
        }
        if (onRefresh) {
          onRefresh();
        }
        onClose();
      } else {
        const errorData = await response.text();
        console.log('Failed to delete post:', response.status, errorData);
        alert('Failed to delete post. You may not have permission to delete this post.');
      }
    } catch (error) {
      console.log('Error deleting post:', error);
      alert('Error occurred while deleting post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);

    try {
      const url = isCreating ? `/api/posts` : `/api/posts?id=${post.id}`;
      const method = isCreating ? 'POST' : 'PUT';

      const authUser = firebase.auth().currentUser;
      
      if (authUser) {
        const token = await authUser.getIdToken();

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(editedPost),
        });

        if (response.ok) {
          const savedPost = await response.json();
          setIsEditing(false);
          
          if (onEdit) onEdit(savedPost);
          if (onSave) onSave(savedPost);

          // Force a re-render by updating the post prop reference
          Object.assign(post, savedPost);
        } else {
          const errorData = await response.json();
          console.log('Failed to save post', errorData);
          if (onSaveError) {
            onSaveError(errorData.message || errorData.error || 'Failed to save post');
          }
        }
      } else {
        if (onSaveError) {
          onSaveError('Please log in to save posts');
        }
      }
    } catch (error) {
      console.log('Error saving post:', error);
      if (onSaveError) {
        onSaveError(error instanceof Error ? error.message : 'An unknown error occurred.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedPost(post);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof Post, value: any) => {
    setEditedPost(prev => ({ ...prev, [field]: value }));
  };

  const addHashtag = () => {
    setEditedPost(prev => ({ ...prev, hashtags: [...prev.hashtags, ''] }));
  };

  const removeHashtag = (index: number) => {
    setEditedPost(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index)
    }));
  };

  const updateHashtag = (index: number, value: string) => {
    setEditedPost(prev => ({
      ...prev,
      hashtags: prev.hashtags.map((tag, i) => i === index ? value : tag)
    }));
  };

  const addLink = () => {
    setEditedPost(prev => ({ ...prev, links: [...prev.links, ''] }));
  };

  const removeLink = (index: number) => {
    setEditedPost(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index: number, value: string) => {
    setEditedPost(prev => ({
      ...prev,
      links: prev.links.map((url, i) => i === index ? value : url)
    }));
  };

  const handleLinkClick = (e: React.MouseEvent, link: string) => {
    e.stopPropagation();
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleCloseOverlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLiking) {
      console.log('Already loading, skipping...');
      return;
    }
    
    setIsLiking(true);
    
    try {
      const user = firebase.auth().currentUser;
      console.log('Firebase user:', user?.uid);
      
      if (!user) {
        console.log('User not authenticated');
        alert('Please log in to like posts');
        return;
      }

      const idToken = await user.getIdToken();
      console.log('Making API call to like post:', post.id);
      
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          postId: post.id
        })
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Like response data:', data);
        setLikes(data.likes);
        setIsLiked(data.liked);
        if (onLikeUpdate) {
          onLikeUpdate(post.id, data.likes, data.liked);
        }
      } else {
        const errorData = await response.text();
        console.log('Failed to like/unlike post:', response.status, errorData);
        alert('Failed to like/unlike post');
      }
    } catch (error) {
      console.log('Error handling like:', error);
      alert('Error occurred while liking/unliking post');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCloseOverlay}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative">
          <img
            src={post.image || "/placeholder.jpg"}
            alt={post.title}
            className="w-full h-64 object-cover"
          />
          
          {/* Close button */}
          <button
            onClick={handleCloseOverlay}
            className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Edit/Save/Cancel/Delete buttons for club admins */}
          {(isClubAdmin || isCreating) && (
            <div className="absolute top-4 left-4 flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  {!isCreating && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Likes overlay */}
          {!isCreating && (
          <button
            onClick={(e) => {
              console.log('Like button clicked - current state:', { isLiked, likes, postId: post.id });
              handleLike(e);
            }}
            disabled={!currentUser || isLiking}
            className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-2 rounded-full flex items-center gap-2 hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Heart 
              className={`h-5 w-5 transition-colors ${
                isLiked ? 'text-red-500 fill-current' : 'text-red-400'
              }`}
              fill={isLiked ? "currentColor" : "none"}
            />
            <span className="font-medium">{likes}</span>
          </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {isEditing ? (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editedPost.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editedPost.details}
                  onChange={(e) => handleInputChange('details', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={editedPost.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Event">Event</option>
                  <option value="Hiring Opportunity">Hiring Opportunity</option>
                  <option value="General Announcement">General Announcement</option>
                  <option value="Survey">Survey</option>
                </select>
              </div>

              {/* Campus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campus <span className="text-red-500">*</span>
                </label>
                <select
                  value={editedPost.campus}
                  onChange={(e) => handleInputChange('campus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a campus</option>
                  <option value="UTSG">UTSG</option>
                  <option value="UTSC">UTSC</option>
                  <option value="UTM">UTM</option>
                </select>
              </div>              
              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={editedPost.date_occuring ? new Date(editedPost.date_occuring).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('date_occuring', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image Upload</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleInputChange('image', reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Hashtags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Tags</label>
                  <button
                    onClick={addHashtag}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    <Plus className="h-3 w-3" />
                    Add Tag
                  </button>
                </div>
                <div className="space-y-2">
                  {editedPost.hashtags.map((hashtag, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={hashtag}
                        onChange={(e) => updateHashtag(index, e.target.value)}
                        placeholder="Enter hashtag"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeHashtag(index)}
                        className="px-2 py-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Related Links</label>
                  <button
                    onClick={addLink}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    <Plus className="h-3 w-3" />
                    Add Link
                  </button>
                </div>
                <div className="space-y-2">
                  {editedPost.links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => updateLink(index, e.target.value)}
                        placeholder="Enter URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeLink(index)}
                        className="px-2 py-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {post.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {post.campus}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {clubName || "Loading..."}
                  </span>
                </div>
              </div>              
              
              {post.details && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.details}
                  </p>
                </div>
              )}              
              
              {/* Date Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Date */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Event Date</h3>
                  <p className="text-gray-700">
                    {post.date_occuring && !isNaN(new Date(post.date_occuring).getTime()) 
                      ? new Date(post.date_occuring).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Not Specified'
                    }
                  </p>
                </div>

                {/* Posted Date */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Posted Date</h3>
                  <p className="text-gray-700">
                    {post.date_posted && !isNaN(new Date(post.date_posted).getTime()) 
                      ? new Date(post.date_posted).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Not Specified'
                    }
                  </p>
                </div>
              </div>

              {/* Hashtags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                      >
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {post.links && post.links.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Related Links</h3>
                  <div className="space-y-2">
                    {post.links.map((link, index) => (
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
          )}
        </div>       
      </div>
    </div>
  );
}
