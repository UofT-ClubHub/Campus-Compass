import { Post } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '../firebaseAdmin';
import { getCurrentUserId } from '../getID';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const documentId = searchParams.get('id');
        const titleFilter = searchParams.get('title');
        const detailsFilter = searchParams.get('details');
        const campusFilter = searchParams.get('campus');
        const clubFilter = searchParams.get('club');
        const categoryFilter = searchParams.get('category');

        // Get back arrays for hashtags
        const hashtagsFilterRaw = searchParams.get('hashtags');
        const hashtagsFilter = hashtagsFilterRaw ? JSON.parse(hashtagsFilterRaw) : [];

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

        // Otherwise fetch all and apply filters
        const snapshot = await postsCollection.get();

        let posts: Post[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Post));

        // Apply all filters if they exist
        posts = posts.filter(post =>
            (!titleFilter || (post.title && post.title.toLowerCase().includes(titleFilter.toLowerCase()))) &&
            (!detailsFilter || (post.details && post.details.toLowerCase().includes(detailsFilter.toLowerCase()))) &&
            (!campusFilter || (post.campus && post.campus.toLowerCase() === campusFilter.toLowerCase())) &&
            (!clubFilter || (post.club && post.club.toLowerCase().includes(clubFilter.toLowerCase()))) &&
            (!categoryFilter || (post.category && post.category.toLowerCase() === categoryFilter.toLowerCase())) &&
            (hashtagsFilter.length === 0 || (post.hashtags && hashtagsFilter.some((tag: string) =>
                post.hashtags.map((h: string) => h.toLowerCase()).includes(tag.toLowerCase())

            )))

        );

        // Sort by specified field and order if provided
        if (sortBy && ['likes', 'date_occuring', 'date_posted'].includes(sortBy)) {
            const order = sortOrder === 'asc' ? 1 : -1;
            posts.sort((a, b) => {
                const aVal = a[sortBy as keyof Post];
                const bVal = b[sortBy as keyof Post];
                if (!aVal || !bVal) return 0;
                if (aVal === bVal) return 0;
                return aVal > bVal ? order : -order;
            });
        }

        return NextResponse.json(posts, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const postsCollection = firestore.collection('Posts');

        // Validate required fields
        if (!data.title || !data.details || !data.campus || !data.club || !data.category || !data.date_occuring || !data.date_posted) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Create new club document
        const docRef = await postsCollection.add(data);
        return NextResponse.json({ id: docRef.id, ...data }, { status: 200 });
    }
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const postId = searchParams.get('id');
        if (!postId) {
            return NextResponse.json({ message: 'Missing post id' }, { status: 400 });        }

        const data = await request.json();
        const postsCollection = firestore.collection('Posts');
        const docRef = postsCollection.doc(postId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        await docRef.update(data);
        const updatedDoc = await docRef.get(); //This just fetches the updated data, just comment out if it's not wanted
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() }, { status: 200 }); //if you comment above line, comment this line as well
        //uncomment line underneath if the above 2 lines are commented out
        // return NextResponse.json({ id: postId, ...data }, { status: 200 });
    }
    catch {
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const postId = searchParams.get('id');
        if (!postId) {
            return NextResponse.json({ message: 'Missing post id' }, { status: 400 });        }

        const postsCollection = firestore.collection('Posts');
        const docRef = postsCollection.doc(postId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ message: 'post not found' }, { status: 404 });
        }

        await docRef.delete();
        return NextResponse.json({ message: 'post deleted successfully' }, { status: 200 });
    }
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
