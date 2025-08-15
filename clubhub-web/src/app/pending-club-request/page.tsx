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
  const [clubDepartment, setClubDepartment] = useState('');
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
          club_department: clubDepartment.trim(),
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
      setClubDepartment('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">Club Registration Portal</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start your journey by registering your club with us. Join our vibrant community of student organizations.
          </p>
        </div>

        <div className="flex justify-center mb-8 gap-4">
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
              showForm 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-card text-card-foreground hover:bg-muted border border-border'
            }`}
            onClick={() => setShowForm(true)}
          >
            New Request
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
              !showForm 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-card text-card-foreground hover:bg-muted border border-border'
            }`}
            onClick={() => setShowForm(false)}
          >
            My Requests
          </button>
        </div>

        {showForm ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-xl border border-border p-8 card-glow">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-3">Register Your Club</h2>
              <p className="text-muted-foreground">
                Fill out the form below to submit your club for approval. All fields marked with * are required.
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
                <strong>Error:</strong> {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg mb-6">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="clubName" className="block text-sm font-medium text-foreground">
                    Club Name *
                  </label>
                  <input
                    type="text"
                    id="clubName"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full h-11 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background"
                    placeholder="Enter your club name..."
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="clubCampus" className="block text-sm font-medium text-foreground">
                    Campus *
                  </label>
                  <select
                    id="clubCampus"
                    value={clubCampus}
                    onChange={(e) => setClubCampus(e.target.value)}
                    required
                    className="w-full h-11 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background"
                  >
                    <option value="">Select a campus...</option>
                    {campusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="clubDescription" className="block text-sm font-medium text-foreground">
                  Club Description *
                </label>
                <textarea
                  id="clubDescription"
                  value={clubDescription}
                  onChange={(e) => setClubDescription(e.target.value)}
                  required
                  maxLength={500}
                  rows={4}
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background resize-none"
                  placeholder="Describe your club's purpose, activities, and goals..."
                />
                <p className="text-sm text-muted-foreground text-right">{clubDescription.length}/500 characters</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="clubDepartment" className="block text-sm font-medium text-foreground">
                  Department *
                </label>
              <select
                id="clubDepartment"
                value={clubDepartment}
                onChange={(e) => setClubDepartment(e.target.value)}
                required
                className="w-full h-11 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background"
              >
                <option value="">Select a department</option>
                <option value="Computer, Math, & Stats">Computer, Math, & Stats</option>
                <option value="Engineering">Engineering</option>
                <option value="Business/Managament">Business/Managament</option>
                <option value="Health & Medicine">Health & Medicine</option>
                <option value="Law">Law</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Design Team">Design Team</option>
                <option value="Other">Other</option>
              </select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="clubImage" className="block text-sm font-medium text-foreground">
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
                    className="w-full h-11 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="clubInstagram" className="block text-sm font-medium text-foreground">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    id="clubInstagram"
                    value={clubInstagram}
                    onChange={(e) => setClubInstagram(e.target.value)}
                    maxLength={100}
                    className="w-full h-11 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background"
                    placeholder="@yourclubname"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !clubName.trim() || !clubCampus || !clubDescription.trim()}
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                      Submitting Request...
                    </div>
                  ) : (
                    "Submit Club Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-xl border border-border p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground mb-2">My Club Requests</h2>
              <p className="text-muted-foreground">Track the status of your submitted club registration requests.</p>
            </div>

            {loadingPending ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                <span className="ml-3 text-muted-foreground">Loading your requests...</span>
              </div>
            ) : pendingClubs.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-foreground mb-2">No requests found</h3>
                <p className="text-muted-foreground mb-6">You haven't submitted any club requests yet.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Submit Your First Request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingClubs.map((club) => (
                  <div key={club.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{club.club_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{club.club_campus}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        club.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                        club.status === 'approved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {club.status.charAt(0).toUpperCase() + club.status.slice(1)}
                      </span>
                    </div>

                    <p className="text-muted-foreground mb-4">{club.club_description}</p>
                    <p className="text-muted-foreground mb-4">{club.club_department}</p>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span>
                        Submitted {club.created_at ? new Date(club.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                      {club.club_instagram && (
                        <span>{club.club_instagram}</span>
                      )}
                    </div>

                    {club.message && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-foreground">
                          <strong>Admin Message:</strong> {club.message}
                        </p>
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