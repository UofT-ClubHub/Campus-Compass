import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '../firebaseAdmin';
import { User, Post } from '@/model/types';

export async function POST(request: NextRequest) {
    try {
        const authorization = request.headers.get('Authorization');
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];

        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(idToken);
        } catch (error) {
            console.log('Error verifying ID token:', error);
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const uid = decodedToken.uid;
        const { postId } = await request.json();

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const userDocRef = firestore.collection('Users').doc(uid);
        const postDocRef = firestore.collection('Posts').doc(postId);

        const [userDoc, postDoc] = await Promise.all([
            userDocRef.get(),
            postDocRef.get()
        ]);

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!postDoc.exists) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const userData = userDoc.data() as User;
        const postData = postDoc.data() as Post;

        const isLiked = userData.liked_posts?.includes(postId) || false;

        if (isLiked) {
            // Unlike: Remove from user's liked_posts and decrease post likes
            const updatedLikedPosts = userData.liked_posts.filter(id => id !== postId);
            const updatedLikes = Math.max(0, postData.likes - 1);

            await Promise.all([
                userDocRef.update({ liked_posts: updatedLikedPosts }),
                postDocRef.update({ likes: updatedLikes })
            ]);

            return NextResponse.json({ 
                liked: false, 
                likes: updatedLikes 
            }, { status: 200 });
        } else {
            // Like: Add to user's liked_posts and increase post likes
            const updatedLikedPosts = [...(userData.liked_posts || []), postId];
            const updatedLikes = postData.likes + 1;

            await Promise.all([
                userDocRef.update({ liked_posts: updatedLikedPosts }),
                postDocRef.update({ likes: updatedLikes })
            ]);

            return NextResponse.json({ 
                liked: true, 
                likes: updatedLikes 
            }, { status: 200 });
        }

    } catch (error: any) {
        console.log('Error in POST /api/likes:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}