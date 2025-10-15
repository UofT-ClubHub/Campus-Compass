import { Post, Club } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../firebaseAdmin';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const documentId = searchParams.get('id');
        const titleFilter = searchParams.get('title');
        const detailsFilter = searchParams.get('details');
        const searchFilter = searchParams.get('search'); // New combined search parameter
        const campusFilter = searchParams.get('campus');
        const departmentFilter = searchParams.get('department');
        const categoryFilter = searchParams.get('category');
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Get back arrays for hashtags and clubs
        const hashtagsFilterRaw = searchParams.get('hashtags');
        const hashtagsFilter = hashtagsFilterRaw ? JSON.parse(hashtagsFilterRaw) : [];
        
        // New: Filter by specific club IDs (array)
        const clubsFilterRaw = searchParams.get('clubs');
        const clubsFilter = clubsFilterRaw ? JSON.parse(clubsFilterRaw) : [];

        // Sorting filters
        const sortBy = searchParams.get('sort_by')
        const sortOrder = searchParams.get('sort_order');
        const postsCollection = firestore.collection('Posts');

        // Fetch by document ID if provided
        if (documentId) {
            const doc = await postsCollection.doc(documentId).get();
            if (!doc.exists) {
                return NextResponse.json({ message: 'post not found' }, { status: 404 });
            }
            return NextResponse.json({ ...doc.data(), id: doc.id }, { status: 200 });
        }

        // Build Firestore query with efficient filtering
        let query: any = postsCollection;

        // Apply Firestore-supported filters first (these use indexes)
        if (campusFilter) {
            query = query.where('campus', '==', campusFilter);
        }
        if (departmentFilter) {
            query = query.where('department', '==', departmentFilter);
        }
        if (categoryFilter) {
            query = query.where('category', '==', categoryFilter);
        }
        // If clubsFilter exists, filter by club id(s) (Firestore supports up to 10 values for 'in')
        let usingClubsFilter = false;
        if (clubsFilter.length > 0 && clubsFilter.length <= 10) {
            query = query.where('club', 'in', clubsFilter);
            usingClubsFilter = true;
        }

        // Apply sorting with index support
        if (sortBy && ['date_posted', 'date_occuring', 'likes'].includes(sortBy)) {
            const order = sortOrder === 'asc' ? 'asc' : 'desc';
            query = query.orderBy(sortBy, order);
        } else {
            // Default sorting for consistent pagination
            query = query.orderBy('date_posted', 'desc');
        }

        // Handle pagination - Firestore doesn't support offset directly, so we need to handle it
        let posts: Post[] = [];
        let allPosts: Post[] = [];
        const snapshot = await query.get();
        allPosts = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as Post));

        // Collect all unique club IDs from posts
        const clubIds = [...new Set(allPosts.map(post => post.club))];

        // Fetch club data for these IDs
        const clubsCollection = firestore.collection('Clubs');
        const clubDocs = await Promise.all(clubIds.map(async id => {
        const doc = await clubsCollection.doc(id).get();
        return doc.exists ? { id, name: doc.data()?.name } : null;
        }));

        // Build a lookup: { clubID: clubName }
        const clubIdToName: Record<string, string> = {};
        clubDocs.forEach(club => {
        if (club) clubIdToName[club.id] = club.name;
        });

        // Apply text-based filters in memory (these can't use Firestore indexes efficiently)
        allPosts = allPosts.filter(post => {
            const clubName = post.club ? clubIdToName[post.club] : "";
            // Handle combined search (search in title, details, and hashtags with OR logic)
            const matchesSearch = !searchFilter || 
              (post.title && post.title.toLowerCase().includes(searchFilter.toLowerCase())) ||
              (post.details && post.details.toLowerCase().includes(searchFilter.toLowerCase())) ||
              (clubName && clubName.toLowerCase().includes(searchFilter.toLowerCase())) ||
              (post.hashtags && post.hashtags.some((hashtag: string) => 
                hashtag.toLowerCase().includes(searchFilter.toLowerCase())
              ));
            
            // Handle individual title/details filters (with AND logic for backward compatibility)
            const matchesTitle = !titleFilter ||
              (post.title && post.title.toLowerCase().includes(titleFilter.toLowerCase()));
            const matchesDetails = !detailsFilter ||
              (post.details && post.details.toLowerCase().includes(detailsFilter.toLowerCase()));
            
            // Handle hashtags filter
            const matchesHashtags = hashtagsFilter.length === 0 || (post.hashtags && hashtagsFilter.every((tag: string) =>
                post.hashtags.map((h: string) => h.toLowerCase()).includes(tag.toLowerCase())
            ));
            
            return matchesSearch && matchesTitle && matchesDetails && matchesHashtags;
        });

        // Apply sorting in memory if not already sorted by Firestore
        if (!sortBy || !['date_posted', 'date_occuring', 'likes'].includes(sortBy)) {
            if (sortBy && ['likes', 'date_occuring', 'date_posted'].includes(sortBy)) {
                const order = sortOrder === 'asc' ? 1 : -1;
                allPosts.sort((a, b) => {
                    const aVal = a[sortBy as keyof Post];
                    const bVal = b[sortBy as keyof Post];
                    if (aVal == null || bVal == null) return 0;
                    if (aVal === bVal) return 0;
                    return aVal > bVal ? order : -order;
                });
            }
        }

        // Now apply pagination to the fully filtered and sorted posts
        posts = allPosts.slice(offset, offset + limit);

        return NextResponse.json(posts, { status: 200 });

    } catch (error: any) {
        console.error('Posts API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth; // Added by middleware
        let data = await request.json();
        const postsCollection = firestore.collection('Posts');

        // Validate required fields
        if (!data.title || !data.details || !data.campus || !data.club || !data.category || !data.date_posted) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Additional authorization check: admins can post for any club, executives can only post for their managed clubs
        if (!authResult.isAdmin) {
            const clubDoc = await firestore.collection('Clubs').doc(data.club).get();
            if (!clubDoc.exists) {
                return NextResponse.json({ error: 'Club not found' }, { status: 404 });
            }
            const clubData = clubDoc.data() as Club;
            const executives = clubData?.executives || [];
            if (!executives.includes(authResult.uid)) {
                return NextResponse.json({ error: 'Forbidden - Not an executive of this club' }, { status: 403 });
            }
        }

        // Get club data to assign department (for both admin and non-admin cases)
        const clubDoc = await firestore.collection('Clubs').doc(data.club).get();
        const clubData = clubDoc.data() as Club;

        // Automatically assign the club's department to the post
        data = { ...data, department: clubData?.department || "" };

        // Create new post document
        const docRef = await postsCollection.add(data);

        // Update the document to include the id field
        await docRef.update({ id: docRef.id });

        const newDoc = await docRef.get();
        return NextResponse.json(
            { id: docRef.id, ...newDoc.data() }, 
            { status: 200 }
        );
    }
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const PUT = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth; // Added by middleware
        const { searchParams } = request.nextUrl;
        const postId = searchParams.get('id');
        if (!postId) {
            return NextResponse.json({ message: 'Missing post id' }, { status: 400 });        
        }

        const data = await request.json();
        const postsCollection = firestore.collection('Posts');
        const docRef = postsCollection.doc(postId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Additional authorization check: admins can edit any post, executives can only edit posts from their clubs
        if (!authResult.isAdmin) {
            const postData = doc.data() as Post;
            if (!postData?.club) {
                return NextResponse.json({ error: 'Post data invalid' }, { status: 404 });
            }
            
            const clubDoc = await firestore.collection('Clubs').doc(postData.club).get();
            if (!clubDoc.exists) {
                return NextResponse.json({ error: 'Club not found' }, { status: 404 });
            }
            
            const clubData = clubDoc.data() as Club;
            const executives = clubData?.executives || [];
            if (!executives.includes(authResult.uid)) {
                return NextResponse.json({ error: 'Forbidden - Not an executive of this club' }, { status: 403 });
            }
        }

        await docRef.update(data);
        const updatedDoc = await docRef.get();
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() }, { status: 200 });
    }
    catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update post' }, { status: 500 });
    }
});

export const DELETE = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth; // Added by middleware
        const { searchParams } = request.nextUrl;
        const postId = searchParams.get('id');
        if (!postId) {
            return NextResponse.json({ message: 'Missing post id' }, { status: 400 });        
        }

        const postsCollection = firestore.collection('Posts');
        const docRef = postsCollection.doc(postId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ message: 'post not found' }, { status: 404 });
        }

        // Additional authorization check: admins can delete any post, executives can only delete posts from their clubs
        if (!authResult.isAdmin) {
            const postData = doc.data() as Post;
            if (!postData?.club) {
                return NextResponse.json({ error: 'Post data invalid' }, { status: 404 });
            }
            
            const clubDoc = await firestore.collection('Clubs').doc(postData.club).get();
            if (!clubDoc.exists) {
                return NextResponse.json({ error: 'Club not found' }, { status: 404 });
            }
            
            const clubData = clubDoc.data() as Club;
            const executives = clubData?.executives || [];
            if (!executives.includes(authResult.uid)) {
                return NextResponse.json({ error: 'Forbidden - Not an executive of this club' }, { status: 403 });
            }
        }

        // Before deleting the post, mark any related calendar events across all users as postDeleted: true
        const usersCollection = firestore.collection('Users');
        const usersSnapshot = await usersCollection.get();

        const batch = firestore.batch();
        usersSnapshot.docs.forEach(userDoc => {
            const calendarEventsRef = usersCollection.doc(userDoc.id).collection('CalendarEvents');
            // We cannot run queries inside a batch directly; collect updates separately
        });

        // Query all user events referencing this post and update them
        for (const userDoc of usersSnapshot.docs) {
            const calendarEventsRef = usersCollection.doc(userDoc.id).collection('CalendarEvents');
            const matchingEvents = await calendarEventsRef.where('postId', '==', postId).get();
            matchingEvents.docs.forEach(eventDoc => {
                batch.update(eventDoc.ref, { postDeleted: true, updatedAt: new Date().toISOString() });
            });
        }

        // Commit all event updates first
        await batch.commit();

        // Finally, delete the post
        await docRef.delete();
        return NextResponse.json({ message: 'post deleted successfully' }, { status: 200 });
    }
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
