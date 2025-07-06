import { Club } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '../firebaseAdmin';
import { checkExecPermissions } from '../amenities';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const documentId = searchParams.get("id");
    const nameFilter = searchParams.get("name");
    const descriptionFilter = searchParams.get("description");
    const campusFilter = searchParams.get("campus");
    const sortBy = searchParams.get("sort_by");
    const sortOrder = searchParams.get("sort_order") || "asc";
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const clubsCollection = firestore.collection("Clubs");

    // Fetch by ID
    if (documentId) {
      const doc = await clubsCollection.doc(documentId).get();
      if (!doc.exists) {
        return NextResponse.json(
          { message: "Club not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ...doc.data(), id: doc.id }, { status: 200 });
    }

    // Fetch all and apply filters
    let snapshot = await clubsCollection.get();
    let clubs: Club[] = snapshot.docs.map(
      (doc) => ({ ...doc.data(), id: doc.id } as Club)
    );

    // Filters
    clubs = clubs.filter(
      (club) =>
        (!nameFilter ||
          (club.name &&
            club.name.toLowerCase().includes(nameFilter.toLowerCase()))) &&
        (!descriptionFilter ||
          (club.description &&
            club.description
              .toLowerCase()
              .includes(descriptionFilter.toLowerCase()))) &&
        (!campusFilter ||
          (club.campus &&
            club.campus.toLowerCase() === campusFilter.toLowerCase()))
    );

    // Sort
    if (sortBy && ["followers"].includes(sortBy)) {
      const order = sortOrder === "asc" ? 1 : -1;
      clubs.sort((a, b) => {
        const aVal = a[sortBy as keyof Club];
        const bVal = b[sortBy as keyof Club];
        if (!aVal || !bVal) return 0;
        if (aVal === bVal) return 0;
        return aVal > bVal ? order : -order;
      });
    }

    const paginated = clubs.slice(offset, offset + limit);
    
    return NextResponse.json(paginated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const clubsCollection = firestore.collection("Clubs");

    // Validate required fields
    if (!data.description || !data.campus) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Authorization check for creating club
    const { authorized, error, status } = await checkExecPermissions(request, data.id);
    if (!authorized) {
        return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
    }

    // Create new club document
    const docRef = await clubsCollection.add(data);

    // Update the document to include the id field
    await docRef.update({ id: docRef.id });

    const newDoc = await docRef.get();
    return NextResponse.json(
      { id: docRef.id, ...newDoc.data() },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const clubId = searchParams.get('id');
        if (!clubId) {
            return NextResponse.json({ message: 'Missing club id' }, { status: 400 }); 
        }

        const data = await request.json();
        const clubsCollection = firestore.collection('Clubs');
        const usersCollection = firestore.collection('users');
        const docRef = clubsCollection.doc(clubId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ message: 'Club not found' }, { status: 404 });
        }

        // Authorization check for editing club
        const { authorized, error, status } = await checkExecPermissions(request, clubId);
        if (!authorized) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }

        const oldData = doc.data() as Club;

        // Handle executive updates
        if (data.executives) {
            const oldExecutives = oldData.executives || [];
            const newExecutives = data.executives || [];

            const oldExecEmails = oldExecutives.map((e: any) => e.email);
            const newExecEmails = newExecutives.map((e: any) => e.email);

            const addedEmails = newExecEmails.filter((email: string) => !oldExecEmails.includes(email));
            const removedEmails = oldExecEmails.filter((email: string) => !newExecEmails.includes(email));

            // Process added executives
            for (const email of addedEmails) {
                const userQuery = await usersCollection.where('email', '==', email).limit(1).get();
                if (!userQuery.empty) {
                    const userDoc = userQuery.docs[0];
                    const userId = userDoc.id;

                    // Add club to user's managedClubs
                    await usersCollection.doc(userId).update({
                        managedClubs: admin.firestore.FieldValue.arrayUnion(clubId)
                    });

                    // Update executive in data with id
                    const execIndex = newExecutives.findIndex((e: any) => e.email === email);
                    if (execIndex > -1) {
                        data.executives[execIndex].id = userId;
                    }
                }
            }

            // Process removed executives
            for (const email of removedEmails) {
                const userQuery = await usersCollection.where('email', '==', email).limit(1).get();
                if (!userQuery.empty) {
                    const userDoc = userQuery.docs[0];
                    const userId = userDoc.id;

                    // Remove club from user's managedClubs
                    await usersCollection.doc(userId).update({
                        managedClubs: admin.firestore.FieldValue.arrayRemove(clubId)
                    });
                }
            }
        }

        await docRef.update(data);
        const updatedDoc = await docRef.get();
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to update club", details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const clubId = searchParams.get('id');
        if (!clubId) {
            return NextResponse.json({ message: 'Missing club id' }, { status: 400 });        
        }

        const clubsCollection = firestore.collection('Clubs');
        const docRef = clubsCollection.doc(clubId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ message: 'Club not found' }, { status: 404 });
        }

        // Authorization check for editing club
        const { authorized, error, status } = await checkExecPermissions(request, clubId);
        if (!authorized) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }

        await docRef.delete();
        return NextResponse.json({ message: 'Club deleted successfully' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}