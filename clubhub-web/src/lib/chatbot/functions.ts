import { firestore } from '@/app/api/firebaseAdmin';

export const searchClubs = async ({
  query,
  campus,
  limit = 5
}: {
  query: string;
  campus?: string;
  limit?: number;
}) => {
  const clubsRef = firestore.collection('Clubs');
  let queryRef: FirebaseFirestore.Query = clubsRef;
  
  if (campus) {
    queryRef = queryRef.where('campus', '==', campus);
  }
  
  const snapshot = await queryRef.limit(limit * 4).get(); // More dynamic limit
  
  const results = snapshot.docs
    .map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      executives: undefined
    }))
    .filter((club: any) => 
      club.name?.toLowerCase().includes(query.toLowerCase()) ||
      club.description?.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, limit);
    
  return results;
};

export const getClubDetails = async ({ clubId }: { clubId: string }) => {
  const docRef = firestore.collection('Clubs').doc(clubId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    return { error: 'Club not found' };
  }
  
  const data = doc.data();
  const { executives, ...publicData } = data || {};
  return { id: doc.id, ...publicData };
};

export const searchPosts = async ({
  query,
  campus,
  category,
  limit = 5
}: {
  query: string;
  campus?: string;
  category?: string;
  limit?: number;
}) => {
  const postsRef = firestore.collection('Posts');
  let queryRef: FirebaseFirestore.Query = postsRef;
  
  if (campus) {
    queryRef = queryRef.where('campus', '==', campus);
  }
  
  if (category) {
    queryRef = queryRef.where('category', '==', category);
  }
  
  queryRef = queryRef.orderBy('date_posted', 'desc');
  
  const snapshot = await queryRef.limit(limit * 4).get(); // More dynamic
  
  const results = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((post: any) => 
      (post.title && post.title.toLowerCase().includes(query.toLowerCase())) ||
      (post.details && post.details.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, limit);
    
  return results;
};

export const getUpcomingEvents = async ({
  campus,
  daysAhead = 7,
  limit = 5 // Added limit parameter
}: {
  campus?: string;
  daysAhead?: number;
  limit?: number; // Added this
}) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);
  
  let queryRef = firestore.collection('Posts')
    .where('category', '==', 'Event');
  
  if (campus) {
    queryRef = queryRef.where('campus', '==', campus);
  }
  
  const snapshot = await queryRef.get();
  
  const results = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((post: any) => {
      if (!post.date_occuring) return false;
      const eventDate = new Date(post.date_occuring);
      return eventDate >= today && eventDate <= futureDate;
    })
    .sort((a: any, b: any) => {
      return new Date(a.date_occuring).getTime() - new Date(b.date_occuring).getTime();
    })
    .slice(0, limit); // Use parameter instead of hardcoded 5
  
  return results;
};

export const getCategories = async () => {
  const snapshot = await firestore.collection('Posts').get(); // Get all posts
  
  const categories = new Set<string>();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.category) {
      categories.add(data.category);
    }
  });
  
  return Array.from(categories);
};

// Search for events with text and date filtering (ENHANCED for location support)
export const searchEvents = async ({
  query,
  campus,
  includeExpired = false,
  limit = 5
}: {
  query: string;
  campus?: string;
  includeExpired?: boolean;
  limit?: number;
}) => {
  const postsRef = firestore.collection('Posts');
  let queryRef: FirebaseFirestore.Query = postsRef.where('category', '==', 'Event');
  
  if (campus) {
    queryRef = queryRef.where('campus', '==', campus);
  }
  
  queryRef = queryRef.orderBy('date_posted', 'desc');
  
  const snapshot = await queryRef.limit(limit * 6).get(); // Get more for better filtering
  
  const today = new Date();
  
  const results = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((event: any) => {
      // Enhanced text search including common location fields
      const searchFields = [
        event.title,
        event.details,
        event.location, // if location is a separate field
        event.venue,    // if venue is a separate field
        event.address   // if address is a separate field
      ];
      
      const matchesQuery = searchFields.some(field => 
        field && field.toLowerCase().includes(query.toLowerCase())
      );
      
      if (!matchesQuery) return false;
      
      // Date filtering - only show future events unless includeExpired is true
      if (!includeExpired && event.date_occuring) {
        const eventDate = new Date(event.date_occuring);
        return eventDate >= today;
      }
      
      return true;
    })
    .sort((a: any, b: any) => {
      // Sort by event date if available
      if (a.date_occuring && b.date_occuring) {
        return new Date(a.date_occuring).getTime() - new Date(b.date_occuring).getTime();
      }
      return 0;
    })
    .slice(0, limit);
    
  return results;
};

// NEW FUNCTION: Get event location information specifically
export const getEventLocation = async ({
  eventQuery,
  campus
}: {
  eventQuery: string;
  campus?: string;
}) => {
  // Use the existing searchEvents function but with focus on location
  const events = await searchEvents({
    query: eventQuery,
    campus,
    includeExpired: false,
    limit: 3
  });
  
  // Return events with emphasis on location information
  return events.map((event: any) => ({
    id: event.id,
    title: event.title,
    date_occuring: event.date_occuring,
    location: event.location || extractLocationFromDetails(event.details),
    venue: event.venue,
    address: event.address,
    campus: event.campus,
    details: event.details
  }));
};

// Helper function to extract location from details if it's embedded in text
const extractLocationFromDetails = (details: string): string | null => {
  if (!details) return null;
  
  // Look for common location patterns in the details
  const locationPatterns = [
    /location:?\s*([^\n\r.]+)/i,
    /venue:?\s*([^\n\r.]+)/i,
    /at\s+([A-Z][^\n\r.]+(?:building|hall|room|center|centre))/i,
    /room\s+(\w+\d+)/i,
    /address:?\s*([^\n\r.]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = details.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
};

export const getCampuses = () => { // Removed unnecessary async
  return ['UTSG', 'UTM', 'UTSC'];
};