'use client';

import { useState, useEffect } from 'react';
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
  const [showForm, setShowForm] = useState(true);
  const [pendingClubs, setPendingClubs] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Fetch user's pending clubs
  useEffect(() => {
    const fetchPendingClubs = async () => {
      if (!user) return;
      setLoadingPending(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/pending-clubs?user=${user.uid}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        setPendingClubs(Array.isArray(data) ? data : []);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoadingPending(false);
      }
    };
    if (!showForm && user) fetchPendingClubs();
  }, [showForm, user]);

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
      <div className="w-full max-w-screen-sm mx-auto py-8 px-4 lg:px-0">
        <div className="flex justify-center mb-6 gap-4">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${showForm ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            onClick={() => setShowForm(true)}
          >
            New Request
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${!showForm ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            onClick={() => setShowForm(false)}
          >
            My Requests
          </button>
        </div>
        {showForm ? (
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
        ) : (
          <div className="bg-card rounded-lg shadow-sm p-6 border-2 border-border">
            <h2 className="text-lg font-semibold mb-4 text-primary">My Past Club Requests</h2>
            {loadingPending ? (
              <div>Loading...</div>
            ) : pendingClubs.length === 0 ? (
              <div className="text-muted-foreground">No club requests found.</div>
            ) : (
              <div className="space-y-4">
                {pendingClubs.map((club) => (
                  <div key={club.id} className="border border-border rounded-lg p-4 bg-muted/30">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-foreground">{club.club_name}</h3>
                      <span className="text-xs bg-muted px-2 py-1 rounded text-foreground">{club.club_campus}</span>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-sm text-muted-foreground">Status: </span>
                      <span className="text-sm capitalize">
                        {club.status === 'pending' && <span className="text-yellow-600">Pending</span>}
                        {club.status === 'approved' && <span className="text-green-600">Approved</span>}
                        {club.status === 'rejected' && <span className="text-red-600">Rejected</span>}
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-sm text-muted-foreground">Submitted: </span>
                      <span className="text-sm text-foreground">
                        {club.created_at ? new Date(club.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    
                    {club.message && (
                      <div>
                        <span className="text-sm text-muted-foreground">Message: </span>
                        <p className="text-sm text-foreground mt-1">{club.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 