import { Club } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';
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
      
      // Get positions from appropriate arrays based on show_open and show_closed
      if (showOpen && clubData.openPositions) {
        positions = positions.concat(clubData.openPositions);
      }
      if (showClosed && clubData.closedPositions) {
        positions = positions.concat(clubData.closedPositions);
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

    // Extract all positions from clubs
    let allPositions: any[] = [];
    
    clubs.forEach((club) => {
      // Get positions from appropriate arrays based on show_open and show_closed
      let clubPositions: any[] = [];
      
      if (showOpen && club.openPositions && Array.isArray(club.openPositions)) {
        clubPositions = clubPositions.concat(club.openPositions);
      }
      if (showClosed && club.closedPositions && Array.isArray(club.closedPositions)) {
        clubPositions = clubPositions.concat(club.closedPositions);
      }
      
      clubPositions.forEach((position: any) => {
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

        // Add club information to each position
        const positionWithClub = {
          ...position,
          questions: sortedQuestions,
          clubId: club.id,
          clubName: club.name,
          clubCampus: club.campus,
          clubDepartment: club.department,
          clubDescription: club.description
        };
        allPositions.push(positionWithClub);
      });
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

        const clubData = clubDoc.data() as Club;
        const newPositionData = await request.json();
        const { positionId, currentStatus, ...positionFields } = newPositionData;  // currentStatus is the current status of the position when PATCH route is called (either "open" or "closed")

        if (!positionId) {
            return NextResponse.json({ message: "Position ID is required" }, { status: 400 });
        }

        let openPositions = clubData.openPositions || [];
        let closedPositions = clubData.closedPositions || [];
        let positionFound = false;
        let positionFoundInOpen = false;
        let positionFoundInClosed = false;

        // Check if position exists in either array
        const existingPositionInOpen = openPositions.find((position: any) => position.positionId === positionId);
        const existingPositionInClosed = closedPositions.find((position: any) => position.positionId === positionId);

        if (existingPositionInOpen) {
            positionFound = true;
            positionFoundInOpen = true;
        } else if (existingPositionInClosed) {
            positionFound = true;
            positionFoundInClosed = true;
        }

        // Handle status change (moving between arrays)
        if (positionFound) {
            if (positionFoundInOpen && currentStatus === "closed") {
                // Moving from open to closed
                openPositions = openPositions.filter((position: any) => position.positionId !== positionId);
                closedPositions.push({ ...existingPositionInOpen, ...positionFields, status: "closed" });
            } else if (positionFoundInClosed && currentStatus === "open") {
                // Moving from closed to open
                closedPositions = closedPositions.filter((position: any) => position.positionId !== positionId);
                openPositions.push({ ...existingPositionInClosed, ...positionFields, status: "open" });
            } else {
                // Updating within same array
                if (currentStatus === "open") {
                    openPositions = openPositions.map((position: any) => 
                        position.positionId === positionId ? { ...position, ...positionFields } : position
                    );
                } else {
                    closedPositions = closedPositions.map((position: any) => 
                        position.positionId === positionId ? { ...position, ...positionFields } : position
                    );
                }
            }
        } else {
            // Position not found - only allow creating new open positions
            if (currentStatus === "open") {
                const newPositionId = uuidv4();
                openPositions.push({ positionId: newPositionId, ...positionFields });
            } else {
                return NextResponse.json({ message: "Cannot create new closed positions" }, { status: 400 });
            }
        }

        // Update the club with both arrays
        await firestore.collection("Clubs").doc(clubId).update({
            openPositions,
            closedPositions
        });
        
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
        

        const clubData = clubDoc.data() as Club;
        let positions: any[] = [];

        if (isOpenPosition) {
            positions = clubData.openPositions || [];
        } else {
            positions = clubData.closedPositions || [];
        }


        
        // Check if position exists in this club
        const positionExists = positions.some((position: any) => position.positionId === positionId);
        if (!positionExists) {
            const status = isOpenPosition ? "open" : "closed";
            return NextResponse.json({ message: `Position not found in this club's ${status} positions` }, { status: 404 });
        }

        const newPositions = positions.filter((position: any) => position.positionId !== positionId);

        if (isOpenPosition) {
            await firestore.collection("Clubs").doc(clubId).update({ openPositions: newPositions });
        } else {
            await firestore.collection("Clubs").doc(clubId).update({ closedPositions: newPositions });
        }

        return NextResponse.json({ message: "Position deleted successfully" }, { status: 200 });
    }
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});