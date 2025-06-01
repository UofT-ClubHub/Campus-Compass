import firebase from '@/model/firebase';
import { NextRequest, NextResponse } from 'next/server';

interface Event {
    id?: string;
    name?: string;
    details?: string;
    campus?: string;
    club?: string;
    date_occuring?: string;
    date_posted?: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const documentId = searchParams.get('id');
        const nameFilter = searchParams.get('name');
        const detailsFilter = searchParams.get('details');
        const campusFilter = searchParams.get('campus');
        const clubFilter = searchParams.get('club');
        // Date range filters
        const dateOccuringStart = searchParams.get('date_occuring_start');
        const dateOccuringEnd = searchParams.get('date_occuring_end');
        const datePostedStart = searchParams.get('date_posted_start');
        const datePostedEnd = searchParams.get('date_posted_end');

        const firestore = firebase.firestore();
        const eventsCollection = firestore.collection('Events');

        // Fetch by document ID if provided
        if (documentId) {
            const doc = await eventsCollection.doc(documentId).get();
            if (!doc.exists) {
                return NextResponse.json({ message: 'Event not found' }, { status: 404 });
            }
            return NextResponse.json({ id: doc.id, ...doc.data() as Event }, { status: 200 });
        }

        // Otherwise fetch all and apply filters
        const snapshot = await eventsCollection.get();
    
        let events: Event[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Event }));

        // Apply all filters if they exist
        events = events.filter(event => 
            (!nameFilter || (event.name && event.name.toLowerCase().includes(nameFilter.toLowerCase()))) &&
            (!detailsFilter || (event.details && event.details.toLowerCase().includes(detailsFilter.toLowerCase()))) &&
            (!campusFilter || (event.campus && event.campus.toLowerCase().includes(campusFilter.toLowerCase()))) &&
            (!clubFilter || (event.club && event.club.toLowerCase().includes(clubFilter.toLowerCase()))) &&
            (!dateOccuringStart || !event.date_occuring || event.date_occuring >= dateOccuringStart) &&
            (!dateOccuringEnd || !event.date_occuring || event.date_occuring <= dateOccuringEnd) &&
            (!datePostedStart || !event.date_posted || event.date_posted >= datePostedStart) &&
            (!datePostedEnd || !event.date_posted || event.date_posted <= datePostedEnd)
        );

        return NextResponse.json(events, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
