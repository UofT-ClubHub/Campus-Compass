import firebase from '@/model/firebase';
import { NextRequest, NextResponse } from 'next/server';

interface Post {
    id?: string;
    title?: string;
    details?: string;
    campus?: string;
    club?: string;
    category?: string;
    hashtags?: string[];
    date_occuring?: string;
    date_posted?: string;
    likes?: number;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const documentId = searchParams.get('id');
        const titleFilter = searchParams.get('title');
        const detailsFilter = searchParams.get('details');
        const campusFilter = searchParams.get('campus');
        const clubFilter = searchParams.get('club');
        const categoryFilter = searchParams.get('category');
        const hashtagsFilter = searchParams.get('hashtags');
        // Sorting filters
        const sortBy = searchParams.get('sort_by')
        const sortOrder = searchParams.get('sort_order');

        const firestore = firebase.firestore();
        const postsCollection = firestore.collection('Posts');

        // Fetch by document ID if provided
        if (documentId) {
            const doc = await postsCollection.doc(documentId).get();
            if (!doc.exists) {
                return NextResponse.json({ message: 'post not found' }, { status: 404 });
            }
            return NextResponse.json({ id: doc.id, ...doc.data() as Post }, { status: 200 });
        }

        // Otherwise fetch all and apply filters
        const snapshot = await postsCollection.get();
    
        let posts: Post[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Post }));

        // Apply all filters if they exist
        posts = posts.filter(post => 
            (!titleFilter || (post.title && post.title.toLowerCase().includes(titleFilter.toLowerCase()))) &&
            (!detailsFilter || (post.details && post.details.toLowerCase().includes(detailsFilter.toLowerCase()))) &&
            (!campusFilter || (post.campus && post.campus.toLowerCase() === campusFilter.toLowerCase())) &&
            (!clubFilter || (post.club && post.club.toLowerCase() === clubFilter.toLowerCase())) &&
            (!categoryFilter || (post.category && post.category.toLowerCase() === categoryFilter.toLowerCase())) &&
            (!hashtagsFilter || (post.hashtags && post.hashtags.some(tag => tag.toLowerCase() === hashtagsFilter!.toLowerCase())))
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
