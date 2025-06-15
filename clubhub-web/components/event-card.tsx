"use client"

import { Card, Button, Text, Group, Badge, Stack } from "@mantine/core"
import { Calendar, MapPin, Clock, Users, Heart } from "lucide-react"
import { Post } from "@/model/types";

interface EventCardProps {
  event: Post;
  isRSVP?: boolean;
  onRSVP?: (eventId: string) => void;
}

export function EventCard({
    event,
    isRSVP = false,
    onRSVP, 
}: EventCardProps) {
    const handleRSVP = () => {
        if (onRSVP) {
            onRSVP(event.id);
        }
    }  

    return (
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
      >        <Card.Section className="relative h-48">
          <img
            src={event.image || "/placeholder.jpg"}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-t-md"
          />
          {/* Likes counter overlay */}
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full flex items-center gap-1">
            <Heart className="h-4 w-4 text-red-400" />
            <Text size="sm" className="text-white">
              {event.likes || 0}
            </Text>
          </div>
        </Card.Section>

        <Stack gap="xs" mt="md">
          <Text fw={600} size="lg" className="line-clamp-2 group-hover:text-blue-600">
            {event.title}
          </Text>

          {event.details && (
            <Text size="sm" c="dimmed" className="line-clamp-3">
              {event.details}
            </Text>
          )}

          <Stack gap="xs">
            <Group gap="xs" align="center" className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-blue-500" />
              <Text size="sm" c="dimmed">
                {new Date(event.date_occuring).toLocaleDateString()}
              </Text>
            </Group>

            {event.date_occuring && ( // Assuming time might be part of date_occuring or a separate field if added to Post
              <Group gap="xs" align="center" className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-green-500" />
                <Text size="sm" c="dimmed">
                  {new Date(event.date_occuring).toLocaleTimeString()}
                </Text>
              </Group>
            )}

            <Group gap="xs" align="center" className="flex items-center space-x-1">
                <MapPin className="h-4 w-4 text-red-500" />
                <Text size="sm" c="dimmed">
                    {event.campus || "Online"} {/* Assuming campus can be used as location or a new field like 'location' is added to Post */}
                </Text>
            </Group>
          </Stack>

          <Group grow mt="md">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <Button size="sm" variant="filled">
              RSVP
            </Button>
          </Group>

        </Stack>
      </Card>
    )
}