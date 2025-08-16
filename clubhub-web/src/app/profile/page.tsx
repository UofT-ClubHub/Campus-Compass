"use client";

import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Mail, MapPin, Users, Heart, Star, Settings } from 'lucide-react';
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
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthUser(user);
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    useEffect(() => { 
        if (authLoading || !authUser) return;

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

    const handleSettingsClick = () => {
        setSettings(!settings);
    };

    const handleUserUpdate = (updatedUser: User) => {
        setUserData(updatedUser)
    }

    if (authLoading || isLoading) {
        return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading your profile...</p>
            </div>
        </div>
        )
    }

    return (
        <div className="min-h-screen bg-theme-gradient bg-animated-elements relative">
            {/* Animated background elements */}
            {Array.from({ length: 12 }, (_, i) => (
                <div
                    key={i}
                    className={`element-${i + 1}`}
                    style={{
                        position: 'absolute',
                        borderRadius: '50%',
                        filter: 'blur(48px)',
                        willChange: 'opacity, transform',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                    }}
                />
            ))}
            
            <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 max-w-6xl pt-20">
                {/* Profile Header Card */}
                <div className="mb-8 bg-card/30 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 form-glow">
                    <div className="flex flex-col lg:flex-row items-start gap-8">
                        <div className="flex-1 space-y-6">
                            {/* Name and Title */}
                            <div className="space-y-2 text-center">
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                    {userData ? userData.name : "No Name Provided"}
                                </h1>
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground justify-center">
                                <div className="flex items-center gap-3 bg-muted/30 rounded-full px-4 py-2">
                                    <Mail size={18} className="text-primary" />
                                    <span className="text-sm font-medium">{userData?.email?.trim() || "No Email Provided"}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-muted/30 rounded-full px-4 py-2">
                                    <MapPin size={18} className="text-primary" />
                                    <span className="text-sm font-medium">{userData?.campus?.trim() || "No Campus Provided"}</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-25 to-blue-50 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Users size={20} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                            {userData ? userData.followed_clubs.length : "0"}
                                        </p>
                                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">Clubs Following</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-rose-25 to-rose-50 dark:from-rose-950/30 dark:to-rose-900/30 rounded-xl border border-rose-100 dark:border-rose-800/50">
                                    <div className="p-2 bg-rose-500/10 rounded-lg">
                                        <Heart size={20} className="text-rose-600 dark:text-rose-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                                            {userData ? userData.liked_posts.length : "0"}
                                        </p>
                                        <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium">Posts Liked</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-25 to-amber-50 dark:from-amber-950/30 dark:to-amber-900/30 rounded-xl border border-amber-100 dark:border-amber-800/50">
                                    <div className="p-2 bg-amber-500/10 rounded-lg">
                                        <Star size={20} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                                            {userData ? userData.managed_clubs.length : "0"}
                                        </p>
                                        <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">Clubs Managed</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings Button */}
                        <button
                            onClick={handleSettingsClick}
                            className="group p-4 bg-muted/50 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all duration-200 rounded-xl cursor-pointer hover:scale-105"
                        >
                            <Settings size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Followed Clubs Section */}
                <div className="bg-card/30 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8 form-glow">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Users size={24} className="text-primary" />
                            </div>
                            Followed Clubs
                            <span className="text-lg font-normal text-muted-foreground">
                                ({userData ? userData.followed_clubs.length : "0"})
                            </span>
                        </h2>
                    </div>

                    {followedClubs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {followedClubs.map((club) => (
                                <Link key={club.id} href={`/clubPage/${club.id}`} className="group block">
                                    <div className="h-full p-6 bg-card border border-border rounded-lg hover:border-border/80 transition-all duration-200 hover:shadow-sm">
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={club.image || "/default-club-image.png"}
                                                    alt={club.name}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-2">
                                                <h3 className="font-semibold text-foreground group-hover:text-foreground/80 transition-colors truncate">
                                                    {club.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{club.description}</p>
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
                        <div className="text-center py-12">
                            <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
                                <Users size={32} className="text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-lg">No clubs followed yet</p>
                            <p className="text-sm text-muted-foreground/80 mt-1">Start following clubs to see them here</p>
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
