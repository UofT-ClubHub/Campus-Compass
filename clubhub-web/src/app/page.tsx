'use client';

import Image from "next/image";
import firebase from '@/model/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Autocomplete } from "@mantine/core"
import { EventCard } from "../../components/event-card"

export default function Home() {
  const { user, loading } = useAuth();

  const events = [
    {
      id: 1,
      title: "Welcome to Campus",
      description: "Join us for an orientation event to kickstart the semester!",
      image: "/placeholder.jpg",
      date: "2023-09-01",
      time: "10:00 AM - 2:00 PM",
      location: "Main Auditorium",
    },
    {
      id: 2,
      title: "Club Fair",
      description: "Explore various clubs and organizations on campus.",
      image: "/placeholder.jpg",
      date: "2023-09-05",
      time: "11:00 AM - 4:00 PM",
      location: "Student Union Building",
    }
  ]

  return (
    <div>
      <section className="relative h-[60vh] min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />

        <Image
          src="/utsc.jpg"
          alt="UofT Image"
          layout="fill"
          objectFit="cover"
          className="z-0"
          priority
        />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 text-center drop-shadow-lg">Campus Compass</h1>
          
          <div className="w-full max-w-md">
            <Autocomplete
              placeholder="Search for clubs, events, or resources"
              data={[]}
              styles={{
                input: {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(8px)",
                  border: "none",
                  color: "#1f2937",
                  fontSize: "18px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  width: "100%",
                  boxSizing: "border-box",
                },
                dropdown: {
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                },
              }}
            />
          </div>

        </div>
      </section>


      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-center mb-4 text-[#1E3765]">Upcoming Events</h2>
                <p className="text-center text-[#1E3765]">Stay updated with the latest events happening on campus.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"> 
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    description={event.description}
                    image={event.image}
                    date={event.date}
                    time={event.time}
                    location={event.location}
                    isRSVP={false} // Placeholder, implement RSVP logic later
                  />
                ))}
              </div>
        </div>
      </section>

      
    </div>
  );
}
