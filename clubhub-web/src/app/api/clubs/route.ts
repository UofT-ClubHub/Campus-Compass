import firebase from '@/model/firebase';
import { Club } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const documentId = searchParams.get('id');
        const nameFilter = searchParams.get('name');
        const descriptionFilter = searchParams.get('description');
        const campusFilter = searchParams.get('campus');
        // Sorting filters
        const sortBy = searchParams.get('sort_by')
        const sortOrder = searchParams.get('sort_order');

        const firestore = firebase.firestore();
        const clubsCollection = firestore.collection('Clubs');

        // Fetch by document ID if provided
        if (documentId) {
            const doc = await clubsCollection.doc(documentId).get();
            if (!doc.exists) {
                return NextResponse.json({ message: 'Club not found' }, { status: 404 });
            }
            return NextResponse.json({ ...doc.data(), id: doc.id }, { status: 200 });
        }

        // Otherwise fetch all and apply filters
        const snapshot = await clubsCollection.get();
    
        let clubs: Club[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Club));

        // Apply all filters if they exist
        clubs = clubs.filter(club => 
            (!nameFilter || (club.name && club.name.toLowerCase().includes(nameFilter.toLowerCase()))) &&
            (!descriptionFilter || (club.description && club.description.toLowerCase().includes(descriptionFilter.toLowerCase()))) &&
            (!campusFilter || (club.campus && club.campus.toLowerCase() === campusFilter.toLowerCase()))
        );

        // Sort by specified field and order if provided
        if (sortBy && ['followers'].includes(sortBy)) {
            const order = sortOrder === 'asc' ? 1 : -1;
            clubs.sort((a, b) => {
                const aVal = a[sortBy as keyof Club];
                const bVal = b[sortBy as keyof Club];
                if (!aVal || !bVal) return 0;
                if (aVal === bVal) return 0;
                return aVal > bVal ? order : -order;
            });
        }

        return NextResponse.json(clubs, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const firestore = firebase.firestore();
        const clubsCollection = firestore.collection('Clubs');

        // Validate required fields
        if (!data.description || !data.campus) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Create new club document
        const docRef = await clubsCollection.add(data);
        return NextResponse.json({ id: docRef.id, ...data }, { status: 201 });
    }
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const documentId = searchParams.get('id');
        if (!documentId) {
            return NextResponse.json({ message: 'Missing club id' }, { status: 400 });
        }

        const data = await request.json();
        const firestore = firebase.firestore();
        const clubsCollection = firestore.collection('Clubs');
        const docRef = clubsCollection.doc(documentId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ message: 'Club not found' }, { status: 404 });
        }

        await docRef.update(data);
        return NextResponse.json({ id: documentId, ...data }, { status: 200 });
    }
    catch {
        return NextResponse.json({ error: 'Failed to update club' }, { status: 500 });
    }
}