import { PendingClub, Club } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../firebaseAdmin';
import { withAuth } from '@/lib/auth-middleware';
import * as admin from 'firebase-admin';

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl;
    const campusFilter = searchParams.get("campus");
    const userFilter = searchParams.get("user");
    const statusFilter = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const pendingClubsCollection = firestore.collection("Pending_Clubs");
    let query = pendingClubsCollection.orderBy("created_at", "desc");

    const snapshot = await query.get();
    let pendingClubs: PendingClub[] = snapshot.docs.map(
      (doc) => {
        const data = doc.data();
        let created_at = data.created_at;
        if (created_at && typeof created_at.toDate === 'function') {
          created_at = created_at.toDate().toISOString();
        }
        return { ...data, id: doc.id, created_at } as PendingClub;
      }
    );

    // Apply campus filter if provided
    if (campusFilter) {
      pendingClubs = pendingClubs.filter(
        (club) => club.club_campus.toLowerCase() === campusFilter.toLowerCase()
      );
    }
    // Apply user filter if provided
    if (userFilter) {
      pendingClubs = pendingClubs.filter(
        (club) => club.user === userFilter
      );
    }
    // Apply status filter if provided
    if (statusFilter) {
      pendingClubs = pendingClubs.filter(
        (club) => club.status === statusFilter
      );
    }

    const paginated = pendingClubs.slice(offset, offset + limit);
    
    return NextResponse.json(paginated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const authResult = (request as any).auth; // Added by middleware
    const data = await request.json();
    const { club_name, club_campus, club_description, club_image = "", club_instagram = "" } = data;

    // Validate required fields
    if (!club_name || !club_campus || !club_description) {
      return NextResponse.json(
        { error: "Missing required fields: club_name, club_campus, club_description" },
        { status: 400 }
      );
    }

    const pendingClubsCollection = firestore.collection("Pending_Clubs");

    // Get all pending requests for this user
    const userPendingClubsSnap = await pendingClubsCollection
      .where("user", "==", authResult.uid)
      .where("status", "==", "pending")
      .orderBy("created_at", "asc")
      .get();

    // Enforce a maximum of 5 pending requests per user by deleting all but the 4 most recent
    if (userPendingClubsSnap.size >= 5) {
      const docsToDelete = userPendingClubsSnap.docs.slice(0, userPendingClubsSnap.size - 4);
      for (const doc of docsToDelete) {
        const docRef = pendingClubsCollection.doc(doc.id);
        await docRef.delete();
        console.log("Deleted pending club request", docRef.id);
      }
    }

    // Create new pending club document
    const pendingClubData = {
      user: authResult.uid,
      club_name: club_name.trim(),
      club_campus: club_campus.trim(),
      club_description: club_description.trim(),
      club_image: club_image.trim(),
      club_instagram: club_instagram.trim(),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    };

    const docRef = await pendingClubsCollection.add(pendingClubData);

    // Update the document to include the id field
    await docRef.update({ id: docRef.id });

    const newDoc = await docRef.get();
    return NextResponse.json(
      { id: docRef.id, ...newDoc.data() },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl;
    const pendingClubId = searchParams.get('id');
    const action = searchParams.get('action'); // 'approve' or 'reject'

    let message = '';
    try {
      const body = await request.json();
      message = body.message || '';
    } catch (e) {
      // No body or invalid JSON, ignore
    }

    if (!pendingClubId) {
      return NextResponse.json({ error: 'Missing pending club id' }, { status: 400 });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
    }

    const pendingClubsCollection = firestore.collection('Pending_Clubs');
    const pendingClubDoc = await pendingClubsCollection.doc(pendingClubId).get();

    if (!pendingClubDoc.exists) {
      return NextResponse.json({ error: 'Pending club not found' }, { status: 404 });
    }

    const pendingClubData = pendingClubDoc.data() as PendingClub;

    if (action === 'approve') {
      // Create new club
      const clubsCollection = firestore.collection('Clubs');
      const usersCollection = firestore.collection('Users');

      const newClubData: Omit<Club, 'id'> = {
        name: pendingClubData.club_name,
        description: pendingClubData.club_description,
        campus: pendingClubData.club_campus,
        image: pendingClubData.club_image || '',
        instagram: pendingClubData.club_instagram || '',
        followers: 0,
        executives: [],
        links: {},
      };

      // Create the club
      const clubDocRef = await clubsCollection.add(newClubData);
      await clubDocRef.update({ id: clubDocRef.id });

      // Update the user who requested the club
      const requestingUserDoc = await usersCollection.doc(pendingClubData.user).get();
      if (requestingUserDoc.exists) {
        await usersCollection.doc(pendingClubData.user).update({
          is_executive: true,
          managed_clubs: admin.firestore.FieldValue.arrayUnion(clubDocRef.id)
        });

        // Add user as executive to the club
        await clubDocRef.update({
          executives: admin.firestore.FieldValue.arrayUnion(pendingClubData.user)
        });
      }
      // Update pending club status to 'approved' and save message
      await pendingClubDoc.ref.update({ status: 'approved', message });
    } else if (action === 'reject') {
      // Update pending club status to 'rejected' and save message
      await pendingClubDoc.ref.update({ status: 'rejected', message });
    }

    return NextResponse.json({ 
      message: action === 'approve' ? 'Club approved and created successfully' : 'Club request rejected successfully' 
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});