import { Club } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../firebaseAdmin';
import { withAuth } from '@/lib/auth-middleware';
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
        if (aVal == null || bVal == null) return 0;
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

export const POST = withAuth(async (request: NextRequest) => {
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
});

export const PUT = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth; // Added by middleware
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

        // Additional authorization check: admins can edit any club, executives can only edit their managed clubs
        if (!authResult.isAdmin) {
            const clubData = doc.data() as Club;
            const executives = clubData?.executives || [];
            if (!executives.includes(authResult.uid)) {
                return NextResponse.json({ error: 'Forbidden - Not an executive of this club' }, { status: 403 });
            }
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
});

export const DELETE = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth; // Added by middleware
        const { searchParams } = request.nextUrl;
        const clubId = searchParams.get('id');
        if (!clubId) {
            return NextResponse.json({ message: 'Missing club id' }, { status: 400 });        
        }

        const clubsCollection = firestore.collection('Clubs');
        const usersCollection = firestore.collection('Users');
        const postsCollection = firestore.collection('Posts');
        
        const docRef = clubsCollection.doc(clubId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ message: 'Club not found' }, { status: 404 });
        }

        // Additional authorization check: admins can delete any club, executives can only delete their managed clubs
        if (!authResult.isAdmin) {
            const clubData = doc.data() as Club;
            const executives = clubData?.executives || [];
            if (!executives.includes(authResult.uid)) {
                return NextResponse.json({ error: 'Forbidden - Not an executive of this club' }, { status: 403 });
            }
        }

        const clubData = doc.data() as Club;

        // Clean up related data in batch
        const batch = firestore.batch();

        // 1. Remove club from all users' followed_clubs arrays
        const followersQuery = await usersCollection
            .where('followed_clubs', 'array-contains', clubId)
            .get();
        
        followersQuery.docs.forEach(userDoc => {
            batch.update(userDoc.ref, {
                followed_clubs: admin.firestore.FieldValue.arrayRemove(clubId)
            });
        });

        // 2. Remove club from executives' managed_clubs arrays and update is_executive status if needed
        if (clubData.executives && clubData.executives.length > 0) {
            for (const execId of clubData.executives) {
                const execDocRef = usersCollection.doc(execId);
                const execDoc = await execDocRef.get();
                
                if (execDoc.exists) {
                    const execData = execDoc.data();
                    const managedClubs = execData?.managed_clubs || [];
                    const updatedManagedClubs = managedClubs.filter((id: string) => id !== clubId);
                    
                    // If this was their only club, remove executive status
                    const updateData: any = {
                        managed_clubs: updatedManagedClubs
                    };
                    
                    if (updatedManagedClubs.length === 0) {
                        updateData.is_executive = false;
                    }
                    
                    batch.update(execDocRef, updateData);
                }
            }
        }

        // 3. Delete all posts associated with this club
        const clubPostsQuery = await postsCollection
            .where('club', '==', clubId)
            .get();
        
        clubPostsQuery.docs.forEach(postDoc => {
            batch.delete(postDoc.ref);
        });

        // 4. Also need to remove the club from users' liked_posts if any posts are deleted
        // First collect all post IDs that will be deleted
        const deletedPostIds = clubPostsQuery.docs.map(doc => doc.id);
        
        if (deletedPostIds.length > 0) {
            // Find users who liked these posts and remove them
            for (const postId of deletedPostIds) {
                const usersWithLikedPosts = await usersCollection
                    .where('liked_posts', 'array-contains', postId)
                    .get();
                
                usersWithLikedPosts.docs.forEach(userDoc => {
                    batch.update(userDoc.ref, {
                        liked_posts: admin.firestore.FieldValue.arrayRemove(postId)
                    });
                });
            }
        }

        // 5. Finally, delete the club itself
        batch.delete(docRef);

        // Execute all operations in batch
        await batch.commit();

        return NextResponse.json({ message: 'Club and related data deleted successfully' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});