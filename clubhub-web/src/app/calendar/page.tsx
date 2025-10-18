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
  // Add mobile view state
  const [isMobileView, setIsMobileView] = useState(false)

  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    checkMobileView()
    window.addEventListener('resize', checkMobileView)
    
    return () => window.removeEventListener('resize', checkMobileView)
  }, [])

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
    if (authLoading) return
    
    if (!authUser) {
      setIsLoading(false)
      return
    }

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
        startTime: formData.startTime || undefined,
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
      <div className="flex justify-center items-center min-h-screen bg-theme-gradient bg-animated-elements">
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
      <div className="min-h-screen bg-theme-gradient bg-animated-elements">
        <div className="container mx-auto px-6 py-8 pt-20">
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
    <div className="min-h-screen overflow-x-hidden bg-theme-gradient bg-animated-elements">
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-7xl relative z-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">My Calendar</h1>
            <p className="text-muted-foreground text-sm sm:text-lg">Organize your schedule and never miss an important event</p>
          </div>
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-105 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Plus size={18} className="sm:hidden" />
            <Plus size={20} className="hidden sm:block" />
            New Event
          </button>
        </div>

        <div className="flex items-center justify-between mb-2 sm:mb-4 bg-card border border-border rounded-2xl p-2 sm:p-3 shadow-sm">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 hover:bg-accent/50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <ChevronLeft size={18} className="text-foreground sm:hidden" />
            <ChevronLeft size={20} className="text-foreground hidden sm:block" />
          </button>
          <h2 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight text-center">
            {isMobileView ? 
              `${monthNames[currentMonth.getMonth()].slice(0, 3)} ${currentMonth.getFullYear()}` :
              `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
            }
          </h2>
          <button
            onClick={() => navigateMonth("next")}
            className="p-2 hover:bg-accent/50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <ChevronRight size={18} className="text-foreground sm:hidden" />
            <ChevronRight size={20} className="text-foreground hidden sm:block" />
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-4 sm:mb-8 relative z-10">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-accent/30 border-b border-border">
            {dayNames.map((day) => (
              <div key={day} className="p-2 sm:p-4 text-center font-semibold text-foreground text-xs sm:text-sm uppercase tracking-wide">
                {isMobileView ? day.slice(0, 1) : day}
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
                  className={`min-h-[80px] sm:min-h-[125px] p-1 sm:p-2 border-r border-b border-border/50 relative z-10 transition-all duration-200 ${
                    !date ? "bg-muted/20" : "hover:bg-accent/20 cursor-pointer"
                  } ${date && isToday(date) ? "bg-primary/5 border-primary/20" : ""} ${date && isSelectedDate(date) ? "bg-primary/10 border-primary/30" : ""}`}
                  onClick={() => date && setSelectedDate(date)}
                >
                  {date && (
                    <>
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className={`text-sm sm:text-lg font-semibold ${isToday(date) ? "text-primary" : "text-foreground"}`}>
                          {date.getDate()}
                        </div>
                      </div>

                      {dayEvents.length > 0 && (
                        <div className="space-y-0.5 sm:space-y-1">
                          {/* Show first event as preview - mobile gets dot, desktop gets full preview */}
                          {isMobileView ? (
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${dayEvents[0].postDeleted ? 'bg-red-600' : 'bg-primary'}`}></div>
                              {dayEvents.length > 1 && (
                                <span className="text-xs text-muted-foreground font-medium">
                                  {dayEvents.length}
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className={`text-xs p-2 rounded-lg font-medium truncate border ${
                                dayEvents[0].postDeleted 
                                  ? 'bg-red-500/20 text-red-700 border-red-500' 
                                  : 'bg-primary/10 text-primary border-primary/20'
                              }`}>
                                {dayEvents[0].title}
                              </div>
                              {/* Show count if more events */}
                              {dayEvents.length > 1 && (
                                <div className="text-xs text-muted-foreground font-medium">
                                  +{dayEvents.length - 1} more event{dayEvents.length > 2 ? "s" : ""}
                                </div>
                              )}
                            </>
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
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-8 shadow-sm relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: isMobileView ? "short" : "long",
                    year: "numeric",
                    month: isMobileView ? "short" : "long",
                    day: "numeric",
                  })}
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {getEventsForDate(selectedDate).length} event{getEventsForDate(selectedDate).length !== 1 ? "s" : ""}{" "}
                  scheduled
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {getEventsForDate(selectedDate).length > 0 ? (
                  <button
                    onClick={() => toggleDropdown(selectedDate.toISOString().split("T")[0])}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-md bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 text-sm sm:text-base w-full sm:w-auto justify-center"
                  >
                    <MoreHorizontal size={16} />
                    {openDropdowns.has(selectedDate.toISOString().split("T")[0]) ? "Hide Events" : "Show Events"}
                  </button>
                ) : (
                  <button
                    onClick={() => openAddModal(selectedDate)}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm sm:text-base w-full sm:w-auto justify-center"
                  >
                    <Plus size={16} />
                    Add Event
                  </button>
                )}
              </div>
            </div>

            {getEventsForDate(selectedDate).length === 0 ? null : (
              openDropdowns.has(selectedDate.toISOString().split("T")[0]) && (
                <div className="grid gap-3 sm:gap-4 w-full max-w-full">
                  {getEventsForDate(selectedDate).map((event) => {
                    const isClickable = event.postId && !event.postDeleted;
                    const cardClassName = `flex flex-col sm:flex-row justify-between items-start p-4 sm:p-6 border border-primary/20 rounded-2xl bg-card/80 backdrop-blur-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 group gap-3 sm:gap-0 w-full max-w-full overflow-hidden ${
                      isClickable ? 'cursor-pointer' : ''
                    }`;
                    
                    const cardContent = (
                      <>
                        <div className="flex-1 w-full min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 min-w-0">
                            <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-gradient-to-r from-primary to-accent shadow-sm"></div>
                            <h4 className="font-semibold text-foreground text-base sm:text-lg truncate sm:whitespace-normal sm:break-words max-w-full">{event.title}</h4>
                          </div>

                          {event.description && (
                            <p className="text-muted-foreground mb-3 sm:mb-4 leading-relaxed bg-muted/30 p-2.5 sm:p-3 rounded-lg border border-border/50 text-sm sm:text-base truncate sm:whitespace-normal sm:break-words max-w-full">
                              {event.description}
                            </p>
                          )}

                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground min-w-0">
                            {event.startTime && (
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="sm:hidden" />
                                <Clock size={16} className="hidden sm:block" />
                                <span>
                                  {event.startTime}
                                </span>
                              </div>
                            )}

                            {event.location && (
                              <div className="flex items-center gap-2 min-w-0 max-w-full">
                                <MapPin size={14} className="sm:hidden" />
                                <MapPin size={16} className="hidden sm:block" />
                                <span className="truncate block">{event.location}</span>
                              </div>
                            )}
                          </div>
                          
                          {event.postId && event.postDeleted && (
                            <div className="mt-3 sm:mt-4">
                              <span className="inline-flex items-center px-3 py-2 text-xs sm:text-sm rounded-lg bg-red-500/20 text-red-700 border border-red-500">
                                Original Post Deleted
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto justify-end items-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openEditModal(event);
                            }}
                            className="p-2.5 sm:p-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl transition-all duration-200 flex-1 sm:flex-none"
                          >
                            <Edit size={16} className="sm:hidden mx-auto" />
                            <Edit size={18} className="hidden sm:block" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            className="p-2.5 sm:p-3 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex-1 sm:flex-none"
                          >
                            <Trash2 size={16} className="sm:hidden mx-auto" />
                            <Trash2 size={18} className="hidden sm:block" />
                          </button>
                        </div>
                      </>
                    );

                    return isClickable ? (
                      <Link
                        key={event.id}
                        href={`/postFilter/postPage/${event.postId}`}
                        className={cardClassName}
                      >
                        {cardContent}
                      </Link>
                    ) : (
                      <div key={event.id} className={cardClassName}>
                        {cardContent}
                      </div>
                    );
                  })}
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
