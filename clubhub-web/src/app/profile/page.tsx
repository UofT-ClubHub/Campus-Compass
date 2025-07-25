"use client";

import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { use, useEffect, useState } from 'react';
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
        <div className="min-h-screen bg-background pt-20">
            <div className="container mx-auto px-6 py-8">
                <div className="mb-6 bg-card border-2 border-border rounded-lg shadow-sm p-8">
                    <div className="flex items-start gap-8">
                        <div className="flex-1 space-y-4">
                            
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold text-foreground">
                                    {userData ? userData.name : "No Name Provided"}
                                </h1>
                            </div>
                            
                            <div className="flex gap-6 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} />
                                    <span className="text-sm">{userData?.email?.trim() || "No Email Provided"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    <span className="text-sm">{userData?.campus?.trim() || "No Campus Provided"}</span>
                                </div>
                            </div>

                            <div className="flex gap-6 mt-6">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">{userData ? userData.followed_clubs.length : "0"} Clubs Following</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Heart size={16} className="text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">{userData ? userData.liked_posts.length : "0"} Posts Liked</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Star size={16} className="text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">{userData ? userData.managed_clubs.length : "0"} Clubs Managed</span>
                                </div>
                            </div>
                        
                        </div>

                        <button 
                            onClick={handleSettingsClick}
                            className="p-3 border-2 border-border hover:bg-accent transition-colors rounded-lg cursor-pointer"
                        >
                            <Settings size={20} className="text-foreground" /> 
                        </button>

                    </div>

                </div>

                <div className="bg-card border-2 border-border rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-6 text-foreground">
                        Followed Clubs ({userData ? userData.followed_clubs.length : "0"})
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {followedClubs.map((club) => (
                            <Link
                                key={club.id}
                                href={`/clubPage/${club.id}`}
                                className="flex gap-3 p-4 border-2 border-border bg-club-card-bg rounded-lg hover:bg-club-card-bg/30 transition-colors cursor-pointer"
                            >
                                <div className="flex gap-3">
                                    <img 
                                        src={club.image || '/default-club-image.png'} 
                                        alt={club.name}
                                        className="w-25 h-25 rounded-lg object-cover flex-shrink-0"
                                    />
                                    <div className="space-y-3 flex-1">
                                        <h3 className="font-medium text-foreground">{club.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">{club.followers} followers</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>

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
