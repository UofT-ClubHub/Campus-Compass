import { Club } from '@/model/types';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../firebaseAdmin';

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
      let positions = clubData.positions || [];

      // Sort positions by date_posted
      if (sortBy && ["date_posted"].includes(sortBy)) {
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

      // Add club information to each position
      const positionsWithClub = positions.map((position: any) => ({
        ...position,
        clubId: doc.id,
        clubName: clubData.name,
        clubCampus: clubData.campus,
        clubDepartment: clubData.department,
        clubDescription: clubData.description
      }));

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
      if (club.positions && Array.isArray(club.positions)) {
        club.positions.forEach((position: any) => {
          // Add club information to each position
          const positionWithClub = {
            ...position,
            clubId: club.id,
            clubName: club.name,
            clubCampus: club.campus,
            clubDepartment: club.department,
            clubDescription: club.description
          };
          allPositions.push(positionWithClub);
        });
      }
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

    // Sort positions by date_posted
    if (sortBy && ["date_posted"].includes(sortBy)) {
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

export async function PATCH(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const clubId = searchParams.get("id");
        if (!clubId) {
            return NextResponse.json({ message: "Club ID is required" }, { status: 400 });
        }

        const clubDoc = await firestore.collection("Clubs").doc(clubId).get();
        if (!clubDoc.exists) {
            return NextResponse.json({ message: "Club not found" }, { status: 404 });
        }

        const clubData = clubDoc.data() as Club;
        const newPositionData = await request.json();
        const { title, ...positionFields } = newPositionData;

        if (!title) {
            return NextResponse.json({ message: "Position title is required" }, { status: 400 });
        }

        let positions = clubData.positions || [];
        let positionFound = false;

        // Loop through existing positions to find matching title
        positions = positions.map((position: any) => {
            if (position.title === title) {
                positionFound = true;
                return { ...position, ...positionFields };
            }
            return position;
        });

        // If position not found, add new position
        if (!positionFound) {
            positions.push({ title, ...positionFields });
        }

        // Update the club with new positions array
        await firestore.collection("Clubs").doc(clubId).update({ positions });
        
        return NextResponse.json({ 
            message: positionFound ? "Position updated successfully" : "Position added successfully" 
        }, { status: 200 });
    }
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}