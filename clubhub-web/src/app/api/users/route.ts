import { User } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../firebaseAdmin';
import { withAuth, getCurrentUserAuth } from '@/lib/auth-middleware';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
    try {
        // Try to get auth result, but don't require it
        let authResult = null;
        try {
            authResult = await getCurrentUserAuth(request);
            if (authResult.error) {
                authResult = null;
            }
        } catch {
            authResult = null; // No auth
        }
        
        const { searchParams } = request.nextUrl;
        const documentId = searchParams.get('id');
        const nameFilter = searchParams.get('name');
        const emailFilter = searchParams.get('email');
        const campusFilter = searchParams.get('campus');
        const usersCollection = firestore.collection('Users');

        const hasFilters = nameFilter || emailFilter || campusFilter;
        
        // Only authenticated admins can use filters
        if (hasFilters && (!authResult || !authResult.isAdmin)) {
            return NextResponse.json({ error: 'Admin access required for filtering' }, { status: 403 });
        }

        // Fetch by document ID if provided
        if (documentId) {
            const doc = await usersCollection.doc(documentId).get();
            if (!doc.exists) {
                return NextResponse.json({ message: 'user not found' }, { status: 404 });
            }
            const userData = { ...doc.data(), id: doc.id } as User;
            
            // Apply email filtering for unauthenticated users or non-admins (unless viewing own profile)
            if (!authResult || (!authResult.isAdmin && authResult.uid !== documentId)) {
                const { email, ...userWithoutEmail } = userData;
                return NextResponse.json(userWithoutEmail, { status: 200 });
            }
            
            return NextResponse.json(userData, { status: 200 });
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

        const filteredUsers = users.map(user => {
            if (authResult && (authResult.isAdmin || authResult.uid === user.id)) {
                return user;
            } else {
                const { email, ...userWithoutEmail } = user;
                return userWithoutEmail;
            }
        });

        return NextResponse.json(filteredUsers, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    try {
        // Manually handle authentication
        const authResult = await getCurrentUserAuth(request);
        
        if (!authResult.uid || authResult.error) {
            return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
        }

        const userData: User = await request.json();

        if (authResult.uid !== userData.id) {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        const usersCollection = firestore.collection('Users');
        const userDocRef = usersCollection.doc(authResult.uid!);

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
        // Manually handle authentication
        const authResult = await getCurrentUserAuth(request);
        
        if (!authResult.uid || authResult.error) {
            return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
        }
        const body = await request.json();
        const { id: targetUserId, ...updates } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
        }

        const targetUserDocRef = firestore.collection('Users').doc(targetUserId);
        const targetUserDoc = await targetUserDocRef.get();
        if (!targetUserDoc.exists) {
            return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
        }

        const allowedUpdates: Partial<User> = {};
        const updatableBySelf: (keyof User)[] = ['name', 'campus', 'bio'];
        const updatableByAdmin: (keyof User)[] = ['is_admin', 'is_executive', 'managed_clubs'];

        if (authResult.uid === targetUserId) {
            // User editing themselves
            updatableBySelf.forEach(field => {
                if (updates.hasOwnProperty(field)) {
                    (allowedUpdates as any)[field] = updates[field];
                }
            });
            // If user is admin, they can edit their own admin fields
            if (authResult.isAdmin) {
                updatableByAdmin.forEach(field => {
                    if (updates.hasOwnProperty(field)) {
                        (allowedUpdates as any)[field] = updates[field];
                    }
                });
            }
        } else if (authResult.isAdmin) {
            // Admin is editing another user
            updatableByAdmin.forEach(field => {
                if (updates.hasOwnProperty(field)) {
                    (allowedUpdates as any)[field] = updates[field];
                }
            });
        } else if (authResult.isExecutive && updates.hasOwnProperty('managed_clubs')) {
            const currentUserDoc = await firestore.collection('Users').doc(authResult.uid).get();
            const currentUserData = currentUserDoc.data() as User;
            const currentUserManagedClubs = currentUserData.managed_clubs || [];
            
            const targetUserData = targetUserDoc.data() as User;
            const oldManagedClubs = targetUserData.managed_clubs || [];
            const newManagedClubs = updates.managed_clubs || [];
            
            const addedClubs: string[] = newManagedClubs.filter((clubId: string) => !oldManagedClubs.includes(clubId));
            
            // If no clubs are being added, check if user is already an executive
            if (addedClubs.length === 0) {
                // User is already managing all requested clubs, return success without changes
                return NextResponse.json({ ...targetUserData, id: targetUserId }, { status: 200 });
            }
            
            // Check if executive can only add clubs they manage
            const canManageAllAddedClubs = addedClubs.every(clubId => currentUserManagedClubs.includes(clubId));
            
            if (canManageAllAddedClubs) {
                allowedUpdates.managed_clubs = newManagedClubs;
                allowedUpdates.is_executive = true;
            } else {
                return NextResponse.json({ error: 'Can only add users as executives for clubs you manage' }, { status: 403 });
            }
        } else {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        // Handle managed_clubs updates - update corresponding clubs
        if (allowedUpdates.managed_clubs) {
            const oldUserData = targetUserDoc.data() as User;
            const oldManagedClubs = oldUserData.managed_clubs || [];
            const newManagedClubs = allowedUpdates.managed_clubs || [];
            
            const addedClubs = newManagedClubs.filter(clubId => !oldManagedClubs.includes(clubId));
            const removedClubs = oldManagedClubs.filter(clubId => !newManagedClubs.includes(clubId));
            
            const clubsCollection = firestore.collection('Clubs');
            
            // Add user to executives of newly managed clubs
            for (const clubId of addedClubs) {
                const clubDoc = await clubsCollection.doc(clubId).get();
                if (clubDoc.exists) {
                    const clubData = clubDoc.data();
                    const executives = clubData?.executives || [];
                    if (!executives.includes(targetUserId)) {
                        await clubsCollection.doc(clubId).update({
                            executives: admin.firestore.FieldValue.arrayUnion(targetUserId)
                        });
                    }
                }
            }
            
            // Remove user from executives of no longer managed clubs
            for (const clubId of removedClubs) {
                const clubDoc = await clubsCollection.doc(clubId).get();
                if (clubDoc.exists) {
                    await clubsCollection.doc(clubId).update({
                        executives: admin.firestore.FieldValue.arrayRemove(targetUserId)
                    });
                }
            }        }

        // Only update if there are fields to update
        if (Object.keys(allowedUpdates).length === 0) {
            const currentUserData = { ...targetUserDoc.data(), id: targetUserId } as User;
            return NextResponse.json(currentUserData, { status: 200 });
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

// Require admin access for deleting users
export async function DELETE(request: NextRequest) {
    try {
        // Manually handle authentication
        const authResult = await getCurrentUserAuth(request);
        
        if (!authResult.uid || authResult.error) {
            return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
        }
        
        // Only admins can delete users
        if (!authResult.isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = request.nextUrl;
        const targetUserId = searchParams.get('id') || authResult.uid;

        const usersCollection = firestore.collection('Users');
        const userDocRef = usersCollection.doc(targetUserId);

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