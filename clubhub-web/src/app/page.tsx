'use client';

import { useAuth } from '@/hooks/useAuth';
import { Autocomplete } from "@mantine/core"
import { EventCard } from "../../components/event-card"
import { Post } from "@/model/types";
import { useEffect, useState } from "react";


export default function Home() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true);
        const response = await fetch('/api/posts?sort_by=likes&sort_order=desc');
        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.statusText}`);
        }
        const data: Post[] = await response.json();
        setPosts(data.slice(0, 3)); // Get top 3 posts
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div>
      <section className="relative h-[60vh] min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />        
        <img
          src="/utsc.jpg"
          alt="UofT Image"
          className="z-0 object-cover w-full h-full"
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
          </div>~
        </div>
      </section>


      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-center mb-4 text-[#1E3765]">Upcoming Events</h2>
                <p className="text-center text-[#1E3765]">Stay updated with the latest events happening on campus.</p>
              </div>

              {loadingPosts && <p className="text-center">Loading events...</p>}
              {error && <p className="text-center text-red-500">Error loading events: {error}</p>}
              {!loadingPosts && !error && posts.length === 0 && <p className="text-center">No events found.</p>}
              
              {!loadingPosts && !error && posts.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"> 
                  {posts.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isRSVP={false} // Placeholder, implement RSVP logic later
                    />
                  ))}
                </div>
              )}
        </div>
      </section>
    </div>
  );
}
