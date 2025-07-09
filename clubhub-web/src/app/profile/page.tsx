"use client";

import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { use, useEffect, useState } from 'react';
import { Card, Stack, Group, Text, ActionIcon, Grid } from '@mantine/core';
import { Mail, MapPin, Users, Heart, Star, Settings } from 'lucide-react';
import { Profile } from '../../../components/profile';
import type { User, Club } from "@/model/types";

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
                const response = await fetch(`/api/users?id=${authUser.uid}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.successMessage);
                }
                const user: User = await response.json();
                setUserData(user);
                const token = await authUser.getIdToken();
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

    useEffect(() => { //REMOVE THIS LATER
        console.log("Followed Clubs:", followedClubs);
    }, [followedClubs]);

    const handleSettingsClick = () => {
        setSettings(!settings);
    };

    const handleUserUpdate = (updatedUser: User) => {
        setUserData(updatedUser)
    }

    if (authLoading || isLoading) {
        return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 font-medium">Loading your profile...</p>
            </div>
        </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-6 py-8">
                <Card shadow="sm" padding="xl" radius="md" withBorder className="mb-6">
                    <Group align="flex-start" gap="xl">
                        <Stack gap="sm" className="flex-1">
                            
                            <Group align="center" gap="md">
                                <Text size="xl" fw={700}>
                                    {userData ? userData.name : "No Name Provided"}
                                </Text>
                            </Group>
                            
                            <Group gap="md" c="dimmed">
                                <Group gap="xs">
                                    <Mail size={16} />
                                    <Text size="sm">{userData?.email?.trim() || "No Email Provided"}</Text>
                                </Group>
                                <Group gap="xs">
                                    <MapPin size={16} />
                                    <Text size="sm">{userData?.campus?.trim() || "No Campus Provided"}</Text>
                                </Group>
                            </Group>

                            <Text size="sm" c="dimmed" className="max-w-2xl">{userData?.bio?.trim() || "No Bio Provided"}</Text>

                            <Group gap="md" mt="md">
                                <Group gap="xs">
                                    <Users size={16} />
                                    <Text size="sm" fw={500}>{userData ? userData.followed_clubs.length : "0"} Clubs Following</Text>
                                </Group>

                                <Group gap="xs">
                                    <Heart size={16} />
                                    <Text size="sm" fw={500}>{userData ? userData.liked_posts.length : "0"} Posts Liked</Text>
                                </Group>

                                <Group gap="xs">
                                    <Star size={16} />
                                    <Text size="sm" fw={500}>{userData ? userData.managed_clubs.length : "0"} Clubs Managed</Text>
                                </Group>
                            </Group>
                        
                        </Stack>

                        <ActionIcon variant="outline" size="lg" onClick={handleSettingsClick} style={{ cursor: 'pointer' }}>
                            <Settings size={20} /> 
                        </ActionIcon>

                    </Group>

                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Text size="lg" fw={600} mb="md">
                        Followed Clubs ({userData ? userData.followed_clubs.length : "0"})
                    </Text>
                    
                    <Grid>
                        {followedClubs.map((club) => (
                            <Grid.Col key={club.id} span={{ base: 12, sm: 6, md: 4 }}>
                                <Card shadow="xs" padding="md" radius="md" withBorder className="h-full">
                                    <Stack gap="sm">
                                        <Text fw={500}>{club.name}</Text>
                                        <Text size="sm" c="dimmed" className="line-clamp-2">{club.description}</Text>
                                        <Group justify="space-between" align="center">
                                            <Text size="xs" c="dimmed">{club.followers} followers</Text>
                                        </Group>
                                    </Stack>
                                </Card>
                            </Grid.Col>
                        ))}
                    </Grid>

                </Card>

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
