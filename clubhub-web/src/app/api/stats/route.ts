import { NextResponse } from 'next/server'
import { firestore } from '../firebaseAdmin'

export async function GET() {
  try {
    // Use Firestore aggregation count to avoid reading all documents
    const clubsCountSnap: any = await (firestore as any).collection('Clubs').count().get()
    // Posts split by category
    const postsCollection = firestore.collection('Posts')
    const eventsSnap: any = await (postsCollection.where('category', '==', 'Event') as any).count().get()
    const hiringSnap: any = await (postsCollection.where('category', '==', 'Hiring Opportunity') as any).count().get()
    const announcementsSnap: any = await (postsCollection.where('category', '==', 'General Announcement') as any).count().get()
    const surveysSnap: any = await (postsCollection.where('category', '==', 'Survey') as any).count().get()

    const clubs = clubsCountSnap.data().count ?? 0
    const events = eventsSnap.data().count ?? 0
    const hiring = hiringSnap.data().count ?? 0
    const announcements = announcementsSnap.data().count ?? 0
    const surveys = surveysSnap.data().count ?? 0

    return NextResponse.json({ clubs, events, hiring, announcements, surveys }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch stats' }, { status: 500 })
  }
}
