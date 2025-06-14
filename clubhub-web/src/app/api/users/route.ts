import firebase from '@/model/firebase';
import { User } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '../firebaseAdmin'; // Ensure firestore is imported from admin SDK

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

export async function PUT(request: NextRequest) {
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
            console.error('Error verifying ID token:', error);
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const actingUserUid = decodedToken.uid;
        const body = await request.json();
        const { id: targetUserId, ...updates } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
        }

        const actingUserDoc = await firestore.collection('Users').doc(actingUserUid).get();
        if (!actingUserDoc.exists) {
            return NextResponse.json({ error: 'Acting user not found' }, { status: 404 });
        }
        const actingUserData = actingUserDoc.data() as User;

        const targetUserDocRef = firestore.collection('Users').doc(targetUserId);
        const targetUserDoc = await targetUserDocRef.get();
        if (!targetUserDoc.exists) {
            return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
        }

        const allowedUpdates: Partial<User> = {};
        const updatableBySelf: (keyof User)[] = ['name', 'campus', 'bio'];
        const updatableByAdmin: (keyof User)[] = ['is_admin', 'is_executive', 'managed_clubs'];

        if (actingUserUid === targetUserId) {
            // User editing themselves
            updatableBySelf.forEach(field => {
                if (updates.hasOwnProperty(field)) {
                    (allowedUpdates as any)[field] = updates[field];
                }
            });
            // If user is admin, they can edit their own admin fields
            if (actingUserData.is_admin) {
                updatableByAdmin.forEach(field => {
                    if (updates.hasOwnProperty(field)) {
                        (allowedUpdates as any)[field] = updates[field];
                    }
                });
            }
        } else if (actingUserData.is_admin) {
            // Admin is editing another user
            updatableByAdmin.forEach(field => {
                if (updates.hasOwnProperty(field)) {
                    (allowedUpdates as any)[field] = updates[field];
                }
            });
        } else {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        await targetUserDocRef.update(allowedUpdates);
        const updatedUserDoc = await targetUserDocRef.get();
        const updatedUserData = { ...updatedUserDoc.data(), id: updatedUserDoc.id } as User;

        return NextResponse.json(updatedUserData, { status: 200 });

    } catch (error: any) {
        console.error('Error in PUT /api/users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
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
            console.error('Error verifying ID token:', error);
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const uid = decodedToken.uid;
        const usersCollection = firestore.collection('Users');
        const userDocRef = usersCollection.doc(uid);

        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return NextResponse.json({ message: 'user not found' }, { status: 404 });
        }

        await userDocRef.delete();

        return NextResponse.json({ message: 'user deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Error in DELETE /api/users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}