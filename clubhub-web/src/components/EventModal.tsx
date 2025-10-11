"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { CalendarEvent } from "@/model/types"

interface EventFormData {
  title: string
  description: string
  datetime: string
  location: string
  postId?: string
}

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: EventFormData) => Promise<void>
  event?: CalendarEvent | null
  mode: "add" | "edit"
  selectedDate?: Date
}

export default function EventModal({ isOpen, onClose, onSubmit, event, mode, selectedDate }: EventModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    datetime: "",
    location: "",
    postId: "",
  })

  // Reset form when modal opens/closes or when editing event changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && event) {
        // Combine date and startTime for editing
        const datetime = event.startTime 
          ? `${event.date}T${event.startTime}`
          : event.date;
        setFormData({
          title: event.title,
          description: event.description || "",
          datetime: datetime,
          location: event.location || "",
          postId: event.postId || "",
        })
      } else {
        // Add mode
        const initialDate = selectedDate ? selectedDate.toISOString().slice(0, 16) : "";
        setFormData({
          title: "",
          description: "",
          datetime: initialDate,
          location: "",
          postId: "",
        })
      }
    }
  }, [isOpen, mode, event, selectedDate])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.datetime) return

    try {
      // Split datetime into date and startTime
      const [date, time] = formData.datetime.split("T");
      const submitData = {
        title: formData.title,
        description: formData.description,
        date: date,
        startTime: time || undefined,
        location: formData.location,
        postId: formData.postId || undefined,
      };
      await onSubmit(submitData as any)
      onClose()
    } catch (error) {
      console.error("Error submitting event:", error)
    }
  }

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      datetime: "",
      location: "",
      postId: "",
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl my-8 max-h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex justify-between items-center p-6 pb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">
            {mode === "add" ? "Create New Event" : "Edit Event"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-accent/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 px-6 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Event Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-all"
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-all resize-none"
              rows={4}
              placeholder="Add event description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Date & Time *</label>
            <input
              type="datetime-local"
              value={formData.datetime}
              onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-all [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-all"
              placeholder="Add location (optional)"
            />
          </div>
          </div>

          <div className="flex gap-3 p-6 mt-4 border-t border-border/50 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-accent/50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              {mode === "add" ? "Create Event" : "Update Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 