"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { CalendarEvent } from "@/model/types"

interface EventFormData {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  isAllDay: boolean
  location: string
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
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    isAllDay: false,
    location: "",
  })

  // Reset form when modal opens/closes or when editing event changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && event) {
        setFormData({
          title: event.title,
          description: event.description || "",
          date: event.date,
          startTime: event.startTime || "",
          endTime: event.endTime || "",
          isAllDay: event.isAllDay,
          location: event.location || "",
        })
      } else {
        // Add mode
        setFormData({
          title: "",
          description: "",
          date: selectedDate ? selectedDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          startTime: "",
          endTime: "",
          isAllDay: false,
          location: "",
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
    if (!formData.title || !formData.date) return

    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error("Error submitting event:", error)
    }
  }

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      isAllDay: false,
      location: "",
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Event Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              rows={2}
              placeholder="Add event description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
            <input
              type="checkbox"
              id="isAllDay"
              checked={formData.isAllDay}
              onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
              className="w-5 h-5 rounded border-border"
            />
            <label htmlFor="isAllDay" className="text-foreground font-medium">
              All day event
            </label>
          </div>

          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Start Time</label>
                                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">End Time</label>
                                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Add location (optional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
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