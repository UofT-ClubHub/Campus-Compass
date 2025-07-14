"use client"

import { useState, useEffect, type FormEvent } from "react";
import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import type { User, Club, Post } from "@/model/types";
import { useRouter } from "next/navigation";
import { ExpandablePostCard } from "@/components/expandable-post-card";

export default function ExecPage() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const [userData, setUserData] = useState<User | null>(null);
  const [managedClubs, setManagedClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [showAddExecForm, setShowAddExecForm] = useState<string | null>(null);
  const [newExecEmail, setNewExecEmail] = useState("");
  const [showEditClubForm, setShowEditClubForm] = useState<string | null>(null);
  const [editingClub, setEditingClub] = useState<Partial<Club>>({});
  const [showCreatePostForm, setShowCreatePostForm] = useState<string | null>(null);
  const [executiveDetailsMap, setExecutiveDetailsMap] = useState<Map<string, User[]>>(new Map());
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [deletingClubId, setDeletingClubId] = useState<string | null>(null);
  
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
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push("/auth");
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users?id=${authUser.uid}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }
        const user: User = await response.json();
        setUserData(user); 
        
        if (!user.is_executive && !user.is_admin) {
          setError("Access Denied: You are not an exec.");
          setIsLoading(false);
          return;
        }

        if (user.managed_clubs && user.managed_clubs.length > 0) {
          const clubsDataPromises = user.managed_clubs.map(async (clubId: string) => {
            const clubResponse = await fetch(`/api/clubs?id=${clubId}`);
            if (!clubResponse.ok) {
              return null;
            }
            return clubResponse.json();
          });
          const clubsResults = await Promise.all(clubsDataPromises);
          setManagedClubs(clubsResults.filter((club) => club !== null) as Club[]);
        }
      } catch (err: any) {
        setError(err.successMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [authUser, authLoading, router]);

  useEffect(() => {
    const fetchExecutiveDetails = async () => {
      if (managedClubs.length === 0) {
        setExecutiveDetailsMap(new Map());
        return;
      }

      const newExecDetailsMap = new Map<string, User[]>();
      await Promise.all(
        managedClubs.map(async (club) => {
          if (club.id && club.executives && club.executives.length > 0) {
            const execDetailsPromises = club.executives.map(async (execId) => {
              try {
                const response = await fetch(`/api/users?id=${execId}`);
                if (!response.ok) {
                  return null;
                }
                const execUser = await response.json() as User;
                return execUser;
              } catch (error) {
                return null;
              }
            });
            const resolvedExecs = (await Promise.all(execDetailsPromises)).filter(
              (exec) => exec !== null,
            ) as User[];
            if (resolvedExecs.length > 0) {
              newExecDetailsMap.set(club.id, resolvedExecs);
            }
          }
        }),
      );
      setExecutiveDetailsMap(newExecDetailsMap);
    };

    if (managedClubs.length > 0) {
      fetchExecutiveDetails();
    }
  }, [managedClubs]);

  const handleImageUploadInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPendingImageFile(e.target.files[0]);
    }
  };

  const uploadImageToBackend = async (file: File, folder: string = 'clubs', clubId: string): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Please log in to upload images');
    }

    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('clubId', clubId);
    formData.append('originalImageUrl', clubId);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error);
    }

    const data = await response.json();
    // Image uploaded successfully
    return data.downloadURL;
  };

  const handleAddExecutive = async (e: FormEvent, clubId: string) => {
    e.preventDefault();
    if (!newExecEmail) {
      setError("Please enter an email.");
      return;
    }

    try {
      const userResponse = await fetch(`/api/users?email=${encodeURIComponent(newExecEmail)}`);
      if (!userResponse.ok) {
        setError("Failed to fetch user data.");
        return;
      }
      const users = await userResponse.json();
      if (!users || users.length === 0) {
        setError("User not found with the provided email.");
        return;
      }
      const execUser = users[0] as User;

      const updatedManagedClubs = Array.isArray(execUser.managed_clubs) ? [...execUser.managed_clubs] : [];
      if (!updatedManagedClubs.includes(clubId)) {
        updatedManagedClubs.push(clubId);
      }

      const updateUserPayload = {
        id: execUser.id,
        is_executive: true,
        managed_clubs: updatedManagedClubs,
      };

      const idToken = await authUser?.getIdToken();
      const updateUserResponse = await fetch(`/api/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(updateUserPayload),
      });

      if (!updateUserResponse.ok) {
        setError("Failed to update user as executive.");
        return;
      }

      // Refresh the managed clubs data to get updated executive information
      const updatedUser = await updateUserResponse.json();
      
      // Refresh the clubs data to show the new executive
      const clubsDataPromises = managedClubs.map(async (club) => {
        const clubResponse = await fetch(`/api/clubs?id=${club.id}`);
        if (!clubResponse.ok) {
          return club;
        }
        return clubResponse.json();
      });
      const updatedClubs = await Promise.all(clubsDataPromises);
      setManagedClubs(updatedClubs.filter((club) => club !== null) as Club[]);

      setNewExecEmail("");
      setShowAddExecForm(null);
      setSuccessMessage("Executive added successfully!");
    } catch (err: any) {
      console.log("Error adding executive:", err);
      setError(`Error: ${err.message}`);
    }
  }

  const handleEditClubInfo = async (e: FormEvent, clubId: string) => {
    e.preventDefault()
    if (!editingClub.name || !editingClub.description || !editingClub.campus) {
      setSuccessMessage("Name, description, and campus are required.")
      return
    }

    try {
      let imageUrl = editingClub.image;
      if (pendingImageFile) {
        imageUrl = await uploadImageToBackend(pendingImageFile, 'clubs', clubId);
      }

      const idToken = await authUser?.getIdToken();
      const response = await fetch(`/api/clubs?id=${clubId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json",
                   Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ ...editingClub, image: imageUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData)
      }

      const updatedClub = await response.json()

      // Update local state
      setManagedClubs(prevClubs =>
        prevClubs.map(club => (club.id === clubId ? { ...club, ...updatedClub } : club))
      )
      setShowEditClubForm(null)
      setEditingClub({})
      setPendingImageFile(null)
      setSuccessMessage("Club information updated successfully!")
    } catch (err: any) {
      console.log("Error editing club info:", err)
      setSuccessMessage(`Error: ${err.successMessage}`)
    }
  }

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    const confirmMessage = `Are you sure you want to delete "${clubName}"? Type "DELETE" to confirm:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation !== "DELETE") {
      return;
    }

    setDeletingClubId(clubId);
    setError(null);
    setSuccessMessage(null);

    try {
      const idToken = await authUser?.getIdToken();
      const response = await fetch(`/api/clubs?id=${clubId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      // Remove the club from local state
      setManagedClubs(prevClubs => prevClubs.filter(club => club.id !== clubId));
      
      // Clear any open forms for this club
      if (showAddExecForm === clubId) setShowAddExecForm(null);
      if (showEditClubForm === clubId) setShowEditClubForm(null);
      if (showCreatePostForm === clubId) setShowCreatePostForm(null);
      
      setSuccessMessage(`"${clubName}" has been deleted successfully.`);
    } catch (err: any) {
      console.log("Error deleting club:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setDeletingClubId(null);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 mb-3">Access Denied</h2>
          <p className="text-red-500">Access Denied: You are not an exec.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">        <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Executive Dashboard</h1>
        <p className="text-slate-600 text-lg mb-2">
          Welcome, <span className="text-blue-600 font-semibold">{userData?.name || "User"}</span>
        </p>
        <div className="inline-block bg-slate-200 px-4 py-1 rounded-full text-sm font-medium text-slate-700">
          Managing {managedClubs.length} {managedClubs.length === 1 ? "Club" : "Clubs"}
        </div>
      </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {successMessage && (
          <div
            className={`p-4 mb-4 text-sm rounded-lg ${"bg-green-100 text-green-700"}`}
            role="alert"
          >
            {successMessage}
          </div>
        )}

        {/* Clubs list */}
        {managedClubs.length > 0 ? (
          <div className="space-y-4">
            {managedClubs.map((club: Club) => (
              <div
                key={club.id}
                className="bg-white rounded-lg shadow-lg shadow-blue-500/20 border border-blue-100/30 overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center p-2 md:p-4 gap-2 md:gap-4">
                  <div className="flex-shrink-0">
                    {club.image ? (
                      <img
                        src={club.image}
                        alt={`${club.name} image`}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0 w-full md:w-auto">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{club.name}</h3>
                      <span className="ml-2 inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded shrink-0">
                        {club.campus}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-2 line-clamp-1">{club.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        <strong>{club.followers}</strong> followers
                      </span>
                      {club.instagram && <span>{club.instagram}</span>}
                      {club.executives && club.executives.length > 0 && (
                        <span>
                          <strong>{club.executives.length}</strong> executives
                        </span>
                      )}
                      {club.links && club.links.length > 0 && (
                        <span>
                          <strong>{club.links.length}</strong> links
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-wrap gap-2 mt-2 md:mt-0 w-full md:w-auto justify-start md:ml-auto">
                    <button
                      onClick={() => setShowAddExecForm(showAddExecForm === club.id ? null : club.id)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      {showAddExecForm === club.id ? "Cancel" : "Add Exec"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingClub({
                          name: club.name,
                          description: club.description,
                          campus: club.campus,
                          instagram: club.instagram,
                        })
                        setShowEditClubForm(showEditClubForm === club.id ? null : club.id)
                      }}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      {showEditClubForm === club.id ? "Cancel" : "Edit"}
                    </button>
                    <button
                      onClick={() => setShowCreatePostForm(showCreatePostForm === club.id ? null : club.id)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      {showCreatePostForm === club.id ? "Cancel" : "Post"}
                    </button>
                    <button
                      onClick={() => handleDeleteClub(club.id, club.name)}
                      disabled={deletingClubId === club.id}
                      className="px-3 py-1.5 border border-red-300 text-red-700 rounded text-sm font-medium hover:bg-red-50 disabled:bg-red-100 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingClubId === club.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>

                {(club.executives && club.executives.length > 0) || (club.links && club.links.length > 0) ? (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {club.executives && club.executives.length > 0 && (
                        <div>
                          <p className="font-medium text-slate-600 mb-1">Executives:</p>
                          <div className="flex flex-wrap gap-2">
                            {executiveDetailsMap.get(club.id)
                              ? executiveDetailsMap.get(club.id)!.map((execUser, index) => (
                                <div
                                  key={execUser.id || index}
                                  className="bg-slate-100 text-slate-700 p-2 rounded shadow-sm min-w-[150px]"
                                >
                                  <p className="text-sm font-semibold truncate" title={execUser.name}>
                                    {execUser.name || "N/A"}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate" title={execUser.email}>
                                    {execUser.email || "N/A"}
                                  </p>
                                </div>
                              ))
                              : club.executives.map((execId, index) => ( // Show placeholders if details not yet fetched
                                <div
                                  key={execId || index}
                                  className="bg-slate-100 p-2 rounded shadow-sm min-w-[150px] animate-pulse"
                                >
                                  <div className="h-4 bg-slate-200 rounded w-20 mb-1"></div>
                                  <div className="h-3 bg-slate-200 rounded w-28"></div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {club.links && club.links.length > 0 && (
                        <div>
                          <p className="font-medium text-slate-600 mb-1">Links:</p>
                          <div className="space-y-1">
                            {club.links.slice(0, 3).map((link, index) => (
                              <a
                                key={index}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-500 hover:text-blue-600 truncate text-xs"
                              >
                                {link}
                              </a>
                            ))}
                            {club.links.length > 3 && (
                              <p className="text-xs text-slate-500">+{club.links.length - 3} more links</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Add executive form */}
                {showAddExecForm === club.id && (
                  <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <form onSubmit={(e) => handleAddExecutive(e, club.id)} className="max-w-md">
                      <h4 className="font-medium mb-2 text-slate-700">Add New Executive</h4>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newExecEmail}
                          onChange={(e) => setNewExecEmail(e.target.value)}
                          placeholder="Executive's email"
                          required
                          className="flex-1 p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent text-slate-800"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-500 text-white rounded text-sm font-medium hover:bg-purple-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Edit club form */}
                {showEditClubForm === club.id && (
                  <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <form onSubmit={(e) => handleEditClubInfo(e, club.id)}>
                      <h4 className="font-medium mb-3 text-slate-700">Edit Club Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Name:</label>
                          <input
                            type="text"
                            value={editingClub.name || ""}
                            onChange={(e) => setEditingClub((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Campus:</label>
                          <select
                            value={editingClub.campus || ""}
                            onChange={(e) => setEditingClub((prev) => ({ ...prev, campus: e.target.value }))}
                            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent text-slate-800 bg-transparent"
                          >
                            <option value="">Select Campus</option>
                            {campusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Instagram:</label>
                          <input
                            type="text"
                            value={editingClub.instagram || ""}
                            onChange={(e) => setEditingClub((prev) => ({ ...prev, instagram: e.target.value }))}
                            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Description:</label>
                        <textarea
                          value={editingClub.description || ""}
                          onChange={(e) => setEditingClub((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent text-slate-800"
                          rows={2}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Image:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUploadInput}
                          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent text-slate-800"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-500 text-white rounded text-sm font-medium hover:bg-amber-600 transition-colors"
                      >
                        Save Changes
                      </button>
                    </form>
                  </div>
                )}

                {/* Create post form - REMOVED */}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            </div>
            <h2 className="text-lg font-semibold text-slate-600 mb-1">No Clubs to Manage</h2>
            <p className="text-slate-500 text-sm">You don't manage any clubs yet or the data is still loading.</p>
          </div>
        )}

        {showCreatePostForm && (() => {
          const clubForPost = managedClubs.find(c => c.id === showCreatePostForm);
          if (!clubForPost) return null;

          const initialPostForCreation: Post = {
            id: '',
            title: '',
            details: '',
            club: clubForPost.id,
            campus: '', // Default to empty string so user must select
            category: '',
            date_posted: new Date().toISOString(),
            date_occuring: '',
            image: '',
            likes: 0,
            hashtags: [],
            links: [],
          };

          return (
            <ExpandablePostCard
              isCreating={true}
              post={initialPostForCreation}
              currentUser={userData}
              onClose={() => setShowCreatePostForm(null)}
              onSave={(savedPost: Post) => {
                setSuccessMessage("Post created successfully!");
                setShowCreatePostForm(null);
              }}
              onSaveError={(error: string) => {
                setError(error);
                setShowCreatePostForm(null);
              }}
            />
          );
        })()}
      </div>
    </div>
  )
}
