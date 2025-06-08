import firebase from '@/model/firebase';
import { User } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';

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
