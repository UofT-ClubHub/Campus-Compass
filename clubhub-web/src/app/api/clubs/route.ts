import firebase from '@/model/firebase';
import { NextRequest, NextResponse } from 'next/server';

interface Club {
    id?: string;
    name?: string;
    description?: string;
    campus?: string;
}

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
            return NextResponse.json({ id: doc.id, ...doc.data() as Club }, { status: 200 });
        }

        // Otherwise fetch all and apply filters
        const snapshot = await clubsCollection.get();
    
        let clubs: Club[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Club }));

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
