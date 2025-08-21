import { CalendarEvent } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../firebaseAdmin';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth;
        const { searchParams } = request.nextUrl;
        const userId = searchParams.get('userId');
        const eventId = searchParams.get('id');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const category = searchParams.get('category');

        // Resolve target user (default to authenticated user)
        const targetUserId = userId || authResult.uid;

        // If userId is provided, verify it matches the authenticated user (unless admin)
        if (userId && userId !== authResult.uid && !authResult.isAdmin) {
            return NextResponse.json({ message: 'You can only access your own events' }, { status: 403 });
        }

        const calendarCollection = firestore
            .collection('Users')
            .doc(targetUserId)
            .collection('CalendarEvents');

        // Get specific event by ID
        if (eventId) {
            const doc = await calendarCollection.doc(eventId).get();
            if (!doc.exists) {
                return NextResponse.json({ message: 'Event not found' }, { status: 404 });
            }
            return NextResponse.json({ ...doc.data(), id: doc.id }, { status: 200 });
        }

        // Build query for user's events
        let query: any = calendarCollection as any;

        // Filter by date range if provided
        if (startDate) {
            query = query.where('date', '>=', startDate);
        }
        if (endDate) {
            query = query.where('date', '<=', endDate);
        }

        // Filter by category if provided
        if (category) {
            query = query.where('category', '==', category);
        }

        // Order by date
        query = query.orderBy('date', 'asc');

        const snapshot = await query.get();
        const events: CalendarEvent[] = snapshot.docs.map((doc: any) => ({
            ...doc.data(),
            id: doc.id
        } as CalendarEvent));

        return NextResponse.json(events, { status: 200 });

    } catch (error: any) {
        console.error('Calendar API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const POST = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth;
        const data = await request.json();
        const calendarCollection = firestore
            .collection('Users')
            .doc(authResult.uid)
            .collection('CalendarEvents');

        // Validate required fields
        if (!data.title || !data.date || typeof data.isAllDay !== 'boolean') {
            return NextResponse.json({ 
                message: 'Missing required fields: title, date, and isAllDay are required' 
            }, { status: 400 });
        }

        // Set default values and add metadata
        const now = new Date().toISOString();
        const eventData = {
            ...data,
            createdAt: now,
            updatedAt: now,
        };

        // Create new event document
        const docRef = await calendarCollection.add(eventData);

        // Update the document to include the id field
        await docRef.update({ id: docRef.id });

        const newDoc = await docRef.get();
        return NextResponse.json(
            { id: docRef.id, ...newDoc.data() }, 
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Calendar POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const PUT = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth;
        const { searchParams } = request.nextUrl;
        const eventId = searchParams.get('id');

        if (!eventId) {
            return NextResponse.json({ message: 'Missing event id' }, { status: 400 });
        }

        const data = await request.json();
        const calendarCollection = firestore
            .collection('Users')
            .doc(authResult.uid)
            .collection('CalendarEvents');

        const docRef = calendarCollection.doc(eventId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }

        // Update event with new data and updated timestamp
        const updateData = {
            ...data,
            updatedAt: new Date().toISOString(),
        };

        await docRef.update(updateData);
        const updatedDoc = await docRef.get();
        
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() }, { status: 200 });
    } catch (error: any) {
        console.error('Calendar PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const DELETE = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth;
        const { searchParams } = request.nextUrl;
        const eventId = searchParams.get('id');

        if (!eventId) {
            return NextResponse.json({ message: 'Missing event id' }, { status: 400 });
        }

        const calendarCollection = firestore
            .collection('Users')
            .doc(authResult.uid)
            .collection('CalendarEvents');

        const docRef = calendarCollection.doc(eventId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }

        await docRef.delete();
        return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Calendar DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});