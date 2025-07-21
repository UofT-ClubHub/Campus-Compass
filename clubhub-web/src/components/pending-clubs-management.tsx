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
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 sm:mb-0">Pending Club Requests</h2>
        
        <div className="flex items-center gap-4">
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="p-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-card"
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
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg mb-4">
          {successMessage}
        </div>
      )}

      {pendingClubs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-lg">No pending club requests found.</p>
          {campusFilter && (
            <p className="text-muted-foreground/60 text-sm mt-2">Try changing the campus filter or refresh the page.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {pendingClubs.map((pendingClub) => {
            const requestingUser = userDetails[pendingClub.user];
            const isProcessing = processingIds.has(pendingClub.id);
            
            return (
              <div key={pendingClub.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                      <h3 className="text-lg font-semibold text-foreground">{pendingClub.club_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded">{pendingClub.club_campus}</span>
                        <span>•</span>
                        <span>{formatDate(pendingClub.created_at)}</span>
                      </div>
                    </div>
                    
                    <p className="text-foreground mb-3">{pendingClub.club_description}</p>
                    
                    <div className="text-sm text-muted-foreground">
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
                      className="px-4 py-2 bg-success text-primary-foreground rounded-lg hover:bg-success/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isProcessing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      data-testid="reject-button"
                      onClick={() => handleAction(pendingClub.id, 'reject')}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors font-medium"
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