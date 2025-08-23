"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown, ChevronUp, Calendar, MapPin, Building, AlertCircle, CheckCircle, Clock, Users } from "lucide-react"

interface Position {
  positionId: string
  title: string
  description: string
  requirements?: string[]
  deadline?: string
  date_posted?: string
  status?: "open" | "closed"
  questions?: Record<string, string | { question: string; type: string }>
  clubId: string
  clubName: string
  clubCampus: string
  clubDepartment: string
}

interface PositionCardProps {
  position: Position
}

export default function PositionCard({ position }: PositionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (questionKey: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [questionKey]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Implement application submission API call
      console.log("Submitting application:", {
        positionId: position.positionId,
        clubId: position.clubId,
        answers: formData,
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      alert("Application submitted successfully!")
      setFormData({})
      setIsExpanded(false)
    } catch (error) {
      alert("Error submitting application")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const isDeadlinePassed = position.deadline && new Date(position.deadline) < new Date()
  const actualStatus = isDeadlinePassed ? "closed" : position.status || "open"
  const canApply = actualStatus === "open" && !isDeadlinePassed
  const isRecentlyClosed = position.status === "open" && isDeadlinePassed

  return (
    <div className="group relative mb-6 max-w-5xl mx-auto">
      <div className="bg-card/30 backdrop-blur-xl rounded-lg shadow-lg border border-white/20 overflow-hidden form-glow transition-all duration-300 hover:shadow-3xl hover:border-white/30 dark:hover:border-border/80 hover:bg-white/15 dark:hover:bg-card/90">
        <div className="relative group-hover:pb-12 transition-all duration-300">
          <div
            className="p-6 cursor-pointer transition-all duration-300 hover:bg-white/5 dark:hover:bg-muted/20 backdrop-blur-sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2 leading-tight transition-colors duration-200">
                      {position.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                        <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">{position.clubName}</span>
                      </div>
                      <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-muted-foreground rounded-full" />
                      <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                        <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{position.clubCampus}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 backdrop-blur-sm ${
                      actualStatus === "open"
                        ? "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/40 shadow-lg shadow-green-500/20"
                        : "bg-red-500/20 text-red-700 dark:text-destructive border border-red-500/40 shadow-lg shadow-red-500/20"
                    }`}
                  >
                    {actualStatus === "open" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {actualStatus === "open" ? "Open" : "Closed"}
                    {isRecentlyClosed && <span className="ml-1 text-xs opacity-80">(Recently Closed)</span>}
                  </div>
                </div>

                <p className="text-gray-700 dark:text-card-foreground/90 text-base leading-relaxed line-clamp-2">{position.description}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                  {position.date_posted && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Posted {formatDate(position.date_posted)}</span>
                    </div>
                  )}
                  {position.deadline && (
                    <div className={`flex items-center gap-2 ${isDeadlinePassed ? "text-red-600 dark:text-destructive" : "text-blue-600 dark:text-accent"}`}>
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Deadline: {formatDate(position.deadline)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>{position.clubDepartment}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {isExpanded && (
            <div 
              className="px-4 pb-4 pt-2 border-t border-border bg-background"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-foreground mb-4 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 dark:bg-accent rounded-full" />
                    Position Details
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-400 dark:from-gray-600 dark:dark:from-border to-transparent"></div>
                  </h4>

                  {position.requirements && position.requirements.length > 0 && (
                    <div className="bg-white/20 dark:bg-card/50 dark:dark:bg-card/50 dark:bg-gray-50/80 rounded-xl p-5 border border-white/30 dark:border-gray-200/60 dark:dark:border-border/30 shadow-lg backdrop-blur-sm">
                      <h5 className="font-semibold text-gray-900 dark:text-foreground mb-4 text-lg">Requirements</h5>
                      <ul className="space-y-3">
                        {position.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-card-foreground/90 text-base">
                            <div className="w-2 h-2 bg-blue-600 dark:bg-accent rounded-full mt-2 flex-shrink-0" />
                            <span className="leading-relaxed">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {canApply ? (
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-foreground mb-4 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-green-600 dark:bg-primary rounded-full" />
                      Application Form
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-400 dark:from-gray-600 dark:dark:from-border to-transparent"></div>
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {position.questions &&
                        Object.entries(position.questions).map(([questionKey, questionData]) => {
                          const questionText =
                            typeof questionData === "string"
                              ? questionData
                              : (questionData as { question: string; type: string }).question || "Question"
                          const questionType =
                            typeof questionData === "object" && questionData !== null
                              ? (questionData as { question: string; type: string }).type || "text"
                              : "text"

                          return (
                            <div key={questionKey} className="space-y-3">
                              <label className="block text-gray-900 dark:text-foreground font-semibold text-lg">{questionText}</label>
                              <p className="text-gray-600 dark:text-muted-foreground text-sm">Type: {questionType}</p>
                              <textarea
                                value={formData[questionKey] || ""}
                                onChange={(e) => handleInputChange(questionKey, e.target.value)}
                                className="w-full p-4 bg-white/50 dark:bg-input border border-white/40 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ring focus:border-blue-500 dark:focus:border-ring text-gray-900 dark:text-foreground placeholder-gray-500 dark:placeholder-muted-foreground resize-vertical min-h-[120px] transition-all duration-300 text-base backdrop-blur-sm shadow-sm"
                                placeholder="Enter your response..."
                                required
                              />
                            </div>
                          )
                        })}

                      <div className="flex gap-4 pt-6">
                        <button
                          type="submit"
                          disabled={isSubmitting || !position.questions || Object.keys(position.questions).length === 0}
                          className="group/submit relative px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-[1.02] disabled:transform-none text-sm backdrop-blur-md border border-blue-400/40 hover:border-blue-300/60 disabled:border-gray-400/30 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover/submit:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/submit:left-[100%] transition-all duration-700"></div>
                          <span className="relative flex items-center gap-2 font-bold tracking-wide">
                            {isSubmitting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="animate-pulse">Submitting...</span>
                              </>
                            ) : (
                              "Submit Application"
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({})
                            setIsExpanded(false)
                          }}
                          className="group/btn relative px-8 py-3 bg-white/10 hover:bg-white/20 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl font-semibold transition-all duration-300 text-base backdrop-blur-md border border-white/20 hover:border-white/40 dark:border-gray-600/30 dark:hover:border-gray-500/50 shadow-md hover:shadow-lg overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                          <span className="relative">Cancel</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <AlertCircle className="w-10 h-10 text-red-600 dark:text-destructive" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-foreground mb-3">
                        {actualStatus === "closed" && isRecentlyClosed
                          ? "Position Recently Closed"
                          : actualStatus === "closed" && isDeadlinePassed
                            ? "Application Deadline Passed"
                            : "Position Closed"}
                      </h4>
                      <p className="text-gray-600 dark:text-card-foreground/80 text-base leading-relaxed max-w-md mx-auto">
                        {actualStatus === "closed" && isRecentlyClosed
                          ? "This position was recently closed due to the deadline passing."
                          : actualStatus === "closed" && isDeadlinePassed
                            ? "The deadline for this position has passed."
                            : "This position is no longer accepting applications."}
                      </p>
                      {position.deadline && (
                        <p className="text-gray-500 dark:text-muted-foreground mt-3 text-sm">
                          Deadline was: {formatDate(position.deadline)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!isExpanded && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="group/app-btn relative px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white font-semibold flex items-center gap-2 transition-all duration-300 cursor-pointer shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 focus:outline-none backdrop-blur-sm border border-blue-400/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent opacity-0 group-hover/app-btn:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/20 animate-pulse"></div>
              <span className="relative text-sm font-bold tracking-wide">Application Form</span>
              <ChevronDown className="relative w-4 h-4 text-white group-hover/app-btn:animate-bounce" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
