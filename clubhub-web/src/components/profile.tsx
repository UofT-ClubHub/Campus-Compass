"use client";

import { useState } from "react";
import type { User } from "@/model/types";

interface UserSettingsModalProps {
  opened: boolean
  onClose: () => void
  user: User
  token?: string
  onUserUpdate: (updatedUser: User) => void
}

export function Profile({ opened, onClose, user, token, onUserUpdate}: UserSettingsModalProps) {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        campus: user.campus,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const campusOptions = [
        { value: 'UTSG', label: 'UTSG' },
        { value: 'UTSC', label: 'UTSC' },
        { value: 'UTM', label: 'UTM' }
    ];
    
    const handleCancel = () => {
        setFormData({
            name: user.name,
            email: user.email,
            campus: user.campus,
        });
        setError(null);
        setSuccess(false);
        onClose();  
    }

    const handleInput = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
        setError(null);
        setSuccess(false);
    }

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: user.id,
                    ...formData
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }

            const updatedUser: User = await response.json();
            onUserUpdate(updatedUser);
            setSuccess(true);
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred while updating your profile.");
        } finally {
            setLoading(false);
        }
    }

    if (!opened) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={!loading ? handleCancel : undefined}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-background border-2 border-border rounded-lg shadow-xl form-glow">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground">Profile Settings</h2>
                    <button
                        onClick={!loading ? handleCancel : undefined}
                        disabled={loading}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-white/20"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                            <p className="text-success text-sm">Profile updated successfully!</p>
                        </div>
                    )}

                    {/* Name Field */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-foreground">
                            Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Enter your name"
                            value={formData.name}
                            onChange={(e) => handleInput('name', e.target.value)}
                            disabled={loading}
                            required
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Campus Field */}
                    <div className="space-y-2">
                        <label htmlFor="campus" className="block text-sm font-medium text-foreground">
                            Campus
                        </label>
                        <select
                            id="campus"
                            value={formData.campus}
                            onChange={(e) => handleInput('campus', e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">Select your campus</option>
                            {campusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-border">
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-4 py-2 border border-border text-foreground bg-background hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !formData.name.trim()}
                        className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                        )}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}