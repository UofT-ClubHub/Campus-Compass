'use client';

import { useState } from 'react';
import { auth } from '@/model/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function PendingClubRequestPage() {
  const [user] = useAuthState(auth);
  const [clubName, setClubName] = useState('');
  const [clubCampus, setClubCampus] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Request a New Club</h1>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clubName" className="block text-sm font-medium text-slate-700 mb-2">
              Club Name *
            </label>
            <input
              type="text"
              id="clubName"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              required
              maxLength={100}
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
              placeholder="Enter the club name..."
            />
          </div>

          <div>
            <label htmlFor="clubCampus" className="block text-sm font-medium text-slate-700 mb-2">
              Campus *
            </label>
            <select
              id="clubCampus"
              value={clubCampus}
              onChange={(e) => setClubCampus(e.target.value)}
              required
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 bg-white"
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
            <label htmlFor="clubDescription" className="block text-sm font-medium text-slate-700 mb-2">
              Club Description *
            </label>
            <textarea
              id="clubDescription"
              value={clubDescription}
              onChange={(e) => setClubDescription(e.target.value)}
              required
              maxLength={500}
              rows={4}
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 resize-none"
              placeholder="Describe your club's purpose, activities, and goals..."
            />
            <p className="text-sm text-slate-500 mt-1">
              {clubDescription.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !clubName.trim() || !clubCampus || !clubDescription.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 