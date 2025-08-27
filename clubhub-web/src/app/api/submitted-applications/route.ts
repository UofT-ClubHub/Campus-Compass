import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/app/api/firebaseAdmin";
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const authResult = (request as any).auth; // Added by middleware
    const { searchParams } = request.nextUrl;
    const clubId = searchParams.get("clubId");
    const userId = searchParams.get("userId");
    const positionId = searchParams.get("positionId");
    const status = searchParams.get("status"); // Filter by status
    
    // Pagination parameters
    const offset = parseInt(searchParams.get("offset") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!clubId && !userId) {
      return NextResponse.json(
        { error: "Either clubId or userId must be provided" },
        { status: 400 }
      );
    }

    let applications: any[] = [];

    if (clubId) { // will be used by execs to check applications for a specific club
      // Check if club exists (for both admin and non-admin users)
      const clubDoc = await firestore.collection("Clubs").doc(clubId).get();
      if (!clubDoc.exists) {
        return NextResponse.json({ error: "Club not found" }, { status: 404 });
      }

      // Authentication check for club access
      if (!authResult.isAdmin) {
        const clubData = clubDoc.data();
        const executives = clubData?.executives || [];
        if (!executives.includes(authResult.uid)) {
          return NextResponse.json({ error: "Forbidden - Not an executive of this club or admin" }, { status: 403 });
        }
      }

      // Get applications for a specific club
      const applicationsRef = firestore.collection("Clubs").doc(clubId).collection("submittedApplications");
      const snapshot = await applicationsRef.get();
      
      applications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } else if (userId) { // will be used by students to check their own applications (profile page)

      const userDoc = await firestore.collection("Users").doc(userId).get();
      if (!userDoc.exists) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Authentication check for user access
      if (!authResult.isAdmin && authResult.uid !== userId) {
        return NextResponse.json({ error: "Forbidden - Can only view your own applications" }, { status: 403 });
      }

      // Get applications for a specific user
      const applicationsRef = firestore.collection("Users").doc(userId).collection("submittedApplications");
      const snapshot = await applicationsRef.get();
      
      applications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    // Filter by positionId if provided
    if (positionId) {
      applications = applications.filter((app) => app.positionId === positionId);
    }

    // Filter by status if provided
    if (status) {
      applications = applications.filter((app) => app.status === status);
    }

    // Apply pagination
    const paginatedApplications = applications.slice(offset, offset + limit);

    return NextResponse.json(paginatedApplications, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching submitted applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch submitted applications" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest) => { // used to submit or save an application (students will call this endpoint)
    try {
        const authResult = (request as any).auth; // Added by middleware

        const body = await request.json();
        const { answers, clubId, userId, positionId, isFinalSubmission = false } = body; // isFinalSubmission is true if they click submit button. its false if they click the save application button

        if (!clubId || !userId || !positionId || !answers) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
            return NextResponse.json({ error: "Answers must be a non-empty object" }, { status: 400 });
        }

        if (authResult.uid !== userId && !authResult.isAdmin) {
            return NextResponse.json({ error: "Forbidden - Can only submit applications for yourself" }, { status: 403 });
        }

        const clubDoc = await firestore.collection("Clubs").doc(clubId).get();
        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 });
        }
        
        const userDoc = await firestore.collection("Users").doc(userId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        // Check if position exists in the club's openPositions
        const clubData = clubDoc.data();
        const openPositions = clubData?.openPositions || [];
        
        const positionExists = openPositions.some((pos: any) => pos.positionId === positionId);
        if (!positionExists) {
            return NextResponse.json({ error: "Position not found in open positions" }, { status: 404 });
        }
        
        // Check if user has already applied to this position
        const existingApplicationsRef = firestore.collection("Clubs").doc(clubId).collection("submittedApplications");
        const existingApplicationsSnapshot = await existingApplicationsRef
            .where("userId", "==", userId)
            .where("positionId", "==", positionId)
            .get();
        
        if (!existingApplicationsSnapshot.empty) { // application already exists
            const existingDoc = existingApplicationsSnapshot.docs[0];
            const existingData = existingDoc.data();
            
            // update existing draft (save button clicked on an existing draft)
            if (existingData.status === 'draft' && !isFinalSubmission) {
                // Update existing draft
                await existingDoc.ref.update({ 
                    answers, 
                    submittedAt: new Date().toISOString() 
                });
                
                // Also update in User's subcollection
                const userApplicationRef = firestore.collection("Users").doc(userId).collection("submittedApplications").doc(existingDoc.id);
                await userApplicationRef.update({ 
                    answers, 
                    submittedAt: new Date().toISOString() 
                });
                
                return NextResponse.json({ message: "Draft updated successfully" }, { status: 200 });
            } else if (existingData.status === 'pending' || existingData.status === 'approved' || existingData.status === 'rejected') {
                return NextResponse.json({ error: "You have already submitted a final application for this position" }, { status: 409 });
            } else if (existingData.status === 'draft' && isFinalSubmission) { // submit button clicked on an existing draft
                // Convert draft to final submission
                await existingDoc.ref.update({ 
                    status: 'pending',
                    answers, 
                    submittedAt: new Date().toISOString() 
                });
                
                // Also update in User's subcollection
                const userApplicationRef = firestore.collection("Users").doc(userId).collection("submittedApplications").doc(existingDoc.id);
                await userApplicationRef.update({ 
                    status: 'pending',
                    answers, 
                    submittedAt: new Date().toISOString() 
                });

                // add userId to the clubs openPositions applicants array
                const openPositions = clubData?.openPositions || [];
                const positionIndex = openPositions.findIndex((pos: any) => pos.positionId === positionId);
                if (positionIndex !== -1) {
                    if (!openPositions[positionIndex].applicants) {
                        openPositions[positionIndex].applicants = [];
                    }
                    openPositions[positionIndex].applicants.push(userId);
                    await firestore.collection("Clubs").doc(clubId).update({ openPositions });
                }

                return NextResponse.json({ message: "Application submitted successfully" }, { status: 200 });
            }
        }
        
        // Generate application ID for new application (works for both final submission and draft)
        const applicationRef = firestore.collection("Clubs").doc(clubId).collection("submittedApplications").doc();
        const applicationData = {
            id: applicationRef.id,
            clubId: clubId,
            userId: userId,
            positionId: positionId,
            status: isFinalSubmission ? "pending" : "draft",
            submittedAt: new Date().toISOString(),
            answers: answers,
        };

        // Create application in Club's subcollection
        await applicationRef.set(applicationData);
        
        // Create the same application in User's subcollection
        // the document id in users's subcollection is the same as the club's subcollection
        const userApplicationRef = firestore.collection("Users").doc(userId).collection("submittedApplications").doc(applicationRef.id);
        await userApplicationRef.set(applicationData);

        if (isFinalSubmission) {
            // add userId to the clubs openPositions applicants array
            const openPositions = clubData?.openPositions || [];
            const positionIndex = openPositions.findIndex((pos: any) => pos.positionId === positionId);
            if (positionIndex !== -1) {
                if (!openPositions[positionIndex].applicants) {
                    openPositions[positionIndex].applicants = [];
                }
                openPositions[positionIndex].applicants.push(userId);
                await firestore.collection("Clubs").doc(clubId).update({ openPositions });
            }
        }

        return NextResponse.json({ message: "Application submitted/saved successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
          { error: "Failed to submit application" },
          { status: 500 }
        );
      }
});

export const PATCH = withAuth(async (request: NextRequest) => { // used to update status of an application (executives will call this endpoint)
    try {
        const authResult = (request as any).auth; // Added by middleware

        const body = await request.json();
        const { applicationId, status, clubId, userId } = body;

        if (!applicationId || !status || !clubId || !userId) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        const clubDoc = await firestore.collection("Clubs").doc(clubId).get();
        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 });
        }

        const userDoc = await firestore.collection("Users").doc(userId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Authorization check: only admins or club executives can update application status
        if (!authResult.isAdmin) {
            const clubData = clubDoc.data();
            const executives = clubData?.executives || [];
            if (!executives.includes(authResult.uid)) {
                return NextResponse.json({ error: "Forbidden - Not an executive of this club or admin" }, { status: 403 });
            }
        }

        const applicationRef = firestore.collection("Clubs").doc(clubId).collection("submittedApplications").doc(applicationId);
        const applicationDoc = await applicationRef.get();
        if (!applicationDoc.exists) {
            return NextResponse.json({ error: "Application not found in club's subcollection" }, { status: 404 });
        }

        const userApplicationRef = firestore.collection("Users").doc(userId).collection("submittedApplications").doc(applicationId);
        const userApplicationDoc = await userApplicationRef.get();
        if (!userApplicationDoc.exists) {
            return NextResponse.json({ error: "Application not found in user's subcollection" }, { status: 404 });
        }
        
        await applicationRef.update({ status });
        await userApplicationRef.update({ status });

        return NextResponse.json({ message: "Application status updated successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
          { error: "Failed to update application status" },
          { status: 500 }
        );
    }
});

export const DELETE = withAuth(async (request: NextRequest) => {
    try {
        const authResult = (request as any).auth; // Added by middleware

        const body = await request.json();
        const { applicationId, clubId, userId } = body;

        if (!applicationId || !clubId || !userId) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        const clubDoc = await firestore.collection("Clubs").doc(clubId).get();
        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 });
        }

        if (!authResult.isAdmin) {
            // check if the user is an executive of the club
            const clubData = clubDoc.data();
            const executives = clubData?.executives || [];
            if (!executives.includes(authResult.uid)) {
                return NextResponse.json({ error: "Forbidden - Not an executive of this club or admin" }, { status: 403 });
            }
        }

        const userDoc = await firestore.collection("Users").doc(userId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        const applicationRef = firestore.collection("Clubs").doc(clubId).collection("submittedApplications").doc(applicationId);
        const applicationDoc = await applicationRef.get();
        if (!applicationDoc.exists) {
            return NextResponse.json({ error: "Application not found in club's subcollection" }, { status: 404 });
        }
        

        const userApplicationRef = firestore.collection("Users").doc(userId).collection("submittedApplications").doc(applicationId);
        const userApplicationDoc = await userApplicationRef.get();
        if (!userApplicationDoc.exists) {
            return NextResponse.json({ error: "Application not found in user's subcollection" }, { status: 404 });
        }

        await applicationRef.delete();
        await userApplicationRef.delete();

        return NextResponse.json({ message: "Application deleted successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
          { error: "Failed to delete application" },
          { status: 500 }
        );
    }
});
