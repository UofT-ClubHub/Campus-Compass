import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../firebaseAdmin';
import { User, Club } from '@/model/types';
import { getCurrentUserId } from '../amenities';

export async function POST(request: NextRequest) {
    try {
        const { uid, error, status } = await getCurrentUserId(request);

        if (error || !uid) {
            return NextResponse.json({ error: error || 'User not authenticated' }, { status: status || 401 });
        }

        const { clubId } = await request.json();

        if (!clubId) {
            return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
        }

        const userDocRef = firestore.collection('Users').doc(uid);
        const clubDocRef = firestore.collection('Clubs').doc(clubId);

        const [userDoc, clubDoc] = await Promise.all([
            userDocRef.get(),
            clubDocRef.get()
        ]);

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!clubDoc.exists) {
            return NextResponse.json({ error: 'Club not found' }, { status: 404 });
        }

        const userData = userDoc.data() as User;
        const clubData = clubDoc.data() as Club;

        const isFollowing = userData.followed_clubs?.includes(clubId) || false;

        if (isFollowing) {
            const updatedFollowedClubs = userData.followed_clubs.filter(id => id !== clubId);
            const updatedFollowers = Math.max(0, clubData.followers - 1);

            await Promise.all([
                userDocRef.update({ followed_clubs: updatedFollowedClubs }),
                clubDocRef.update({ followers: updatedFollowers })
            ]);

            return NextResponse.json({ 
                following: false, 
                followersCount: updatedFollowers 
            }, { status: 200 });
        } else {
            const updatedFollowedClubs = [...(userData.followed_clubs || []), clubId];
            const updatedFollowers = clubData.followers + 1;

            await Promise.all([
                userDocRef.update({ followed_clubs: updatedFollowedClubs }),
                clubDocRef.update({ followers: updatedFollowers })
            ]);

            return NextResponse.json({ 
                following: true, 
                followersCount: updatedFollowers 
            }, { status: 200 });
        }

    } catch (error: any) {
        console.log('Error in POST /api/follow:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}