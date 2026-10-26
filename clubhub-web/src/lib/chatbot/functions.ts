import { firestore } from '@/app/api/firebaseAdmin';

// shortcut: reads every club on each message (like /api/posts text search does); cache it or move to vector search if Clubs grows into the thousands
export const getClubs = async () => {
  const snapshot = await firestore.collection('Clubs')
    .select('name', 'description', 'campus', 'instagram', 'links')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
};

// Single-field orderBy, so no composite index is needed
export const getRecentPosts = async (limit = 200) => {
  const snapshot = await firestore.collection('Posts')
    .orderBy('date_posted', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
};

// Posts with a date_occurring from now on, soonest first; dates are ISO-like strings, so string order is date order
export const getUpcomingPosts = async (limit = 50) => {
  const snapshot = await firestore.collection('Posts')
    .where('date_occurring', '>=', new Date().toISOString().slice(0, 10))
    .orderBy('date_occurring', 'asc')
    .limit(limit)
    .get();
  return (snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[])
    // Non-date strings like "TBD" sort after digits and would pass the range filter
    .filter(post => /^\d{4}-\d{2}-\d{2}/.test(post.date_occurring));
};

// Every club's OpenPositions in one read; club is the parent club's id
export const getOpenPositions = async () => {
  const snapshot = await firestore.collectionGroup('OpenPositions').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), club: doc.ref.parent.parent?.id })) as any[];
};
