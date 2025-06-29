import { NextRequest, NextResponse } from 'next/server';
import { auth } from './firebaseAdmin';

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