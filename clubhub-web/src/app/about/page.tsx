"use client"

import { Users, Info, Target, Award, Heart } from "lucide-react"
import { Suspense } from "react"
import { useTheme } from '@/contexts/ThemeContext'

function AboutUsContent() {
  const { theme } = useTheme();
  const values = [
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Community First",
      description:
        "We believe in the power of student communities to create lasting connections and meaningful experiences.",
    },
    {
      icon: <Target className="h-8 w-8 text-green-600" />,
      title: "Accessibility",
      description: "Making campus life accessible to all students, regardless of background or circumstances.",
    },
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      title: "Inclusivity",
      description: "Creating spaces where every student feels welcome, valued, and empowered to participate.",
    },
    {
      icon: <Award className="h-8 w-8 text-purple-600" />,
      title: "Excellence",
      description: "Continuously improving our platform to provide the best possible experience for students.",
    },
  ]

  const teamMembers = [
    {
      image: "OP",
      name: "Oscar Pang",
      title: "Co-Founder, Tech Lead",
      bgGradient: "from-blue-400 to-purple-500",
      linkedin: "https://www.linkedin.com/in/oscar-shenglong-pang/"
    },
    {
      image: "IA",
      name: "Imran Aziz",
      title: "Co-Founder, Tech Lead",
      bgGradient: "from-green-400 to-blue-500",
      linkedin: "https://www.linkedin.com/in/imran-aziz-321934306/"
    },
    {
      image: "DG",
      name: "Dibya Goswami",
      title: "Co-Founder, Tech Lead",
      bgGradient: "from-purple-400 to-pink-500",
      linkedin: "https://www.linkedin.com/in/dibya-gos/"
    },
    {
      image: "EA",
      name: "Eishan Ashraf",
      title: "Co-Founder, Tech Lead",
      bgGradient: "from-orange-400 to-red-500",
      linkedin: "https://www.linkedin.com/in/eishan-ashraf-252595244/"
    },
    {
      image: "HL",
      name: "Hong Yu Lin",
      title: "Co-Founder, Tech Lead",
      bgGradient: "from-teal-400 to-green-500",
      linkedin: "https://www.linkedin.com/in/hong-yu-lin"
    },
    {
      image: "RS",
      name: "Rishi Shah",
      title: "Co-Founder, Marketing Lead",
      bgGradient: "from-indigo-400 to-purple-500",
      linkedin: "https://www.linkedin.com/in/rishiishah/"
    }
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-theme-gradient bg-animated-elements relative" data-theme={theme}>
      {/* Animated background elements - constrained to viewport */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className={`element-${i + 1}`}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              filter: 'blur(48px)',
              willChange: 'opacity, transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-12 max-w-6xl pt-20 max-w-full">
        {/* Header Section */}
        <div className="mb-12 bg-card/30 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 sm:p-10 lg:p-12 form-glow mx-4 sm:mx-8 lg:mx-12 xl:mx-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Info className="w-8 h-8 text-foreground" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                About UofT ClubHub
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We're on a mission to transform campus life by connecting students and clubs on one seamless platform. Built by students, for students.
            </p>
          </div>
        </div>

        {/* Our Mission Section */}
        <div className="mb-12 bg-card/30 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8 sm:p-10 lg:p-12 form-glow mx-4 sm:mx-8 lg:mx-12 xl:mx-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Our Mission
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                ClubHub is dedicated to revolutionizing the way students discover, connect, and engage with campus life. We believe that every student deserves access to meaningful opportunities that shape their university experience.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Through our innovative platform, we're building bridges between students and the vibrant communities that make university life extraordinary. From academic clubs to social organizations, from career development to cultural events, we're creating a comprehensive ecosystem that empowers students to make the most of their time on campus.
              </p>
            </div>
          </div>
        </div>

        {/* Our Values Section */}
        <div className="bg-card/30 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8 sm:p-10 lg:p-12 form-glow mx-4 sm:mx-8 lg:mx-12 xl:mx-16">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {values.map((value, index) => (
              <div 
                key={index} 
                className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-card/70"
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Our Team Section */}
        <div className="bg-card/30 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8 sm:p-10 lg:p-12 form-glow mx-4 sm:mx-8 lg:mx-12 xl:mx-16">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Our Team
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {teamMembers.map((member, index) => (
              <a
                key={index}
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-card/70 text-center block"
                aria-label={`Open LinkedIn profile for ${member.name}`}
              >
                <div className={`w-24 h-24 bg-gradient-to-br ${member.bgGradient} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                  <span className="text-2xl font-bold text-white">{member.image}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{member.name}</h3>
                <p className="text-muted-foreground text-sm mb-3">{member.title}</p>
              </a>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// Loading state for About Us page
function AboutUsLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-theme-gradient bg-animated-elements relative">
      {/* Animated background elements for loading state - constrained to viewport */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={`element-${i + 1}`}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              filter: 'blur(48px)',
              willChange: 'opacity, transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-12 max-w-6xl pt-20 max-w-full">
        <div className="bg-card/30 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8 sm:p-10 form-glow mx-4 sm:mx-8 lg:mx-12 xl:mx-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Info className="w-8 h-8 text-foreground" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                About Us
              </h1>
            </div>
            <p className="text-muted-foreground">Discover the team behind the platform</p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// Main exported component with Suspense boundary
export default function AboutUsPage() {
  return (
    <Suspense fallback={<AboutUsLoading />}>
      <AboutUsContent />
    </Suspense>
  );
}
