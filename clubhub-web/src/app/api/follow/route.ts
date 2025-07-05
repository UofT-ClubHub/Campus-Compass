import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '../firebaseAdmin';
import { User, Club } from '@/model/types';

export async function POST(request: NextRequest) {
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
            console.log('Error verifying ID token:', error);
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const uid = decodedToken.uid;
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