import { NextRequest, NextResponse} from "next/server";
import { firestore } from '../firebaseAdmin';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: NextRequest) => {
    try {
        const { searchParams } = request.nextUrl;
        const clubId = searchParams.get('clubId');
        const authResult = (request as any).auth;

        if (!clubId) {
            return NextResponse.json({ message: 'Missing club id' }, { status: 400 });
        }

        // Check if user is admin or executive of the club
        const clubDoc = await firestore.collection('Clubs').doc(clubId).get();
        if (!clubDoc.exists) {
            return NextResponse.json({ message: 'Club not found' }, { status: 404 });
        }
        const clubData = clubDoc.data();
        const isExec = clubData && Array.isArray(clubData.executives) && clubData.executives.includes(authResult.uid);
        if (!authResult.isAdmin && !isExec) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const teamsCol = firestore
            .collection('Clubs')
            .doc(clubId)
            .collection('Teams');

        const snapshot = await teamsCol.get();

        const teams = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ teams }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching teams:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const POST = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth;
        const { searchParams } = request.nextUrl;
        const clubId = searchParams.get('clubId'); // Fix: changed from 'ClubId' to 'clubId'

        if (!clubId) {
            return NextResponse.json({ message: 'Missing club id' }, { status: 400 });
        }

        const body = await request.json();
        const  { team, teamLeads } = body;

        if (!team) {
            return NextResponse.json(
                { message: 'Missing team name' }, 
                { status: 400 });
        }

        // Make teamLeads optional with default empty array
        const leads = teamLeads && Array.isArray(teamLeads) ? teamLeads : [];

        const clubDocRef = firestore.collection('Clubs').doc(clubId);
        const clubDoc = await clubDocRef.get();

        if (!clubDoc.exists) {
            return NextResponse.json(
                { message: 'Club not found' },
                { status: 404 });
        }

        // Allow only admins or club executives to add a team
        if (!authResult.isAdmin) {
            const clubData = clubDoc.data();
            const isExec = clubData && Array.isArray(clubData.executives) && clubData.executives.includes(authResult.uid);
            if (!isExec) {
                return NextResponse.json(
                    { message: 'Unauthorized' },
                    { status: 403 }
                );
            }
        }

        const newTeamRef = await clubDocRef.collection("Teams").add({
            team,
            teamLeads: leads,
            createdAt: new Date().toISOString(),
        });

        const newTeamDoc = await newTeamRef.get();

        return NextResponse.json(
            { id: newTeamDoc.id, ...newTeamDoc.data()},
            { status: 201 }
        );
    }
    catch (error: any) {
        console.error('Error creating team:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
})

export const PUT = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth;
        const { searchParams } = request.nextUrl;
        const clubId = searchParams.get('clubId');
        const teamId = searchParams.get('teamId');

        if (!clubId || !teamId) {
            return NextResponse.json({ message: 'Missing club ID or team ID' }, { status: 400 });
        }

        const body = await request.json();
        const { team, teamLeads } = body;

        if (!team) {
            return NextResponse.json({ message: 'Missing team name' }, { status: 400 });
        }

        // Check if club exists and user has permissions
        const clubDoc = await firestore.collection('Clubs').doc(clubId).get();
        if (!clubDoc.exists) {
            return NextResponse.json({ message: 'Club not found' }, { status: 404 });
        }

        const clubData = clubDoc.data();
        const isExec = clubData && Array.isArray(clubData.executives) && clubData.executives.includes(authResult.uid);
        if (!authResult.isAdmin && !isExec) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        // Update the team document
        const teamRef = firestore
            .collection('Clubs')
            .doc(clubId)
            .collection('Teams')
            .doc(teamId);

        const teamDoc = await teamRef.get();
        if (!teamDoc.exists) {
            return NextResponse.json({ message: 'Team not found' }, { status: 404 });
        }

        await teamRef.update({
            team,
            teamLeads: teamLeads || [],
            updatedAt: new Date().toISOString(),
        });

        const updatedTeamDoc = await teamRef.get();
        
        return NextResponse.json(
            { id: updatedTeamDoc.id, ...updatedTeamDoc.data() },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error updating team:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
})