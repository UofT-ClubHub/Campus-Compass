"use client"

import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User, Club, Post } from "@/model/types";
import { useRouter } from "next/navigation";

export default function ExecPage() {
  const { user: authUser, loading: authLoading } = useAuth();
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
  const [newPost, setNewPost] = useState<Partial<Post>>({ title: "", details: "" });
  const [hashtagsInput, setHashtagsInput] = useState("");
  const [linksInput, setLinksInput] = useState("");
  const [executiveDetailsMap, setExecutiveDetailsMap] = useState<Map<string, User[]>>(new Map());
  
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
          throw new Error(errorData.successMessage);
        }
        const user: User = await response.json();
        setUserData(user); if (!user.is_executive) {
          setError("Access Denied: You are not an executive!");
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
  const handleAddExecutive = async (e: FormEvent, clubId: string) => {
    e.preventDefault();
    if (!newExecEmail) {
      setSuccessMessage("Please enter an email.");
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
      const execUser = users[0] as User; const updatedManagedClubs = Array.isArray(execUser.managed_clubs) ? [...execUser.managed_clubs] : [];
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

      const clubToUpdate = managedClubs.find(club => club.id === clubId);
      if (!clubToUpdate) {
        setError("Club not found.");
        return;
      }
      const updatedExecutives = Array.isArray(clubToUpdate.executives) ? [...clubToUpdate.executives] : [];
      if (!updatedExecutives.includes(execUser.id)) {
        updatedExecutives.push(execUser.id);
      }

      const updateClubResponse = await fetch(`/api/clubs?id=${clubId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executives: updatedExecutives }),
      })

      if (!updateClubResponse.ok) {
        const errorData = await updateClubResponse.json()
        // Revert user update if club update fails
        const revertUserPayload = {
          id: execUser.id,
          is_executive: execUser.is_executive, // original state
          managed_clubs: execUser.managed_clubs, // original state
        }
        await fetch(`/api/users`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(revertUserPayload),
        })
        setError(`Failed to update club executives: ${errorData.successMessage}`);
        return;
      }

      // Update local state
      setManagedClubs(prevClubs =>
        prevClubs.map(club =>
          club.id === clubId ? { ...club, executives: updatedExecutives } : club
        )
      )
      // Add new executive to the details map
      setExecutiveDetailsMap(prevMap => {
        const newMap = new Map(prevMap)
        const currentExecs = newMap.get(clubId) || []
        if (!currentExecs.find(ex => ex.id === execUser.id)) {
          newMap.set(clubId, [...currentExecs, execUser])
        }
        return newMap;
      })
      setNewExecEmail("")
      setShowAddExecForm(null)
      setSuccessMessage("Executive added successfully!")
    } catch (err: any) {
      console.error("Error adding executive:", err)
      setSuccessMessage(`Error: ${err.successMessage}`)
    }
  }

  const handleEditClubInfo = async (e: FormEvent, clubId: string) => {
    e.preventDefault()
    if (!editingClub.name || !editingClub.description || !editingClub.campus) {
      setSuccessMessage("Name, description, and campus are required.")
      return
    }

    try {
      const response = await fetch(`/api/clubs?id=${clubId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingClub),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.successMessage || "Failed to update club info.")
      }

      const updatedClub = await response.json()

      // Update local state
      setManagedClubs(prevClubs =>
        prevClubs.map(club => (club.id === clubId ? { ...club, ...updatedClub } : club))
      )
      setShowEditClubForm(null)
      setEditingClub({})
      setSuccessMessage("Club information updated successfully!")
    } catch (err: any) {
      console.error("Error editing club info:", err)
      setSuccessMessage(`Error: ${err.successMessage}`)
    }
  }
  const handleCreatePost = async (e: FormEvent, clubId: string) => {
    e.preventDefault()
    const club = managedClubs.find(c => c.id === clubId)
    if (!club) {
      setError("Club not found.")
      return
    }

    if (!newPost.title || !newPost.details || !newPost.category) {
      setError("Title, details, and category are required for a post.")
      return
    }

    // Prepare the post data with all required fields
    const postData = {
      title: newPost.title,
      details: newPost.details,
      category: newPost.category,
      club: club.name,
      campus: club.campus,
      date_posted: new Date().toISOString(),
      likes: 0,
      date_occuring: newPost.date_occuring ? new Date(newPost.date_occuring).toISOString() : new Date().toISOString(),
      hashtags: newPost.hashtags || [],
      image: newPost.image || "",
      links: newPost.links || [],
    }

    console.log("Sending post data:", postData) // Debug log

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || "Failed to create post.")
      }
      
      // Reset form and close
      setNewPost({ title: "", details: "", category: "" })
      setHashtagsInput("")
      setLinksInput("")
      setShowCreatePostForm(null)
      setSuccessMessage("Post created successfully!")

    } catch (err: any) {
      setError(`Error creating post: ${err.message}`)
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
                      {club.instagram && <span>@{club.instagram}</span>}
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
                          <input
                            type="text"
                            value={editingClub.campus || ""}
                            onChange={(e) => setEditingClub((prev) => ({ ...prev, campus: e.target.value }))}
                            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent text-slate-800"
                          />
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
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-500 text-white rounded text-sm font-medium hover:bg-amber-600 transition-colors"
                      >
                        Save Changes
                      </button>
                    </form>
                  </div>
                )}

                {/* Create post form */}
                {showCreatePostForm === club.id && (
                  <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <form onSubmit={(e) => handleCreatePost(e, club.id)}>
                      <h4 className="font-medium mb-3 text-slate-700">Create New Post for {club.name}</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Post Title:</label>
                          <input
                            type="text"
                            value={newPost.title || ""}
                            onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                            required
                            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Category:</label>
                          <input
                            type="text"
                            value={newPost.category || ""}
                            onChange={(e) => setNewPost((prev) => ({ ...prev, category: e.target.value }))}
                            required
                            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Post Details:</label>
                        <textarea
                          value={newPost.details || ""}
                          onChange={(e) => setNewPost((prev) => ({ ...prev, details: e.target.value }))}
                          required
                          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent text-slate-800"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Hashtags (comma-separated):</label>
                          <input
                            type="text"
                            value={hashtagsInput}
                            onChange={(e) => {
                              setHashtagsInput(e.target.value);
                              setNewPost((prev) => ({
                                ...prev,
                                hashtags: e.target.value
                                  .split(",")
                                  .map((tag) => tag.trim())
                                  .filter((tag) => tag.length > 0),
                              }));
                            }}
                            placeholder="tag1, tag2, tag3"
                            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Date:</label>
                          <input
                            type="datetime-local"
                            value={newPost.date_occuring || ""}
                            onChange={(e) => setNewPost((prev) => ({ ...prev, date_occuring: e.target.value }))}
                            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Image URL:</label>
                          <input
                            type="url"
                            value={newPost.image || ""}
                            onChange={(e) => setNewPost((prev) => ({ ...prev, image: e.target.value }))}
                            placeholder="https://example.com/image.jpg"
                            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Links (comma-separated):</label>
                          <input
                          type="text"
                          value={linksInput}
                          onChange={(e) => {
                            setLinksInput(e.target.value);
                            setNewPost((prev) => ({
                            ...prev,
                            links: e.target.value
                              .split(",")
                              .map((link) => link.trim())
                              .filter((link) => link.length > 0),
                            }));
                          }}
                          placeholder="https://link1.com, https://link2.com"
                          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent text-slate-800"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-500 text-white rounded text-sm font-medium hover:bg-teal-600 transition-colors"
                      >
                        Create Post
                      </button>
                    </form>
                  </div>
                )}
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
      </div>
    </div>
  )
}
