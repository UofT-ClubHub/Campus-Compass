"use client";

import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Mail, MapPin, Users, Heart, Star, Settings, FileText, Building2, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Profile } from '@/components/profile';
import type { User, Club } from "@/model/types";
import Link from 'next/link';

export default function ProfilePage() {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userData, setUserData] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState(false);
    const [token, setToken] = useState<string | undefined>(undefined);
    const [followedClubs, setFollowedClubs] = useState<Club[]>([]);
    const [userApplications, setUserApplications] = useState<any[]>([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());

    const toggleApplicationExpansion = (applicationId: string) => {
        setExpandedApplications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(applicationId)) {
                newSet.delete(applicationId);
            } else {
                newSet.add(applicationId);
            }
            return newSet;
        });
    };
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthUser(user);
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    useEffect(() => { 
        if (authLoading) return;
        
        if (!authUser) {
            setIsLoading(false);
            return;
        }

        const fetchUserData = async () => {
            setIsLoading(true);
            try{
                const token = await authUser.getIdToken();
                const response = await fetch(`/api/users?id=${authUser.uid}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error);
                }
                const user: User = await response.json();
                setUserData(user);
                setToken(token);
            } catch (err: any) {
                console.error("Error fetching user data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();

    }, [authUser, authLoading]);

    useEffect(() => {
        if (!userData || !token) return;

        const fetchFollowedClubs = async () => {
            try{
                const clubFetches = userData.followed_clubs.map(async (clubId) => {
                    const response = await fetch(`/api/clubs?id=${clubId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });
                    if (!response.ok) throw new Error("Failed to fetch club");
                    return await response.json();
                });

                const clubs = await Promise.all(clubFetches);
                setFollowedClubs(clubs);
            }
            catch (err: any) {
                console.error("Error fetching followed clubs:", err);
            }
        }

        fetchFollowedClubs();
    }, [userData, token]);

    // Fetch user applications
    useEffect(() => {
        if (!authUser || !token) return;

        const fetchUserApplications = async () => {
            setApplicationsLoading(true);
            try {
                // Use existing submitted-applications endpoint
                const response = await fetch(`/api/submitted-applications?userId=${authUser.uid}`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch applications');
                }

                const applications = await response.json();

                // Fetch position and club details for each application
                const enrichedApplications = await Promise.all(
                    applications.map(async (app: any) => {
                        try {
                            // Fetch position details
                            const positionResponse = await fetch(`/api/positions?id=${app.clubId}&positionId=${app.positionId}`, {
                                headers: { 
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (positionResponse.ok) {
                                const positionData = await positionResponse.json();
                                return {
                                    ...app,
                                    positionTitle: positionData.position?.title || 'Unknown Position',
                                    clubName: positionData.club?.name || 'Unknown Club'
                                };
                            }
                        } catch (error) {
                            console.error('Error fetching position details for application:', app.id, error);
                        }
                        
                        return {
                            ...app,
                            positionTitle: 'Unknown Position',
                            clubName: 'Unknown Club'
                        };
                    })
                );

                // Sort by submission date (most recent first)
                enrichedApplications.sort((a: any, b: any) => {
                    const dateA = new Date(a.submittedAt).getTime();
                    const dateB = new Date(b.submittedAt).getTime();
                    return dateB - dateA;
                });

                setUserApplications(enrichedApplications);
            } catch (error) {
                console.error('Error fetching user applications:', error);
            } finally {
                setApplicationsLoading(false);
            }
        };

        fetchUserApplications();
    }, [authUser, token]);

    const handleSettingsClick = () => {
        setSettings(!settings);
    };

    const handleUserUpdate = (updatedUser: User) => {
        setUserData(updatedUser)
    }

    if (authLoading || isLoading) {
        return (
        <div className="flex justify-center items-center min-h-screen bg-theme-gradient bg-animated-elements">
            <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading your profile...</p>
            </div>
        </div>
        )
    }

    if (!authUser) {
        return (
            <div className="min-h-screen bg-theme-gradient bg-animated-elements">
                <div className="container mx-auto px-6 py-8 pt-20">
                    <div className="max-w-md mx-auto text-center">
                        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="w-10 h-10 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold mb-4 text-foreground">Welcome to Your Profile</h1>
                            <p className="text-muted-foreground mb-8 leading-relaxed">
                                Sign in to access your profile, view your followed clubs, and manage your applications.
                            </p>
                            <Link
                                href="/auth"
                                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                            >
                                Sign In to Continue
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-theme-gradient bg-animated-elements">
            <div className="absolute inset-0 bg-animated-elements">
                {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className={`element-${i + 1}`}></div>
                ))}
            </div>
            
            <div className="relative z-10 max-w-6xl mx-auto pt-8 pb-8 px-4">
                {/* Profile Header Card */}
                <div className="mb-4 sm:mb-8 bg-card/30 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-4 sm:p-8 form-glow">
                    <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-8">
                        <div className="flex-1 space-y-4 sm:space-y-6 w-full">
                            {/* Name and Title */}
                            <div className="space-y-2 text-center">
                                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                    {userData ? userData.name : "No Name Provided"}
                                </h1>
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-muted-foreground justify-center">
                                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 bg-muted/30 rounded-full px-3 sm:px-4 py-2 text-center">
                                    <Mail size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
                                    <span className="text-xs sm:text-sm font-medium truncate">{userData?.email?.trim() || "No Email Provided"}</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 bg-muted/30 rounded-full px-3 sm:px-4 py-2 text-center">
                                    <MapPin size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
                                    <span className="text-xs sm:text-sm font-medium truncate">{userData?.campus?.trim() || "No Campus Provided"}</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4">
                                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/80 rounded-lg sm:rounded-xl border border-border shadow-sm hover:bg-muted/90 transition-all duration-200" style={{ boxShadow: '0 0 0 1px rgb(59 130 246 / 0.2), 0 0 20px rgb(59 130 246 / 0.1)' }}>
                                    <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg border border-blue-300/30">
                                        <Users size={18} className="text-blue-600 sm:w-5 sm:h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl sm:text-2xl font-bold text-foreground">
                                            {userData ? userData.followed_clubs.length : "0"}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">Clubs Following</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/80 rounded-lg sm:rounded-xl border border-border shadow-sm hover:bg-muted/90 transition-all duration-200" style={{ boxShadow: '0 0 0 1px rgb(236 72 153 / 0.2), 0 0 20px rgb(236 72 153 / 0.1)' }}>
                                    <div className="p-1.5 sm:p-2 bg-pink-500/10 rounded-lg border border-pink-300/30">
                                        <Heart size={18} className="text-pink-600 sm:w-5 sm:h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl sm:text-2xl font-bold text-foreground">
                                            {userData ? userData.liked_posts.length : "0"}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">Posts Liked</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/80 rounded-lg sm:rounded-xl border border-border shadow-sm hover:bg-muted/90 transition-all duration-200" style={{ boxShadow: '0 0 0 1px rgb(245 158 11 / 0.2), 0 0 20px rgb(245 158 11 / 0.1)' }}>
                                    <div className="p-1.5 sm:p-2 bg-amber-500/10 rounded-lg border border-amber-300/30">
                                        <Star size={18} className="text-amber-600 sm:w-5 sm:h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl sm:text-2xl font-bold text-foreground">
                                            {userData ? userData.managed_clubs.length : "0"}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">Clubs Managed</p>
                                    </div>
                                </div>
                            </div>
                        </div>  

                        {/* Settings Button */}
                        <button
                            onClick={handleSettingsClick}
                            className="group p-3 sm:p-4 bg-muted/50 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all duration-200 rounded-lg sm:rounded-xl cursor-pointer hover:scale-105 w-full sm:w-auto flex justify-center lg:block"
                        >
                            <Settings size={20} className="text-muted-foreground group-hover:text-primary transition-colors sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>

                {/* Followed Clubs Section */}
                <div className="bg-card/30 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 form-glow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8 gap-2 sm:gap-0">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                                <Users size={20} className="text-primary sm:w-6 sm:h-6" />
                            </div>
                            Followed Clubs
                            <span className="text-base sm:text-lg font-normal text-muted-foreground">
                                ({userData ? userData.followed_clubs.length : "0"})
                            </span>
                        </h2>
                    </div>

                    {followedClubs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                            {followedClubs.map((club) => (
                                <Link key={club.id} href={`/clubPage/${club.id}`} className="group block">
                                    <div className="h-full p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-border/80 transition-all duration-200 hover:shadow-sm">
                                        <div className="flex gap-3 sm:gap-4">
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={club.image || "/placeholder.jpg"}
                                                    alt={club.name}
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                                                <h3 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-foreground/80 transition-colors truncate">
                                                    {club.name}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">{club.description}</p>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Users size={12} />
                                                    <span>{club.followers}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 sm:py-12">
                            <div className="p-3 sm:p-4 bg-muted/30 rounded-full w-fit mx-auto mb-3 sm:mb-4">
                                <Users size={24} className="text-muted-foreground sm:w-8 sm:h-8" />
                            </div>
                            <p className="text-muted-foreground text-base sm:text-lg">No clubs followed yet</p>
                            <p className="text-sm text-muted-foreground/80 mt-1">Start following clubs to see them here</p>
                        </div>
                    )}
                </div>

                {/* Applications Section */}
                <div className="mt-6 bg-card/30 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 form-glow">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                            <FileText size={20} className="text-primary sm:w-6 sm:h-6" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">My Applications</h2>
                        <span className="text-base sm:text-lg font-normal text-muted-foreground">
                            ({userApplications.length})
                        </span>
                    </div>

                    {applicationsLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : userApplications.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="p-3 sm:p-4 bg-muted/30 rounded-full w-fit mx-auto mb-3 sm:mb-4">
                                <FileText size={24} className="text-muted-foreground sm:w-8 sm:h-8 opacity-50" />
                            </div>
                            <p className="text-muted-foreground text-base sm:text-lg">No applications submitted yet</p>
                            <p className="text-sm text-muted-foreground/80 mt-1">
                                Browse{' '}
                                <Link href="/positionsPage" className="text-primary hover:underline">
                                    open positions
                                </Link>{' '}
                                to get started
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {userApplications.map((application: any) => {
                                const isExpanded = expandedApplications.has(application.id);
                                return (
                                    <div 
                                        key={application.id || `app-${application.clubId}-${application.positionId}`}
                                        className="bg-background/50 rounded-lg border border-border/50 p-4 hover:bg-background/70 transition-all duration-200"
                                    >
                                        <div 
                                            className="flex items-start justify-between cursor-pointer"
                                            onClick={() => toggleApplicationExpansion(application.id)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-foreground">
                                                        {application.positionTitle || 'Unknown Position'}
                                                    </h3>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        application.status === 'pending' 
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                            : application.status === 'accepted'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : application.status === 'rejected'
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                    }`}>
                                                        {application.status || 'Pending'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        <span>{application.clubName || 'Unknown Club'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>Applied {new Date(application.submittedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                {application.deadline && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Deadline: {new Date(application.deadline).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Link to Club */}
                                                <Link
                                                    href={`/clubPage/${application.clubId}`}
                                                    className="px-3 py-1 text-xs bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    View Club
                                                </Link>
                                                {/* Expand/Collapse Button */}
                                                <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Expanded Content */}
                                        {isExpanded && application.answers && (
                                            <div className="mt-4 pt-4 border-t border-border/50">
                                                <h4 className="font-medium text-foreground mb-3">Your Responses:</h4>
                                                <div className="space-y-3">
                                                    {Object.entries(application.answers).map(([question, answer]: [string, any]) => (
                                                        <div key={question} className="bg-background/30 rounded-md p-3">
                                                            <p className="font-medium text-sm text-foreground/80 mb-2">{question}</p>
                                                            <p className="text-sm text-muted-foreground">{answer}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Profile Settings Modal */}
                {userData && (
                    <Profile
                        opened={settings}
                        onClose={() => setSettings(false)}
                        user={userData}
                        token={token}
                        onUserUpdate={handleUserUpdate}
                    />
                )}
            </div>
        </div>
    );
}