import { firestore } from '@/app/api/firebaseAdmin';

// Search clubs by name, campus, or description
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
  let queryRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = clubsRef;
  
  // Apply campus filter if provided
  if (campus) {
    queryRef = queryRef.where('campus', '==', campus);
  }
  
  const snapshot = await queryRef.limit(20).get();
  
  // Client-side filtering for text search
  const results = snapshot.docs
    .map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      executives: undefined // Remove executives for privacy
    }))
    .filter((club: any) => 
      club.name?.toLowerCase().includes(query.toLowerCase()) ||
      club.description?.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, limit);
    
  return results;
};

// Get club details
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

// Search posts
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
  let queryRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = postsRef;
  
  if (campus) {
    queryRef = queryRef.where('campus', '==', campus);
  }
  
  if (category) {
    queryRef = queryRef.where('category', '==', category);
  }
  
  queryRef = queryRef.orderBy('date_posted', 'desc');
  
  const snapshot = await queryRef.limit(20).get();
  
  const results = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((post: any) => 
      (post.title && post.title.toLowerCase().includes(query.toLowerCase())) ||
      (post.details && post.details.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, limit);
    
  return results;
};

// Get upcoming events
export const getUpcomingEvents = async ({
  campus,
  daysAhead = 7
}: {
  campus?: string;
  daysAhead?: number;
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
    .slice(0, 5);
  
  return results;
};

// Get categories
export const getCategories = async () => {
  const snapshot = await firestore.collection('Posts').limit(100).get();
  
  const categories = new Set<string>();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.category) {
      categories.add(data.category);
    }
  });
  
  return Array.from(categories);
};

// Get campuses
export const getCampuses = async () => {
  return ['UTSG', 'UTM', 'UTSC'];
};