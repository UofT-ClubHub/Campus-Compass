'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/model/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { PendingClub, User } from '@/model/types';
import React from "react";

export default function PendingClubsManagement() {
  const [user] = useAuthState(auth);
  const [pendingClubs, setPendingClubs] = useState<PendingClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [campusFilter, setCampusFilter] = useState('');
  const [userDetails, setUserDetails] = useState<{ [key: string]: User }>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const campusOptions = [
    { value: 'UTSG', label: 'UTSG' },
    { value: 'UTSC', label: 'UTSC' },
    { value: 'UTM', label: 'UTM' }
  ];

  const fetchPendingClubs = useCallback(async () => {
    if (!user) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (campusFilter) params.append('campus', campusFilter);
      
      const response = await fetch(`/api/pending-clubs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      
      const data = await response.json();
      setPendingClubs(data);
      
      // Fetch user details for each pending club
      const userIds = [...new Set(data.map((club: PendingClub) => club.user))];
      const userDetailsPromises = userIds.map(async (userId) => {
        try {
          const userResponse = await fetch(`/api/users?id=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            return { [userId as string]: userData };
          }
        } catch (err) {
          console.error(`Failed to fetch user ${userId}:`, err);
        }
        return { [userId as string]: null };
      });
      
      const resolvedUserDetails = await Promise.all(userDetailsPromises);
      const userDetailsMap = resolvedUserDetails.reduce((acc, userDetail) => ({ ...acc, ...userDetail }), {});
      setUserDetails(userDetailsMap);
      
    } catch (err: any) {
      setError(err.message);
      setPendingClubs([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, campusFilter]);

  useEffect(() => {
    if (user) {
      fetchPendingClubs();
    }
  }, [user, fetchPendingClubs]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleAction = async (pendingClubId: string, action: 'approve' | 'reject') => {
    if (!user) return;
    
    setProcessingIds(prev => new Set(prev).add(pendingClubId));
    setError(null);
    setSuccessMessage(null);
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/pending-clubs?id=${pendingClubId}&action=${action}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      
      const data = await response.json();
      setSuccessMessage(data.response);
      
      // Refresh the list
      await fetchPendingClubs();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(pendingClubId);
        return newSet;
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    let date;
    if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 sm:mb-0">Pending Club Requests</h2>
        
        <div className="flex items-center gap-4">
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 bg-white"
          >
            <option value="">All Campuses</option>
            {campusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => fetchPendingClubs()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

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

      {pendingClubs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 text-lg">No pending club requests found.</p>
          {campusFilter && (
            <p className="text-slate-400 text-sm mt-2">Try changing the campus filter or refresh the page.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {pendingClubs.map((pendingClub) => {
            const requestingUser = userDetails[pendingClub.user];
            const isProcessing = processingIds.has(pendingClub.id);
            
            return (
              <div key={pendingClub.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                      <h3 className="text-lg font-semibold text-slate-800">{pendingClub.club_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded">{pendingClub.club_campus}</span>
                        <span>•</span>
                        <span>{formatDate(pendingClub.created_at)}</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 mb-3">{pendingClub.club_description}</p>
                    
                    <div className="text-sm text-slate-500">
                      <span className="font-medium">Requested by:</span>{' '}
                      {requestingUser ? (
                        <>
                          {requestingUser.name} ({requestingUser.email})
                        </>
                      ) : (
                        'Loading user details...'
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 lg:ml-4">
                    <button
                      data-testid="approve-button"
                      onClick={() => handleAction(pendingClub.id, 'approve')}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isProcessing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      data-testid="reject-button"
                      onClick={() => handleAction(pendingClub.id, 'reject')}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isProcessing ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}