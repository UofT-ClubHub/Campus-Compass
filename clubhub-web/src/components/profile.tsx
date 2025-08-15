"use client"

import type React from "react"
import { useState } from "react"
import { X, User as UserIcon, Mail, MapPin, Save } from "lucide-react"
import type { User } from "@/model/types"

interface ProfileProps {
  opened: boolean
  onClose: () => void
  user: User
  token?: string
  onUserUpdate: (updatedUser: any) => void
}

export const Profile = ({ opened, onClose, user, token, onUserUpdate }: ProfileProps) => {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    campus: user.campus || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

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
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error)
      }

      const updatedUser: User = await response.json()
      onUserUpdate(updatedUser)
      onClose()
    } catch (err: any) {
      setError(err.message || "An error occurred while updating your profile.")
    } finally {
      setLoading(false)
    }
  }

  if (!opened) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <UserIcon size={20} />
            Edit Profile
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <UserIcon size={16} />
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin size={16} />
              Campus
            </label>
            <select
              value={formData.campus}
              onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-foreground"
              disabled={loading}
            >
              <option value="" className="text-muted-foreground">Select your campus</option>
              <option value="UTSC" className="text-foreground">UTSC</option>
              <option value="UTSG" className="text-foreground">UTSG</option>
              <option value="UTM" className="text-foreground">UTM</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
