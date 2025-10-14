"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/contexts/ThemeContext"

// Typewriter component for subtitle
function TypewriterText() {
  const [currentText, setCurrentText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const texts = [
    "Navigate your university journey with confidence. Discover clubs, events, and opportunities that shape your future.",
    "Connect with like-minded students and explore your passions through our diverse community of clubs.",
    "Your gateway to campus life. Find events, join clubs, and make the most of your university experience."
  ]

  useEffect(() => {
    const currentFullText = texts[currentIndex]
    
    if (!isDeleting) {
      if (currentText.length < currentFullText.length) {
        const timeout = setTimeout(() => {
          setCurrentText(currentFullText.slice(0, currentText.length + 1))
        }, 50)
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => {
          setIsDeleting(true)
        }, 2000)
        return () => clearTimeout(timeout)
      }
    } else {
      if (currentText.length > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, currentText.length - 1))
        }, 30)
        return () => clearTimeout(timeout)
      } else {
        setIsDeleting(false)
        setCurrentIndex((prev) => (prev + 1) % texts.length)
      }
    }
  }, [currentText, currentIndex, isDeleting, texts])

  return (
    <div className="mb-12 h-8 md:h-10 lg:h-12 flex items-center justify-center">
      <p className="text-base md:text-lg lg:text-xl font-light leading-relaxed max-w-4xl mx-auto text-primary-foreground">
        {currentText}
        <span className="text-primary-foreground animate-pulse">|</span>
      </p>
    </div>
  )
}

export function HeroSection() {
  const { theme } = useTheme()

  return (
    <section className="relative min-h-[500px] overflow-hidden w-full max-w-full">
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br z-10 ${
        theme === 'light'
          ? 'from-black/50 via-black/40 to-black/30' 
          : theme === 'deep-dark'
          ? 'from-black/70 via-black/60 to-black/50'
          : 'from-black/70 via-black/60 to-black/s0'
      }`} />

      {/* Background Image */}
      <img
        src="/utsc.jpg"
        alt="UofT Image"
        className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-[20s] ease-out hover:scale-110"
      />

      {/* Content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8 sm:px-12 lg:px-16">
        <div className="text-center max-w-5xl mx-auto">
          {/* Main Title with Icons */}
          <div className="mb-8 flex items-center justify-center gap-8 md:gap-12 lg:gap-16">
            {/* Left Icon */}
            <span className="hidden md:inline-flex">
              <svg 
                className="w-12 h-12" 
                fill="none" 
                stroke="#fff" 
                strokeWidth={2} 
                viewBox="0 0 24 24"
                style={{
                  filter: `
                    drop-shadow(1px 1px 4px #000)
                    drop-shadow(0 2px 8px #000)
                    drop-shadow(0 0 12px #a5b4fc)
                  `
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418 0-8-5.373-8-10A8 8 0 1 1 20 11c0 4.627-3.582 10-8 10z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
            </span>
            
            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-none tracking-tight">
              <span
                className="block font-sans font-extrabold tracking-tight"
                style={{
                  color: "#fff",
                  textShadow: `
                    1px 1px 4px #000,
                    0 2px 8px #000,
                    0 0 12px #a5b4fc
                  `
                }}
              >
                UofT ClubHub
              </span>
            </h1>
            
            {/* Right Icon */}
            <span className="hidden md:inline-flex">
              <svg 
                className="w-12 h-12" 
                fill="none" 
                stroke="#fff" 
                strokeWidth={2} 
                viewBox="0 0 24 24"
                style={{
                  filter: `
                    drop-shadow(1px 1px 4px #000)
                    drop-shadow(0 2px 8px #000)
                    drop-shadow(0 0 12px #a5b4fc)
                  `
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </div>

          {/* Subtitle */}
          <TypewriterText />
        </div>
      </div>

      {/* Bottom Fade */}
      <div
        className={`
          absolute bottom-0 left-0 w-full h-40 z-15
          bg-gradient-to-t from-background to-transparent
        `}
      />
    </section>
  )
}

