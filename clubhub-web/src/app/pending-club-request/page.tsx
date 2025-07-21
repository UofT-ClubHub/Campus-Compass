'use client';

import { useState } from 'react';
import { auth } from '@/model/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import React from "react";

export default function PendingClubRequestPage() {
  const [user] = useAuthState(auth);
  const [clubName, setClubName] = useState('');
  const [clubCampus, setClubCampus] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [clubInstagram, setClubInstagram] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to upload image to backend and get download URL
  const uploadImageToBackend = async (file: File, folder: string = 'pending-clubs'): Promise<string> => {
    if (!user) {
      throw new Error('Please log in to upload images');
    }

    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    return data.downloadURL;
  };

  const campusOptions = [
    { value: 'UTSG', label: 'UTSG' },
    { value: 'UTSC', label: 'UTSC' },
    { value: 'UTM', label: 'UTM' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to request a club');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      let imageUrl = '';
      if (pendingImageFile) {
        imageUrl = await uploadImageToBackend(pendingImageFile, 'pending-clubs');
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/pending-clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          club_name: clubName.trim(),
          club_campus: clubCampus,
          club_description: clubDescription.trim(),
          club_image: imageUrl,
          club_instagram: clubInstagram.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit club request');
      }

      setSuccessMessage('Club request submitted successfully! Please wait for admin approval.');
      setClubName('');
      setClubCampus('');
      setClubDescription('');
      setPendingImageFile(null);
      setClubInstagram('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6 text-center text-foreground">Request a New Club</h1>
      <div className="bg-card rounded-lg shadow-sm p-6 border-2 border-border form-glow">
        {error && (
          <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-success/10 border-2 border-success/20 text-success px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clubName" className="block text-sm font-medium text-foreground mb-2">
              Club Name *
            </label>
            <input
              type="text"
              id="clubName"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              required
              maxLength={100}
              className="w-full p-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-card"
              placeholder="Enter the club name..."
            />
          </div>

          <div>
            <label htmlFor="clubCampus" className="block text-sm font-medium text-foreground mb-2">
              Campus *
            </label>
            <select
              id="clubCampus"
              value={clubCampus}
              onChange={(e) => setClubCampus(e.target.value)}
              required
              className="w-full p-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-card"
            >
              <option value="">Select a campus...</option>
              {campusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="clubDescription" className="block text-sm font-medium text-foreground mb-2">
              Club Description *
            </label>
            <textarea
              id="clubDescription"
              value={clubDescription}
              onChange={(e) => setClubDescription(e.target.value)}
              required
              maxLength={500}
              rows={4}
              className="w-full p-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-card resize-none placeholder:text-muted-foreground"
              placeholder="Describe your club's purpose, activities, and goals..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              {clubDescription.length}/500 characters
            </p>
          </div>

          <div>
            <label htmlFor="clubImage" className="block text-sm font-medium text-foreground mb-2">
              Club Image (optional)
            </label>
            <input
              type="file"
              id="clubImage"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setPendingImageFile(e.target.files[0]);
                }
              }}
              className="w-full p-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-card"
            />
          </div>

          <div>
            <label htmlFor="clubInstagram" className="block text-sm font-medium text-foreground mb-2">
              Club Instagram
            </label>
            <input
              type="text"
              id="clubInstagram"
              value={clubInstagram}
              onChange={(e) => setClubInstagram(e.target.value)}
              maxLength={100}
              className="w-full p-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-card"
              placeholder="Enter the club's Instagram handle or URL (optional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !clubName.trim() || !clubCampus || !clubDescription.trim()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors font-medium shadow-md hover:shadow-lg"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
} 