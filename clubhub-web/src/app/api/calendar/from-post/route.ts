import { CalendarEvent, Post } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../firebaseAdmin';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth;
        const data = await request.json();
        
        if (!data.postId) {
            return NextResponse.json({ message: 'postId is required' }, { status: 400 });
        }

        // Get the post details
        const postDoc = await firestore.collection('Posts').doc(data.postId).get();
        if (!postDoc.exists) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        const post = postDoc.data() as Post;
        
        // Validate that the post has a date_occuring field
        if (!post.date_occuring) {
            return NextResponse.json({ message: 'Post does not have an event date' }, { status: 400 });
        }
        
        // Check if event already exists for this post and user
        const userEventsCollection = firestore.collection('Users').doc(authResult.uid).collection('CalendarEvents');
        const existingEventsSnapshot = await userEventsCollection
            .where('postId', '==', data.postId)
            .get();

        if (!existingEventsSnapshot.empty) {
            return NextResponse.json({ 
                message: 'Event for this post already exists in your calendar',
                eventId: existingEventsSnapshot.docs[0].id
            }, { status: 409 });
        }

        // Extract date and time from post's date_occuring
        let eventDate = '';
        let startTime: string | undefined = undefined;

        if (post.date_occuring) {
            const eventDateTime = new Date(post.date_occuring);
            
            if (!isNaN(eventDateTime.getTime())) {
                // Extract date in YYYY-MM-DD format
                const year = eventDateTime.getFullYear();
                const month = String(eventDateTime.getMonth() + 1).padStart(2, '0');
                const day = String(eventDateTime.getDate()).padStart(2, '0');
                eventDate = `${year}-${month}-${day}`;

                // Extract time if it's not midnight (00:00)
                const hours = eventDateTime.getHours();
                const minutes = eventDateTime.getMinutes();
                
                if (hours !== 0 || minutes !== 0) {
                    // Event has a specific time
                    startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                }
            }
        }

        // Validate that we have a valid date
        if (!eventDate) {
            return NextResponse.json({ message: 'Invalid event date' }, { status: 400 });
        }

        // Create calendar event from post
        const now = new Date().toISOString();
        const eventData: Partial<CalendarEvent> = {
            title: post.title || 'Untitled Event',
            description: post.details || '',
            date: eventDate,
            postId: data.postId,
            postDeleted: false,
            clubId: post.club || '',
            location: post.campus || undefined,
            createdAt: now,
            updatedAt: now,
        };
        
        // Only add optional fields if they have values
        if (startTime) {
            eventData.startTime = startTime;
        }

        const userEventsCollectionForAdd = firestore.collection('Users').doc(authResult.uid).collection('CalendarEvents');
        const docRef = await userEventsCollectionForAdd.add(eventData);

        // Update the document to include the id field
        await docRef.update({ id: docRef.id });

        const newDoc = await docRef.get();
        return NextResponse.json(
            { 
                id: docRef.id, 
                ...newDoc.data(),
                message: 'Post added to calendar successfully'
            }, 
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Calendar from-post API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});