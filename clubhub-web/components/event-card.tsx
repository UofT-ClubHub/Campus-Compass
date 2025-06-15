"use client"

import Image from "next/image";
import { Card, Button, Text, Group, Badge, Stack } from "@mantine/core"
import { Calendar, MapPin, Clock, Users } from "lucide-react"

interface EventCardProps {
  id: number
  title: string
  description?: string
  image: string
  date: string
  time?: string
  location?: string
  isRSVP?: boolean
  onRSVP?: (eventId: number) => void
}

export function EventCard({
    id,
    title,
    description,
    image,
    date,
    time,
    location,
    isRSVP = false,
    onRSVP, 
}: EventCardProps) {
    const handleRSVP = () => {
        if (onRSVP) {
            onRSVP(id);
        }
    }  

    return (
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
      >
        <Card.Section className="relative h-48">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-t-md"
          />
        </Card.Section>

        <Stack gap="xs" mt="md">
          <Text fw={600} size="lg" className="line-clamp-2 group-hover:text-blue-600">
            {title}
          </Text>

          {description && (
            <Text size="sm" c="dimmed" className="line-clamp-3">
              {description}
            </Text>
          )}

          <Stack gap="xs">
            <Group gap="xs" align="center" className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-blue-500" />
              <Text size="sm" c="dimmed">
                {date}
              </Text>
            </Group>

            {time && (
              <Group gap="xs" align="center" className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-green-500" />
                <Text size="sm" c="dimmed">
                  {time}
                </Text>
              </Group>
            )}

            <Group gap="xs" align="center" className="flex items-center space-x-1">
                <MapPin className="h-4 w-4 text-red-500" />
                <Text size="sm" c="dimmed">
                    {location || "Online"}
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