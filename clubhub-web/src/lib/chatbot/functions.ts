import { firestore } from '@/app/api/firebaseAdmin';

// Enhanced club search with better filtering and relevance scoring
export const searchClubs = async ({
  query,
  campus,
  limit = 5
}: {
  query: string;
  campus?: string;
  limit?: number;
}) => {
  try {
    const clubsRef = firestore.collection('Clubs');
    let queryRef: FirebaseFirestore.Query = clubsRef;
    
    if (campus) {
      queryRef = queryRef.where('campus', '==', campus);
    }
    
    // Get more results for better filtering, but not too many
    const snapshot = await queryRef.limit(Math.min(limit * 8, 100)).get();
    
    if (snapshot.empty) {
      console.log('No clubs found in database');
      return [];
    }
    
    const clubs = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      executives: undefined // Remove sensitive data
    }));
    
    // If no query, return first results (for general searches)
    if (!query || query.trim() === '') {
      return clubs.slice(0, limit);
    }
    
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    
    // Enhanced scoring system
    const scoredClubs = clubs.map((club: any) => {
      let score = 0;
      const name = (club.name || '').toLowerCase();
      const description = (club.description || '').toLowerCase();
      const clubText = `${name} ${description}`;
      
      // Exact name match (highest priority)
      if (name === queryLower) score += 100;
      
      // Name starts with query
      if (name.startsWith(queryLower)) score += 50;
      
      // Name contains exact query
      if (name.includes(queryLower)) score += 30;
      
      // Description contains exact query
      if (description.includes(queryLower)) score += 20;
      
      // Individual word matches
      queryWords.forEach(word => {
        if (name.includes(word)) score += 15;
        if (description.includes(word)) score += 8;
        
        // Partial word matches
        if (name.split(' ').some((nameWord: string) => nameWord.startsWith(word))) score += 10;
        if (description.split(' ').some((descWord: string) => descWord.startsWith(word))) score += 5;
      });
      
      // Boost for specific subjects
      const subjectBoosts = {
        'computer': ['computer', 'cs', 'programming', 'software', 'tech'],
        'science': ['science', 'research', 'academic'],
        'business': ['business', 'commerce', 'finance', 'entrepreneur'],
        'engineering': ['engineering', 'technical', 'robotics'],
        'arts': ['arts', 'creative', 'design', 'culture'],
        'music': ['music', 'band', 'orchestra', 'choir'],
        'sports': ['sports', 'athletic', 'fitness', 'recreation']
      };
      
      Object.entries(subjectBoosts).forEach(([subject, keywords]) => {
        if (queryLower.includes(subject)) {
          keywords.forEach(keyword => {
            if (clubText.includes(keyword)) score += 12;
          });
        }
      });
      
      return { ...club, _score: score };
    });
    
    // Filter out clubs with no relevance and sort by score
    const results = scoredClubs
      .filter((club: any) => club._score > 0)
      .sort((a: any, b: any) => b._score - a._score)
      .slice(0, limit)
      .map(({ _score, ...club }) => club); // Remove score from final result
    
    console.log(`Found ${results.length} relevant clubs for query: "${query}"`);
    return results;
    
  } catch (error) {
    console.error('Error searching clubs:', error);
    return [];
  }
};

// Improved getClubDetails with better error handling
export const getClubDetails = async (clubId: string) => {
  try {
    const docRef = firestore.collection('Clubs').doc(clubId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log(`Club not found: ${clubId}`);
      return { error: 'Club not found' };
    }
    
    const data = doc.data();
    if (!data) {
      return { error: 'Club data is empty' };
    }
    
    const { executives, ...publicData } = data;
    return { id: doc.id, ...publicData };
    
  } catch (error) {
    console.error(`Error fetching club details for ${clubId}:`, error);
    return { error: 'Failed to fetch club details' };
  }
};

// Enhanced post search with better text matching
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
  try {
    const postsRef = firestore.collection('Posts');
    let queryRef: FirebaseFirestore.Query = postsRef;
    
    if (campus) {
      queryRef = queryRef.where('campus', '==', campus);
    }
    
    if (category) {
      queryRef = queryRef.where('category', '==', category);
    }
    
    queryRef = queryRef.orderBy('date_posted', 'desc');
    
    // Get more results for better filtering
    const snapshot = await queryRef.limit(limit * 6).get();
    
    if (snapshot.empty) {
      console.log('No posts found in database');
      return [];
    }
    
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (!query || query.trim() === '') {
      return posts.slice(0, limit);
    }
    
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    
    // Enhanced text matching for posts
    const scoredPosts = posts.map((post: any) => {
      let score = 0;
      const title = (post.title || '').toLowerCase();
      const details = (post.details || '').toLowerCase();
      const hashtags = ((post.hashtags || []).join(' ')).toLowerCase();
      const postText = `${title} ${details} ${hashtags}`;
      
      // Title matches (highest priority)
      if (title.includes(queryLower)) score += 30;
      if (title.startsWith(queryLower)) score += 40;
      
      // Details matches
      if (details.includes(queryLower)) score += 20;
      
      // Hashtag matches
      if (hashtags.includes(queryLower)) score += 25;
      
      // Individual word matches
      queryWords.forEach(word => {
        if (title.includes(word)) score += 15;
        if (details.includes(word)) score += 10;
        if (hashtags.includes(word)) score += 12;
      });
      
      // Handle common abbreviations
      const abbreviations = {
        'cs': ['computer science', 'computer', 'programming'],
        'cssu': ['computer science student union'],
        'ai': ['artificial intelligence', 'machine learning'],
        'ml': ['machine learning', 'ai']
      };
      
      Object.entries(abbreviations).forEach(([abbr, expansions]) => {
        if (queryLower.includes(abbr)) {
          expansions.forEach(expansion => {
            if (postText.includes(expansion)) score += 15;
          });
        }
      });
      
      return { ...post, _score: score };
    });
    
    const results = scoredPosts
      .filter((post: any) => post._score > 0)
      .sort((a: any, b: any) => b._score - a._score)
      .slice(0, limit)
      .map(({ _score, ...post }) => post);
    
    console.log(`Found ${results.length} relevant posts for query: "${query}"`);
    return results;
    
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
};

// Enhanced event search with better date handling
export const getUpcomingEvents = async ({
  campus,
  daysAhead = 7,
  limit = 5
}: {
  campus?: string;
  daysAhead?: number;
  limit?: number;
}) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    let queryRef = firestore.collection('Posts')
      .where('category', '==', 'Event')
      .orderBy('date_occuring', 'asc'); // Order by event date
    
    if (campus) {
      queryRef = queryRef.where('campus', '==', campus);
    }
    
    const snapshot = await queryRef.get();
    
    if (snapshot.empty) {
      console.log('No events found in database');
      return [];
    }
    
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((event: any) => {
        if (!event.date_occuring) return false;
        
        try {
          const eventDate = new Date(event.date_occuring);
          return eventDate >= today && eventDate <= futureDate;
        } catch (error) {
          console.error('Invalid date format:', event.date_occuring);
          return false;
        }
      })
      .slice(0, limit);
    
    console.log(`Found ${results.length} upcoming events`);
    return results;
    
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
};

export const getCategories = async () => {
  try {
    const snapshot = await firestore.collection('Posts').get();
    
    const categories = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });
    
    return Array.from(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return ['General', 'Event', 'Announcement', 'Hiring Opportunity']; // Default categories
  }
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
  try {
    const postsRef = firestore.collection('Posts');
    let queryRef: FirebaseFirestore.Query = postsRef.where('category', '==', 'Event');
    
    if (campus) {
      queryRef = queryRef.where('campus', '==', campus);
    }
    
    queryRef = queryRef.orderBy('date_posted', 'desc');
    
    const snapshot = await queryRef.limit(limit * 6).get();
    
    const today = new Date();
    
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((event: any) => {
        // Enhanced text search including common location fields
        const searchFields = [
          event.title,
          event.details,
          event.location,
          event.venue,
          event.address
        ];
        
        const matchesQuery = searchFields.some(field => 
          field && field.toLowerCase().includes(query.toLowerCase())
        );
        
        if (!matchesQuery) return false;
        
        // Date filtering - only show future events unless includeExpired is true
        if (!includeExpired && event.date_occuring) {
          try {
            const eventDate = new Date(event.date_occuring);
            return eventDate >= today;
          } catch (error) {
            console.error('Invalid date format:', event.date_occuring);
            return false;
          }
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
  } catch (error) {
    console.error('Error searching events:', error);
    return [];
  }
};

export const getCampuses = () => {
  return ['UTSG', 'UTM', 'UTSC'];
};