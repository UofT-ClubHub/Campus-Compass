"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"

interface ApplicationsChartProps {
  positions: any[]
  totalApplications: number
}

export function ApplicationsChart({ positions, totalApplications }: ApplicationsChartProps) {
  const [hoveredSegment, setHoveredSegment] = React.useState<number | null>(null)
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })

  const chartData = React.useMemo(() => {
    const colors = [
      "#3b82f6", // blue-500
      "#10b981", // emerald-500  
      "#f59e0b", // amber-500
      "#ef4444", // red-500
      "#8b5cf6", // violet-500
      "#06b6d4", // cyan-500
      "#ec4899", // pink-500
      "#84cc16", // lime-500
    ]
    
    return positions.map((position, index) => ({
      position: position.title || `Position ${index + 1}`,
      applications: position.applicants?.length || 0,
      fill: colors[index % colors.length],
    })).filter(item => item.applications > 0)
  }, [positions])

  const totalVisibleApplications = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.applications, 0)
  }, [chartData])

  // Calculate pie chart segments
  const pieSegments = React.useMemo(() => {
    if (totalVisibleApplications === 0 || chartData.length === 0) return []
    
    // If there's only one position, create a full circle
    if (chartData.length === 1) {
      return [{
        ...chartData[0],
        percentage: 100,
        startAngle: 0,
        endAngle: 359.99, // Almost full circle to avoid rendering issues
        angle: 359.99,
      }]
    }
    
    let cumulativeAngle = 0
    const segments = chartData.map((item) => {
      const percentage = item.applications / totalVisibleApplications
      const angle = percentage * 360
      const startAngle = cumulativeAngle
      const endAngle = cumulativeAngle + angle
      cumulativeAngle += angle
      
      return {
        ...item,
        percentage: percentage * 100,
        startAngle,
        endAngle,
        angle,
      }
    })
    
    console.log('Pie segments:', segments)
    return segments
  }, [chartData, totalVisibleApplications])

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  const createArcPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, innerRadius: number) => {
    // Handle full or nearly full circle (single position case)
    if (endAngle - startAngle >= 359) {
      return [
        "M", centerX, centerY - radius,
        "A", radius, radius, 0, 1, 1, centerX - 0.1, centerY - radius,
        "L", centerX - 0.1, centerY - innerRadius,
        "A", innerRadius, innerRadius, 0, 1, 0, centerX, centerY - innerRadius,
        "Z"
      ].join(" ")
    }
    
    const start = polarToCartesian(centerX, centerY, radius, endAngle)
    const end = polarToCartesian(centerX, centerY, radius, startAngle)
    const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle)
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle)
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    
    const d = [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      "Z"
    ].join(" ")
    
    return d
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] text-center">
        <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
          <TrendingUp className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No Applications Yet</h3>
        <p className="text-muted-foreground">Applications will appear here once submitted</p>
      </div>
    )
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (chartRef?.current) {
      const rect = chartRef.current.getBoundingClientRect()
      setMousePosition({ 
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top 
      })
    }
  }

  const handleMouseEnter = (index: number) => {
    setHoveredSegment(index)
  }

  const handleMouseLeave = () => {
    setHoveredSegment(null)
  }

  const chartRef = React.useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col items-center text-center relative">
      <div ref={chartRef} className="relative mb-6">
        {/* Simple approach: Use CSS conic-gradient for single position or render segments manually */}
        {chartData.length === 1 ? (
          // Single position - simple donut
          <div className="relative w-[280px] h-[280px]">
            <div 
              className="w-full h-full rounded-full border-[40px] shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
              style={{ 
                borderColor: chartData[0].fill,
                backgroundColor: 'transparent'
              }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => handleMouseEnter(0)}
              onMouseLeave={handleMouseLeave}
            />
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-bold text-foreground drop-shadow-sm">
                {totalVisibleApplications.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                Applications
              </span>
            </div>
          </div>
        ) : chartData.length > 1 ? (
          // Multiple positions - use SVG
          <div className="relative">
            <svg 
              width="280" 
              height="280" 
              viewBox="0 0 280 280" 
              className="drop-shadow-lg"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {pieSegments.map((segment, index) => {
                const path = createArcPath(140, 140, 110, segment.startAngle, segment.endAngle, 70)
                const isHovered = hoveredSegment === index
                return (
                  <path
                    key={`${segment.position}-${index}`}
                    d={path}
                    fill={segment.fill}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                    className="transition-all duration-200 cursor-pointer"
                    style={{ 
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      opacity: isHovered ? 0.8 : 1,
                      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                      transformOrigin: '140px 140px'
                    }}
                    onMouseEnter={() => handleMouseEnter(index)}
                  />
                )
              })}
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-bold text-foreground drop-shadow-sm">
                {totalVisibleApplications.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                Applications
              </span>
            </div>
          </div>
        ) : (
          // No data - show empty state inline
          <div className="w-[280px] h-[280px] flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-10 h-10 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">0</span>
            <span className="text-sm text-muted-foreground font-medium">Applications</span>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-1 gap-2 max-w-[300px] w-full">
        {chartData.map((item, index) => (
          <div 
            key={`legend-${item.position}-${index}`} 
            className={`flex items-center justify-between gap-4 px-4 py-3 backdrop-blur-sm rounded-lg border transition-all duration-200 ${
              hoveredSegment === index 
                ? 'bg-card/80 dark:bg-white/10 border-primary/50 dark:border-primary/30 scale-105' 
                : 'bg-card/50 dark:bg-white/5 border-border/50 dark:border-white/10 hover:bg-card/70 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm border border-white/20" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-foreground font-medium text-sm truncate">{item.position}</span>
            </div>
            <span className="text-muted-foreground font-bold text-sm tabular-nums">{item.applications}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredSegment !== null && chartData[hoveredSegment] && (
        <div 
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ 
            left: mousePosition.x, 
            top: mousePosition.y - 15
          }}
        >
          <div className="bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 whitespace-nowrap">
            <div className="text-sm font-semibold">{chartData[hoveredSegment].position}</div>
            <div className="text-xs text-gray-300 dark:text-gray-400">
              {chartData[hoveredSegment].applications} application{chartData[hoveredSegment].applications !== 1 ? 's' : ''}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}