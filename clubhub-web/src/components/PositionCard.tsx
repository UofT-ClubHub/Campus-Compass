"use client"

import type React from "react"
import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react"

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
    <div className="group relative">
      <div className="bg-card/80 backdrop-blur-xl rounded-xl shadow-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-3xl hover:border-border/80 hover:bg-card/90">
        <div
          className="p-8 cursor-pointer transition-all duration-300 hover:bg-muted/20"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-2 leading-tight group-hover:text-accent transition-colors duration-200">
                    {position.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="w-4 h-4" />
                      <span className="font-medium">{position.clubName}</span>
                    </div>
                    <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{position.clubCampus}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                    actualStatus === "open"
                      ? "bg-green-500/20 text-green-400 border border-green-500/40 shadow-lg shadow-green-500/10"
                      : "bg-destructive/20 text-destructive border border-destructive/40 shadow-lg shadow-destructive/10"
                  }`}
                >
                  {actualStatus === "open" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {actualStatus === "open" ? "Open" : "Closed"}
                  {isRecentlyClosed && <span className="ml-1 text-xs opacity-80">(Recently Closed)</span>}
                </div>
              </div>

              <p className="text-card-foreground/90 text-lg leading-relaxed">{position.description}</p>

              <div className="flex flex-wrap gap-6 text-sm">
                {position.date_posted && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Posted {formatDate(position.date_posted)}</span>
                  </div>
                )}
                {position.deadline && (
                  <div className={`flex items-center gap-2 ${isDeadlinePassed ? "text-destructive" : "text-accent"}`}>
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Deadline: {formatDate(position.deadline)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{position.clubDepartment}</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 p-2 rounded-full bg-muted/30 transition-all duration-200 group-hover:bg-accent/20">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors duration-200" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors duration-200" />
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-border/50 bg-muted/10">
            <div className="p-8 space-y-8">
              <div>
                <h4 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-accent rounded-full" />
                  Position Details
                </h4>

                {position.requirements && position.requirements.length > 0 && (
                  <div className="bg-card/50 rounded-lg p-6 border border-border/30">
                    <h5 className="font-semibold text-foreground mb-4 text-lg">Requirements</h5>
                    <ul className="space-y-3">
                      {position.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-3 text-card-foreground/90">
                          <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                          <span className="leading-relaxed">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {canApply ? (
                <div>
                  <h4 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    Application Form
                  </h4>
                  <form onSubmit={handleSubmit} className="space-y-6">
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
                            <label className="block text-foreground font-semibold text-lg">{questionText}</label>
                            <p className="text-muted-foreground text-sm">Type: {questionType}</p>
                            <textarea
                              value={formData[questionKey] || ""}
                              onChange={(e) => handleInputChange(questionKey, e.target.value)}
                              className="w-full p-4 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder-muted-foreground resize-vertical min-h-[120px] transition-all duration-200"
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
                        className="px-8 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Application"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({})
                          setIsExpanded(false)
                        }}
                        className="px-8 py-3 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg font-semibold transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Enhanced closed position message */
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h4 className="text-2xl font-bold text-foreground mb-3">
                      {actualStatus === "closed" && isRecentlyClosed
                        ? "Position Recently Closed"
                        : actualStatus === "closed" && isDeadlinePassed
                          ? "Application Deadline Passed"
                          : "Position Closed"}
                    </h4>
                    <p className="text-card-foreground/80 text-lg leading-relaxed max-w-md mx-auto">
                      {actualStatus === "closed" && isRecentlyClosed
                        ? "This position was recently closed due to the deadline passing."
                        : actualStatus === "closed" && isDeadlinePassed
                          ? "The deadline for this position has passed."
                          : "This position is no longer accepting applications."}
                    </p>
                    {position.deadline && (
                      <p className="text-muted-foreground mt-4">Deadline was: {formatDate(position.deadline)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
