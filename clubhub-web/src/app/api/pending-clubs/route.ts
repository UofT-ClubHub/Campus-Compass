import { PendingClub, Club } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../firebaseAdmin';
import { withAuth } from '@/lib/auth-middleware';
import * as admin from 'firebase-admin';

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl;
    const campusFilter = searchParams.get("campus");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const pendingClubsCollection = firestore.collection("Pending_Clubs");
    let query = pendingClubsCollection.orderBy("created_at", "desc");

    const snapshot = await query.get();
    let pendingClubs: PendingClub[] = snapshot.docs.map(
      (doc) => ({ ...doc.data(), id: doc.id } as PendingClub)
    );

    // Apply campus filter if provided
    if (campusFilter) {
      pendingClubs = pendingClubs.filter(
        (club) => club.club_campus.toLowerCase() === campusFilter.toLowerCase()
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

    // Check if user already has a pending club
    const existingPendingClub = await pendingClubsCollection
      .where("user", "==", authResult.uid)
      .limit(1)
      .get();

    if (!existingPendingClub.empty) {
      return NextResponse.json(
        { error: "You already have a pending club request. Please wait for approval or rejection." },
        { status: 400 }
      );
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

export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl;
    const pendingClubId = searchParams.get('id');
    const action = searchParams.get('action'); // 'approve' or 'reject'

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
        links: [],
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
    }

    // Delete the pending club (both approve and reject)
    await pendingClubDoc.ref.delete();

    return NextResponse.json({ 
      message: action === 'approve' ? 'Club approved and created successfully' : 'Club request rejected successfully' 
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});