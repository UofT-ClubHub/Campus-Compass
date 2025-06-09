import firebase from '@/model/firebase';
import { User } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '../firebaseAdmin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const documentId = searchParams.get('id');
        const nameFilter = searchParams.get('name');
        const emailFilter = searchParams.get('email');
        const campusFilter = searchParams.get('campus');

        const firestore = firebase.firestore();
        const usersCollection = firestore.collection('Users');

        // Fetch by document ID if provided
        if (documentId) {
            const doc = await usersCollection.doc(documentId).get();
            if (!doc.exists) {
                return NextResponse.json({ message: 'user not found' }, { status: 404 });
            }
            return NextResponse.json({ ...doc.data(), id: doc.id }, { status: 200 });
        }

        // Otherwise fetch all and apply filters
        const snapshot = await usersCollection.get();
    
        let users: User[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));

        // Apply all filters if they exist
        users = users.filter(user => 
            (!nameFilter || (user.name && user.name.toLowerCase().includes(nameFilter.toLowerCase()))) &&
            (!emailFilter || (user.email && user.email.toLowerCase().includes(emailFilter.toLowerCase()))) &&
            (!campusFilter || (user.campus && user.campus.toLowerCase() === campusFilter.toLowerCase()))
        );

        return NextResponse.json(users, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    try {
        // Verify the user is authenticated using Firebase ID token
        const authorization = request.headers.get('Authorization');
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];

        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(idToken);
        } catch (error) {
            console.error('Error verifying ID token:', error);
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const uid = decodedToken.uid;
        const userData: User = await request.json();

        if (uid !== userData.id) {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        const usersCollection = firestore.collection('Users');
        const userDocRef = usersCollection.doc(uid);

        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            return NextResponse.json({ message: 'user already exists' }, { status: 409 });
        }

        // Add new user document with UID as the document ID
        await userDocRef.set(userData);

        return NextResponse.json(userData, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
