"use client"

import { auth } from "@/model/firebase"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { useEffect, useState } from "react"
import type { CalendarEvent } from "@/model/types"
import { Calendar, Plus, Edit, Trash2, Clock, MapPin, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import EventModal from "@/components/EventModal"

export default function CalendarPage() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | undefined>(undefined)
  const [showEventModal, setShowEventModal] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())

  // Authentication setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Get auth token and fetch events
  useEffect(() => {
    if (authLoading || !authUser) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const token = await authUser.getIdToken()
        setToken(token)
        await fetchEvents(token)
      } catch (err: any) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [authUser, authLoading])

  const fetchEvents = async (authToken: string) => {
    try {
      const response = await fetch("/api/calendar", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }
      const eventsData: CalendarEvent[] = await response.json()
      setEvents(eventsData)
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const handleEventSubmit = async (formData: any) => {
    if (!token || !formData.title || !formData.date) return

    try {
      const eventData = {
        ...formData,
        date: formData.date,
        startTime: formData.isAllDay ? undefined : formData.startTime,
        endTime: formData.isAllDay ? undefined : formData.endTime,
      }

      if (modalMode === "add") {
        const response = await fetch("/api/calendar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(eventData),
        })

        if (!response.ok) {
          throw new Error("Failed to create event")
        }
      } else {
        // Edit mode
        if (!editingEvent) return
        
        const response = await fetch(`/api/calendar?id=${editingEvent.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(eventData),
        })

        if (!response.ok) {
          throw new Error("Failed to update event")
        }
      }

      await fetchEvents(token)
    } catch (error) {
      console.error("Error submitting event:", error)
      throw error
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!token) return

    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const response = await fetch(`/api/calendar?id=${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to delete event")
      }

      await fetchEvents(token)
    } catch (error) {
      console.error("Error deleting event:", error)
    }
  }

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event)
    setModalMode("edit")
    setShowEventModal(true)
  }

  const openAddModal = (date?: Date) => {
    setEditingEvent(null)
    setModalMode("add")
    setShowEventModal(true)
  }

  const toggleDropdown = (dateString: string) => {
    const newOpenDropdowns = new Set(openDropdowns)
    if (newOpenDropdowns.has(dateString)) {
      newOpenDropdowns.delete(dateString)
    } else {
      newOpenDropdowns.add(dateString)
    }
    setOpenDropdowns(newOpenDropdowns)
  }

  // Calendar grid generation
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return events.filter((event) => event.date === dateString)
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDate = (date: Date | null) => {
    return selectedDate && date && date.toDateString() === selectedDate.toDateString()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin"></div>
            <Calendar className="w-6 h-6 absolute top-3 left-3 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium mt-4">Loading your calendar...</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-4 text-foreground">Welcome to Your Calendar</h1>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Sign in to access your personal calendar and start managing your events with ease.
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                Sign In to Continue
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const calendarDays = getDaysInMonth(currentMonth)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">My Calendar</h1>
            <p className="text-muted-foreground text-lg">Organize your schedule and never miss an important event</p>
          </div>
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-105"
          >
            <Plus size={20} />
            New Event
          </button>
        </div>

        <div className="flex items-center justify-between mb-8 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-3 hover:bg-accent/50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </button>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth("next")}
            className="p-3 hover:bg-accent/50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <ChevronRight size={24} className="text-foreground" />
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-accent/30 border-b border-border">
            {dayNames.map((day) => (
              <div key={day} className="p-4 text-center font-semibold text-foreground text-sm uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const dayEvents = date ? getEventsForDate(date) : []
              const dateString = date ? date.toISOString().split("T")[0] : ""
              const isDropdownOpen = openDropdowns.has(dateString)

              return (
                <div
                  key={index}
                  className={`min-h-[140px] p-3 border-r border-b border-border/50 relative transition-all duration-200 ${
                    !date ? "bg-muted/20" : "hover:bg-accent/20 cursor-pointer"
                  } ${date && isToday(date) ? "bg-primary/5 border-primary/20" : ""} ${date && isSelectedDate(date) ? "bg-primary/10 border-primary/30" : ""}`}
                  onClick={() => date && setSelectedDate(date)}
                >
                  {date && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-lg font-semibold ${isToday(date) ? "text-primary" : "text-foreground"}`}>
                          {date.getDate()}
                        </div>
                      </div>

                      {dayEvents.length > 0 && (
                        <div className="space-y-1">
                          {/* Show first event as preview */}
                          <div className="text-xs p-2 rounded-lg bg-primary/10 text-primary font-medium truncate border border-primary/20">
                            {dayEvents[0].title}
                          </div>

                          {/* Show count if more events */}
                          {dayEvents.length > 1 && (
                            <div className="text-xs text-muted-foreground font-medium">
                              +{dayEvents.length - 1} more event{dayEvents.length > 2 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <p className="text-muted-foreground">
                  {getEventsForDate(selectedDate).length} event{getEventsForDate(selectedDate).length !== 1 ? "s" : ""}{" "}
                  scheduled
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getEventsForDate(selectedDate).length > 0 && (
                  <button
                    onClick={() => toggleDropdown(selectedDate.toISOString().split("T")[0])}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-md bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90"
                  >
                    <MoreHorizontal size={16} />
                    {openDropdowns.has(selectedDate.toISOString().split("T")[0]) ? "Hide Events" : "Show Events"}
                  </button>
                )}
              </div>
            </div>

            {getEventsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground text-lg">No events scheduled for this date</p>
                <p className="text-muted-foreground/70 text-sm mt-2">Click "Add Event" to create your first event</p>
              </div>
            ) : (
              openDropdowns.has(selectedDate.toISOString().split("T")[0]) && (
                <div className="grid gap-4">
                  {getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="flex justify-between items-start p-6 border border-primary/20 rounded-2xl bg-card/80 backdrop-blur-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent shadow-sm"></div>
                          <h4 className="font-semibold text-foreground text-lg">{event.title}</h4>
                        </div>

                        {event.description && (
                          <p className="text-muted-foreground mb-4 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground items-center">
                          {!event.isAllDay && event.startTime && (
                            <div className="flex items-center gap-2">
                              <Clock size={16} />
                              <span>
                                {event.startTime}
                                {event.endTime && ` - ${event.endTime}`}
                              </span>
                            </div>
                          )}

                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={16} />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(event)}
                          className="p-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl transition-all duration-200"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-3 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Event Modal */}
        <EventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onSubmit={handleEventSubmit}
          event={editingEvent}
          mode={modalMode}
          selectedDate={selectedDate || undefined}
        />
      </div>
    </div>
  )
}
