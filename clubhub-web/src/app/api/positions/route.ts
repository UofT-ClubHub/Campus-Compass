import { Club, OpenPosition, ClosedPosition } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../firebaseAdmin';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const documentId = searchParams.get("id");
    const searchFilter = searchParams.get("search"); // Combined search parameter
    const campusFilter = searchParams.get("campus");
    const departmentFilter = searchParams.get("department");
    const sortBy = searchParams.get("sort_by");
    const sortOrder = searchParams.get("sort_order") || "asc";
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const showClosed = searchParams.get("show_closed") === "true";
    const showOpen = searchParams.get("show_open") !== "false"; // Default to true if not specified

    const clubsCollection = firestore.collection("Clubs");

    // Fetch by ID (returns all positions for that club)
    if (documentId) {
      const doc = await clubsCollection.doc(documentId).get();
      if (!doc.exists) {
        return NextResponse.json(
          { message: "Club not found" },
          { status: 404 }
        );
      }

      const clubData = doc.data() as Club;
      let positions: any[] = [];

      // Get positions from subcollections based on show_open and show_closed
      if (showOpen) {
        try {
          const openPositionsSnapshot = await clubsCollection.doc(documentId).collection("OpenPositions").get();
          if (!openPositionsSnapshot.empty) {
            const openPositions = openPositionsSnapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
            positions = positions.concat(openPositions);
          }
        } catch (error) {
          // Subcollection might not exist yet, which is fine
          console.log(`No openPositions subcollection found for club ${documentId}`);
        }
      }

      if (showClosed) {
        try {
          const closedPositionsSnapshot = await clubsCollection.doc(documentId).collection("ClosedPositions").get();
          if (!closedPositionsSnapshot.empty) {
            const closedPositions = closedPositionsSnapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
            positions = positions.concat(closedPositions);
          }
        } catch (error) {
          // Subcollection might not exist yet, which is fine
          console.log(`No closedPositions subcollection found for club ${documentId}`);
        }
      }

      // Sort positions by date_posted or deadline
      if (sortBy && ["date_posted", "deadline"].includes(sortBy)) {
        const order = sortOrder === "asc" ? 1 : -1;
        positions.sort((a, b) => {
          const aVal = a[sortBy as keyof typeof a];
          const bVal = b[sortBy as keyof typeof b];
          if (aVal == null || bVal == null) return 0;
          if (aVal === bVal) return 0;
          return aVal > bVal ? order : -order;
        });
      } else {
        // Default sorting by date_posted descending (newest first)
        positions.sort((a, b) => {
          const aVal = a.date_posted;
          const bVal = b.date_posted;
          if (aVal == null || bVal == null) return 0;
          if (aVal === bVal) return 0;
          return aVal > bVal ? -1 : 1; // Descending order
        });
      }

      // Add club information to each position and sort questions
      const positionsWithClub = positions.map((position: any) => {
        // Sort questions if they exist
        let sortedQuestions = position.questions;
        if (position.questions && typeof position.questions === 'object') {
          const sortedKeys = Object.keys(position.questions).sort((a, b) => {
            // Extract numbers from Q1, Q2, etc. and sort numerically
            const numA = parseInt(a.replace(/\D/g, ''));
            const numB = parseInt(b.replace(/\D/g, ''));
            return numA - numB;
          });

          sortedQuestions = {};
          sortedKeys.forEach(key => {
            sortedQuestions[key] = position.questions[key];
          });
        }

        return {
          ...position,
          questions: sortedQuestions,
          clubId: doc.id,
          clubName: clubData.name,
          clubImage: clubData.image,
          clubCampus: clubData.campus,
          clubDepartment: clubData.department,
          clubDescription: clubData.description
        };
      });

      const paginated = positionsWithClub.slice(offset, offset + limit);

      return NextResponse.json(paginated, { status: 200 });
    }

    // Fetch all clubs and extract positions
    let query: any = clubsCollection;

    if (campusFilter) {
        query = query.where('campus', '==', campusFilter);
    }

    if (departmentFilter) {
        query = query.where('department', '==', departmentFilter);
    }

    const snapshot = await query.get();
    let clubs: Club[] = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as Club));

    // Extract all positions from clubs using subcollections
    let allPositions: any[] = [];

    for (const club of clubs) {
      // Get positions from subcollections based on show_open and show_closed
      if (showOpen) {
        try {
          const openPositionsSnapshot = await clubsCollection.doc(club.id).collection("OpenPositions").get();
          if (!openPositionsSnapshot.empty) {
            const openPositions = openPositionsSnapshot.docs.map((doc: any) => ({ 
              ...doc.data(), 
              id: doc.id,
              clubId: club.id,
              clubName: club.name,
              clubCampus: club.campus,
              clubDepartment: club.department,
              clubDescription: club.description,
              clubImage: club.image
            }));
            allPositions.push(...openPositions);
          }
        }
        catch (error) {
          console.error(`Error fetching open positions for club ${club.id}:`, error);
        }
      }

      if (showClosed) {
        try {
          const closedPositionsSnapshot = await clubsCollection.doc(club.id).collection("ClosedPositions").get();
          if (!closedPositionsSnapshot.empty) {
            const closedPositions = closedPositionsSnapshot.docs.map((doc: any) => ({ 
              ...doc.data(), 
              id: doc.id,
              clubId: club.id,
              clubName: club.name,
              clubCampus: club.campus,
              clubDepartment: club.department,
              clubDescription: club.description,
              clubImage: club.image
            }));
            allPositions.push(...closedPositions);
          }
        } catch (error) {
          // Subcollection might not exist yet, which is fine
          console.log(`No closedPositions subcollection found for club ${club.id}`);
        }
      }
    }

    // Process all positions at once: sort questions
    allPositions = allPositions.map((position: any) => {
      // Sort questions if they exist
      let sortedQuestions = position.questions;
      if (position.questions && typeof position.questions === 'object') {
        const sortedKeys = Object.keys(position.questions).sort((a, b) => {
          // Extract numbers from Q1, Q2, etc. and sort numerically
          const numA = parseInt(a.replace(/\D/g, ''));
          const numB = parseInt(b.replace(/\D/g, ''));
          return numA - numB;
        });

        sortedQuestions = {};
        sortedKeys.forEach(key => {
          sortedQuestions[key] = position.questions[key];
        });
      }

      // Return position with sorted questions
      return {
        ...position,
        questions: sortedQuestions
      };
    });

    // Apply filters to positions
    allPositions = allPositions.filter(
      (position) => {
        // Handle combined search (search in title, description, club name, and requirements)
        const matchesSearch = !searchFilter || 
          (position.title && position.title.toLowerCase().includes(searchFilter.toLowerCase())) ||
          (position.description && position.description.toLowerCase().includes(searchFilter.toLowerCase())) ||
          (position.clubDescription && position.clubDescription.toLowerCase().includes(searchFilter.toLowerCase())) ||
          (position.clubName && position.clubName.toLowerCase().includes(searchFilter.toLowerCase())) ||
          (position.requirements && position.requirements.some((requirement: string) => requirement.toLowerCase().includes(searchFilter.toLowerCase())));

        // Handle exact match filters
        const matchesCampus = !campusFilter ||
          (position.clubCampus && position.clubCampus.toLowerCase() === campusFilter.toLowerCase());
        const matchesDepartment = !departmentFilter ||
          (position.clubDepartment && position.clubDepartment.toLowerCase() === departmentFilter.toLowerCase());



        return matchesSearch && matchesCampus && matchesDepartment;
      }
    );

    // Sort positions by date_posted or deadline
    if (sortBy && ["date_posted", "deadline"].includes(sortBy)) {
      const order = sortOrder === "asc" ? 1 : -1;
      allPositions.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (aVal == null || bVal == null) return 0;
        if (aVal === bVal) return 0;
        return aVal > bVal ? order : -order;
      });
    } else {
      // Default sorting by date_posted descending (newest first)
      allPositions.sort((a, b) => {
        const aVal = a.date_posted;
        const bVal = b.date_posted;
        if (aVal == null || bVal == null) return 0;
        if (aVal === bVal) return 0;
        return aVal > bVal ? -1 : 1; // Descending order
      });
    }

    const paginated = allPositions.slice(offset, offset + limit);

    return NextResponse.json(paginated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const PATCH = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth; // Added by middleware
        const { searchParams } = request.nextUrl;
        const clubId = searchParams.get("id");
        if (!clubId) {
            return NextResponse.json({ message: "Club ID is required" }, { status: 400 });
        }

        const clubDoc = await firestore.collection("Clubs").doc(clubId).get();
        if (!clubDoc.exists) {
            return NextResponse.json({ message: "Club not found" }, { status: 404 });
        }

        // Additional authorization check: admins can edit any club, executives can only edit their managed clubs
        if (!authResult.isAdmin) {
            const clubData = clubDoc.data() as Club;
            const executives = clubData?.executives || [];
            if (!executives.includes(authResult.uid)) {
                return NextResponse.json({ error: 'Forbidden - Not an executive of this club' }, { status: 403 });
            }
        }

        const newPositionData = await request.json();

        // currentStatus is the current status (or the new status if status wanted to be changed) of the position when PATCH route is called (either "open" or "closed")
        const { positionId, currentStatus, ...positionFields } = newPositionData; 

        if (!positionId) {
            return NextResponse.json({ message: "Position ID is required" }, { status: 400 });
        }

        let positionFound = false;
        let positionFoundInOpen = false;
        let positionFoundInClosed = false;
        let existingPosition: any = null;

        // Check if position exists in either subcollection
        try {
            const openPositionDoc = await firestore.collection("Clubs").doc(clubId).collection("OpenPositions").doc(positionId).get();
            if (openPositionDoc.exists) {
                positionFound = true;
                positionFoundInOpen = true;
                existingPosition = { ...openPositionDoc.data(), id: openPositionDoc.id };
            }
        } catch (error) {
            // Subcollection might not exist, which is fine
        }

        if (!positionFound) {
            try {
                const closedPositionDoc = await firestore.collection("Clubs").doc(clubId).collection("ClosedPositions").doc(positionId).get();
                if (closedPositionDoc.exists) {
                    positionFound = true;
                    positionFoundInClosed = true;
                    existingPosition = { ...closedPositionDoc.data(), id: closedPositionDoc.id };
                }
            } catch (error) {
                // Subcollection might not exist, which is fine
            }
        }

        // Handle status change (moving between subcollections) or updates
        if (positionFound) {
            const batch = firestore.batch();

            if (positionFoundInOpen && currentStatus === "closed") {
                // Moving from open to closed
                // Delete from openPositions
                const openPositionRef = firestore.collection("Clubs").doc(clubId).collection("OpenPositions").doc(positionId);
                batch.delete(openPositionRef);

                // Create in closedPositions
                const closedPositionRef = firestore.collection("Clubs").doc(clubId).collection("ClosedPositions").doc(positionId);
                const positionData = {
                    ...existingPosition,
                    ...positionFields,
                    status: "closed"
                };
                batch.set(closedPositionRef, positionData);

            } else if (positionFoundInClosed && currentStatus === "open") {
                // Moving from closed to open
                // Delete from closedPositions
                const closedPositionRef = firestore.collection("Clubs").doc(clubId).collection("ClosedPositions").doc(positionId);
                batch.delete(closedPositionRef);

                // Create in openPositions
                const openPositionRef = firestore.collection("Clubs").doc(clubId).collection("OpenPositions").doc(positionId);
                const positionData = {
                    ...existingPosition,
                    ...positionFields,
                    status: "open"
                };
                batch.set(openPositionRef, positionData);

            } else {
                // Updating within same subcollection
                const positionRef = firestore.collection("Clubs").doc(clubId)
                    .collection(currentStatus === "open" ? "OpenPositions" : "ClosedPositions")
                    .doc(positionId);
                
                const positionData = {
                    ...existingPosition,
                    ...positionFields
                };
                batch.update(positionRef, positionData);
            }

            await batch.commit();

        } else {
            // Position not found - only allow creating new open positions
            if (currentStatus === "open") {
                const openPositionsRef = firestore.collection("Clubs").doc(clubId).collection("OpenPositions");
                
                const positionData = {
                    ...positionFields,
                    status: "open"
                };
                
                const newPositionDoc = await openPositionsRef.add(positionData);
                
                return NextResponse.json({ 
                    message: "Position added successfully",
                    positionId: newPositionDoc.id
                }, { status: 200 });
            } else {
                return NextResponse.json({ message: "Cannot create new closed positions" }, { status: 400 });
            }
        }
        
        return NextResponse.json({ 
            message: positionFound ? "Position updated successfully" : "Position added successfully",
            positionId: positionFound ? positionId : "new-position-created"
        }, { status: 200 });
    }
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const DELETE = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth; // Added by middleware
        const { searchParams } = request.nextUrl;
        const positionId = searchParams.get("positionId");
        const clubId = searchParams.get("clubId");
        const isOpenPosition = searchParams.get("isOpenPosition") !== "false"; // boolean value (default to true if not specified)
        
        if (!positionId) {
            return NextResponse.json({ message: "Position ID is required" }, { status: 400 });
        }

        if (!clubId) {
            return NextResponse.json({ message: "Club ID is required" }, { status: 400 });
        }

        const clubDoc = await firestore.collection("Clubs").doc(clubId).get();
        if (!clubDoc.exists) {
            return NextResponse.json({ message: "Club not found" }, { status: 404 });
        }

        // Additional authorization check: admins can delete any club, executives can only delete their managed clubs
        if (!authResult.isAdmin) {
            const clubData = clubDoc.data() as Club;
            const executives = clubData?.executives || [];
            if (!executives.includes(authResult.uid)) {
                return NextResponse.json({ error: 'Forbidden - Not an executive of this club' }, { status: 403 });
            }
        }

        // Determine which subcollection to check based on isOpenPosition
        const subcollectionName = isOpenPosition ? "openPositions" : "closedPositions";
        const positionRef = firestore.collection("Clubs").doc(clubId).collection(subcollectionName).doc(positionId);

        // Check if position exists in the subcollection
        const positionDoc = await positionRef.get();
        if (!positionDoc.exists) {
            const status = isOpenPosition ? "open" : "closed";
            return NextResponse.json({ message: `Position not found in this club's ${status} positions` }, { status: 404 });
        }

        // Delete the position from the subcollection
        await positionRef.delete();

        return NextResponse.json({ message: "Position deleted successfully" }, { status: 200 });
    }
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});