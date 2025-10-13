"use client"

import { useEffect, useState } from "react"
import { Users, Calendar } from "lucide-react"

type StatsResponse = {
  clubs: number
  events: number
  hiring: number
  announcements: number
  surveys: number
}

export function StatsBoxes() {
  const [stats, setStats] = useState<StatsResponse>({ clubs: 0, events: 0, hiring: 0, announcements: 0, surveys: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data: StatsResponse = await res.json()
          setStats(data)
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <section className="py-5 relative w-full max-w-full">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-full">
        <div className="w-full">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-card/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-xl">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-blue-500">{loading ? 0 : stats.clubs}</div>
                    <p className="text-sm font-medium text-muted-foreground">Active Clubs</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-xl">
                    <Calendar className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-green-500">{loading ? 0 : stats.events}</div>
                    <p className="text-sm font-medium text-muted-foreground">Events</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-500/10 rounded-xl">
                    <Calendar className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-amber-500">{loading ? 0 : stats.hiring}</div>
                    <p className="text-sm font-medium text-muted-foreground">Hiring Opportunities</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-500/10 rounded-xl">
                    <Calendar className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-purple-500">{loading ? 0 : stats.announcements}</div>
                    <p className="text-sm font-medium text-muted-foreground">Announcements</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-cyan-500/10 rounded-xl">
                    <Calendar className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-cyan-500">{loading ? 0 : stats.surveys}</div>
                    <p className="text-sm font-medium text-muted-foreground">Surveys</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


