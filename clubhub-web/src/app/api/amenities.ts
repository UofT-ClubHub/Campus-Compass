import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from './firebaseAdmin';

export async function getCurrentUserId(request: NextRequest): Promise<{ uid: string | null, error?: string, status?: number }>{
    try {
        // Verify the user is authenticated using Firebase ID token
        const authorization = request.headers.get('Authorization');
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return { uid: null, error: 'unauthorized', status: 401 };
        }
        const idToken = authorization.split('Bearer ')[1];

        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(idToken);
        } catch (error) {
            console.error('Error verifying ID token:', error);
            return { uid: null, error: 'unauthorized', status: 401 };
        }

        const uid = decodedToken.uid;
        // Return the user ID
        return { uid: decodedToken.uid, status: 200 };
        
    } 
    catch (error: any) {
        console.error('Error getting current user ID:', error);
        return { uid: null, error: error.message, status: 500 };
    }
}

export async function checkPostPermissions(request: NextRequest, postId: string): Promise<{authorized: boolean, error?: string, status?: number}> {
    try {
        //get user id
        const { uid, error, status } = await getCurrentUserId(request);
        if (error || status !== 200) {
            return { authorized: false, error: 'Unauthorized', status: 401 };
        }

        // get post document
        const postsCollection = firestore.collection('Posts');
        const docRef = postsCollection.doc(postId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return { authorized: false, error: 'post not found', status: 404 };
        }

        const postData = doc.data();
        if (!postData) {
            return { authorized: false, error: 'post data not found', status: 404 };
        }
        const clubId = postData.club;

        // get club document
        const clubsCollection = firestore.collection('Clubs');
        const clubDocRef = clubsCollection.doc(clubId);
        const clubDoc = await clubDocRef.get();
        if (!clubDoc.exists) {
            return { authorized: false, error: 'club not found', status: 404 };
        }

        const clubData = clubDoc.data();
        if (!clubData) {
            return { authorized: false, error: 'club data not found', status: 404 };
        }

        // get the array of executives
        const execs = clubData.executives;
        if (!execs || execs.length === 0) {
            return { authorized: false, error: 'club executives not found', status: 404 };
        }
        
        // check if user is in the array
        if (execs.includes(uid)) {
            return { authorized: true, status: 200 };
        }
        else {
            return { authorized: false, error: 'forbidden', status: 403 };
        }
    }
    catch (error: any) {
        console.error('Error checking post permissions:', error);
        return { authorized: false, error: error.message, status: 500 };
    }
}

export async function checkExecPermissions(request: NextRequest, clubID: string): Promise<{authorized: boolean, error?: string, status?: number}> {
    try {
        //get user id
        const { uid, error, status } = await getCurrentUserId(request);
        if (!uid || error || status !== 200) {
            return { authorized: false, error: 'Unauthorized', status: 401 };
        }

        // get club data
        const clubsCollection = firestore.collection('Clubs');
        const clubDocRef = clubsCollection.doc(clubID);
        const clubDoc = await clubDocRef.get();
        if (!clubDoc.exists) {
            return { authorized: false, error: 'club not found', status: 404 };
        }

        const clubData = clubDoc.data();
        if (!clubData) {
            return { authorized: false, error: 'club data not found', status: 404 };
        }

        // get the array of executives
        const execs = clubData.executives;
        if (!execs || execs.length === 0) {
            return { authorized: false, error: 'club executives not found', status: 404 };
        }
        
        // check if user is in the array
        if (execs.includes(uid)) {
            return { authorized: true, status: 200 };
        }
        else {
            return { authorized: false, error: 'forbidden', status: 403 };
        }
    }
    catch (error: any) {
        console.error('Error checking executive permissions:', error);
        return { authorized: false, error: error.message, status: 500 };
    }
}