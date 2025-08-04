'use client';

import { useEffect, useState, useCallback } from 'react';
import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import type { User, Club } from '@/model/types';
import PendingClubsManagement from '@/components/pending-clubs-management';

export default function AdminPage() {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const router = useRouter();
    const [currentUserData, setCurrentUserData] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');
    const [campusFilter, setCampusFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [editIsAdmin, setEditIsAdmin] = useState(false);
    const [editIsExecutive, setEditIsExecutive] = useState(false);
    const [editManagedClubs, setEditManagedClubs] = useState<string[]>([]);
    const [managedClubDetails, setManagedClubDetails] = useState<Array<{ id: string; name: string }>>([]);

    const [clubSearchTerm, setClubSearchTerm] = useState('');
    const [searchedClubs, setSearchedClubs] = useState<Club[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const campusOptions = [
        { value: 'UTSG', label: 'UTSG' },
        { value: 'UTSC', label: 'UTSC' },
        { value: 'UTM', label: 'UTM' }
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthUser(user);
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Fetch current user's full data to check for is_admin
    useEffect(() => {
        const fetchCurrentUserData = async () => {
            if (authUser) {
                try {
                    const token = await authUser.getIdToken();
                    const response = await fetch(`/api/users?id=${authUser.uid}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch user data');
                    }
                    const userData = await response.json();
                    setCurrentUserData(userData);
                    if (!userData.is_admin) {
                        setError("Access Denied: You are not an admin!")
                        setIsLoading(false)
                        return
                    }
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (!authLoading && authUser) {
            fetchCurrentUserData();
        } else if (!authLoading && !authUser) {
            router.push('/auth');
        }
    }, [authUser, authLoading, router]);

    // Fetch all users initially and when user data is loaded
    useEffect(() => {
        const fetchAllUsers = async () => {
            if (!authUser || !currentUserData?.is_admin) return;
            try {
                const token = await authUser.getIdToken();
                const response = await fetch('/api/users', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch users');
                const data = await response.json();
                setAllUsers(data);
            } catch (err: any) {
                setError(err.message);
            }
        };

        if (currentUserData?.is_admin) {
            fetchAllUsers();
        }
    }, [authUser, currentUserData]);

    const fetchFilteredUsers = useCallback(async (name: string, email: string, campus: string) => {
        if (!authUser) return;
        setError(null);
        try {
            const params = new URLSearchParams();
            if (name.trim()) params.append('name', name);
            if (email.trim()) params.append('email', email);
            if (campus.trim()) params.append('campus', campus);

            const token = await authUser.getIdToken();
            const response = await fetch(`/api/users?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setAllUsers(data);
        } catch (err: any) {
            setError(err.message);
            setAllUsers([]);
        }
    }, [authUser]);

    // Debounced user search using useEffect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (nameFilter || emailFilter || campusFilter) {
                fetchFilteredUsers(nameFilter, emailFilter, campusFilter);
            } else if (currentUserData?.is_admin) {
                fetchFilteredUsers('', '', '');
            }
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [nameFilter, emailFilter, campusFilter, fetchFilteredUsers, currentUserData]);

    const fetchClubs = useCallback(async (query: string) => {
        if (!query.trim() || !authUser) return;
        setError(null);
        try {
            const token = await authUser.getIdToken();
            const response = await fetch(`/api/clubs?name=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch clubs');
            const data = await response.json();
            
            // Filter out clubs that the user already manages
            const filteredClubs = data.filter((club: Club) => !editManagedClubs.includes(club.id));
            setSearchedClubs(filteredClubs);
        } catch (err: any) {
            setError(err.message);
            setSearchedClubs([]);
        }
    }, [authUser, editManagedClubs]);

    // Debounced club search using useEffect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (clubSearchTerm) {
                fetchClubs(clubSearchTerm);
            } else {
                setSearchedClubs([]);
            }
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [clubSearchTerm, fetchClubs]);

    useEffect(() => {
        const fetchClubNames = async () => {
            if (!authUser || !editManagedClubs || editManagedClubs.length === 0) {
                setManagedClubDetails([]);
                return;
            }
            // Ensure authUser.getIdToken is available
            if (typeof authUser.getIdToken !== 'function') {
                setManagedClubDetails(editManagedClubs.map(id => ({ id, name: `ID: ${id} (Loading...)` })));
                return;
            }

            try {
                const token = await authUser.getIdToken();
                const clubDetailsPromises = editManagedClubs.map(async (clubId) => {
                    const response = await fetch(`/api/clubs?id=${clubId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (!response.ok) {
                        return { id: clubId, name: `ID: ${clubId} (Error loading name)` };
                    }
                    const clubData: Club = await response.json();
                    return { id: clubData.id, name: clubData.name || `ID: ${clubData.id} (Name not found)` };
                });
                const resolvedClubDetails = await Promise.all(clubDetailsPromises);
                setManagedClubDetails(resolvedClubDetails);
            } catch (err) {
                setManagedClubDetails(editManagedClubs.map(id => ({ id, name: `ID: ${id} (Error)` })));
            }
        };

        if (isEditing && selectedUser) {
            fetchClubNames();
        } else {
            setManagedClubDetails([]);
        }
    }, [editManagedClubs, isEditing, selectedUser, authUser]);

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setEditIsAdmin(user.is_admin);
        setEditIsExecutive(user.is_executive);
        setEditManagedClubs(user.managed_clubs || []);
        setIsEditing(true);
        setError(null);
        setSuccessMessage(null);
    };    

    const handleUpdateUser = async () => {
        if (!selectedUser || !authUser) return;
        setError(null);
        setSuccessMessage(null);
        try {
            const token = await authUser.getIdToken();
            
            // Update the user data - backend will handle club updates automatically
            const payload: any = {
                id: selectedUser.id,
                is_admin: editIsAdmin,
                is_executive: editIsExecutive,
                managed_clubs: editIsExecutive ? editManagedClubs : [],
            };

            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }
            const updatedUser = await response.json();

            setSelectedUser(updatedUser);
            setSuccessMessage('User updated successfully!');
            setIsEditing(false);
            // Refresh the users list to show updated data
            if (currentUserData?.is_admin) {
                fetchFilteredUsers(nameFilter, emailFilter, campusFilter);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleAddClubToManaged = (clubIdToAdd: string) => {
        if (!selectedUser) {
            setError("User details are missing for this action.");
            return;
        }
        setError(null);
        setSuccessMessage(null);

        // Update the UI for the user's managed clubs list in the form
        setEditManagedClubs(prevClubs => [...prevClubs, clubIdToAdd]);
        setClubSearchTerm('');
        setSearchedClubs([]);
    }; 
    
    const handleRemoveClubFromManaged = (clubIdToRemove: string) => {
        if (!selectedUser) {
            setError("User details are missing for this action.");
            return;
        }
        setError(null);
        setSuccessMessage(null);

        // Update the UI for the user's managed clubs list in the form
        setEditManagedClubs(prevClubs => prevClubs.filter(id => id !== clubIdToRemove));
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-muted-foreground font-medium">Loading admin panel...</p>
                </div>
            </div>
        )
    } 
    
    if (!currentUserData?.is_admin && !isLoading && !authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background">
                <div className="bg-card p-6 rounded-lg shadow-md max-w-md w-full border border-border">
                    <h2 className="text-xl font-semibold text-destructive mb-3">Access Denied</h2>
                    <p className="text-destructive">Access Denied: You are not an admin.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-6">
            <div className="max-w-5xl mx-auto">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
                    <p className="text-muted-foreground text-lg mb-2">
                        Welcome, <span className="text-primary font-semibold">{currentUserData?.name || currentUserData?.email}</span>
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {successMessage && (
                    <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg mb-6">
                        {successMessage}
                    </div>)}

                <section className="mb-8">
                    <PendingClubsManagement />
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Search Users</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Filter by name..."
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                        />
                        <input
                            type="text"
                            placeholder="Filter by email..."
                            value={emailFilter}
                            onChange={(e) => setEmailFilter(e.target.value)}
                            className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                        />
                        <select
                            value={campusFilter}
                            onChange={(e) => setCampusFilter(e.target.value)}
                            className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
                        >
                            <option value="">All Campuses</option>
                            {campusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {allUsers.length > 0 && (
                        <div className="bg-card border border-border rounded-lg shadow-sm max-h-96 overflow-y-auto">
                            {allUsers.map((user: User) => (
                                <div
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className={`p-3 border-b border-border last:border-b-0 cursor-pointer transition-colors ${
                                        selectedUser?.id === user.id 
                                            ? 'bg-primary/10 border-primary/20 ring-1 ring-primary/20' 
                                            : 'hover:bg-muted'
                                    }`}
                                >
                                    <span className="font-medium text-foreground">{user.name || ""}</span>
                                    <span className="text-muted-foreground"> ({user.email})</span>
                                    <span className="text-muted-foreground"> - Campus: {user.campus || ""}</span>
                                    {selectedUser?.id === user.id && (
                                        <span className="ml-2 inline-block bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                            Selected
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                </section>

                {isEditing && selectedUser && (
                    <section className="bg-card rounded-lg shadow-sm p-6 border border-border">
                        <h2 className="text-xl font-semibold text-foreground mb-6">Edit User: {selectedUser.name || selectedUser.email}</h2>                        <div className="mb-4">
                            <label className="flex items-center text-foreground">
                                <input
                                    type="checkbox"
                                    checked={editIsAdmin}
                                    onChange={(e) => setEditIsAdmin(e.target.checked)}
                                    disabled={true}
                                    className="mr-3 h-4 w-4 text-primary focus:ring-ring border-border rounded opacity-50 cursor-not-allowed"
                                />
                                Is Admin (Read-only)
                            </label>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center text-foreground">
                                <input
                                    type="checkbox"
                                    checked={editIsExecutive}
                                    onChange={(e) => setEditIsExecutive(e.target.checked)}
                                    className="mr-3 h-4 w-4 text-primary focus:ring-ring border-border rounded"
                                />
                                Is Executive
                            </label>
                        </div>            <div className="mb-6">
                            <h3 className="text-lg font-medium text-foreground mb-3">Managed Clubs</h3>
                            <input
                                type="text"
                                placeholder="Search clubs to add..."
                                value={clubSearchTerm}
                                onChange={(e) => setClubSearchTerm(e.target.value)}
                                className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground mb-3"
                            />
                            {searchedClubs.length > 0 && (
                                <div className="bg-card border border-border rounded-lg shadow-sm max-h-40 overflow-y-auto">
                                    {searchedClubs.map(club => (
                                        <div
                                            key={club.id}
                                            onClick={() => handleAddClubToManaged(club.id)}
                                            className="p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted transition-colors"
                                        >
                                            <span className="font-medium text-foreground">{club.name}</span>
                                            <span className="text-muted-foreground"> (ID: {club.id})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Current Managed Clubs:</p>
                                {managedClubDetails.length > 0 ? (
                                    <div className="space-y-2">
                                        {managedClubDetails.map(clubDetail => (
                                            <div key={clubDetail.id} className="flex items-center justify-between p-2 bg-muted rounded border border-border">
                                                <span className="text-foreground">{clubDetail.name}</span>
                                                <button
                                                    onClick={() => handleRemoveClubFromManaged(clubDetail.id)}
                                                    className="px-3 py-1 bg-destructive text-destructive-foreground text-sm rounded hover:bg-destructive/90 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">{isEditing && selectedUser && editManagedClubs.length > 0 ? 'Loading club names...' : 'No clubs managed.'}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleUpdateUser}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setSelectedUser(null); setError(null); setSuccessMessage(null); }}
                                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
