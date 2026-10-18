import { NextRequest } from 'next/server';
import { POST as createUser, PUT as updateUser } from '../users/route';
import { GET as getPendingClubs, PUT as reviewPendingClub } from '../pending-clubs/route';
import { PUT as updateClub } from '../clubs/route';

// In-memory Firestore: { collection: { docId: data } }
const mockDb: Record<string, Record<string, any>> = {};

jest.mock('../firebaseAdmin', () => {
  const docRef = (col: string, id: string): any => ({
    id,
    get: async () => ({ id, exists: !!mockDb[col]?.[id], data: () => mockDb[col]?.[id] && { ...mockDb[col][id] }, ref: docRef(col, id) }),
    set: async (data: any) => { (mockDb[col] ??= {})[id] = { ...data }; },
    update: async (data: any) => { mockDb[col][id] = { ...mockDb[col][id], ...data }; },
  });
  const collection = (col: string) => ({
    doc: (id: string) => docRef(col, id),
    add: async (data: any) => {
      const id = `${col}-new-${Object.keys(mockDb[col] ??= {}).length}`;
      mockDb[col][id] = { ...data };
      return docRef(col, id);
    },
    orderBy: () => ({ get: async () => ({ docs: Object.keys(mockDb[col] ?? {}).map(id => ({ id, data: () => ({ ...mockDb[col][id] }) })) }) }),
  });
  return {
    // The bearer token is the uid
    auth: { verifyIdToken: async (token: string) => ({ uid: token, email: `${token}@mail.utoronto.ca` }) },
    firestore: { collection },
    admin: { storage: () => ({}) },
  };
});

const request = (method: string, path: string, uid: string, body?: object) =>
  new NextRequest(`http://localhost${path}`, {
    method,
    headers: { Authorization: `Bearer ${uid}` },
    body: body && JSON.stringify(body),
  });

beforeEach(() => {
  for (const col of Object.keys(mockDb)) delete mockDb[col];
  Object.assign(mockDb, {
    Users: {
      student: { id: 'student', name: 'Student', is_admin: false, is_executive: false, managed_clubs: [] },
      execA: { id: 'execA', name: 'Exec A', is_admin: false, is_executive: true, managed_clubs: ['A'] },
      execB: { id: 'execB', name: 'Exec B', is_admin: false, is_executive: true, managed_clubs: ['B'] },
    },
    Clubs: {
      A: { id: 'A', name: 'Club A', executives: ['execA'], followers: 3 },
      B: { id: 'B', name: 'Club B', executives: ['execB'], followers: 0 },
    },
    Pending_Clubs: {
      p1: { user: 'student', club_name: 'Mine', club_campus: 'UTSG', club_image: '', status: 'pending' },
      p2: { user: 'execB', club_name: 'Theirs', club_campus: 'UTSG', club_image: '', status: 'pending' },
    },
  });
});

it('T1: POST /api/users ignores client-supplied roles and email', async () => {
  const res = await createUser(request('POST', '/api/users', 'newbie', {
    id: 'newbie', name: 'x', email: 'spoof@x.com', is_admin: true, is_executive: true, managed_clubs: ['c1'],
  }));

  expect(res.status).toBe(201);
  expect(mockDb.Users.newbie).toEqual({
    id: 'newbie', name: 'x', email: 'newbie@mail.utoronto.ca', campus: '', bio: '',
    followed_clubs: [], liked_posts: [], is_admin: false, is_executive: false, managed_clubs: [],
  });
});

it('T2: a non-admin cannot approve a club request, even their own', async () => {
  const before = structuredClone(mockDb);

  const res = await reviewPendingClub(request('PUT', '/api/pending-clubs?id=p1&action=approve', 'student'));

  expect(res.status).toBe(403);
  expect(mockDb).toEqual(before);
});

it('T3: a non-admin only gets their own club requests', async () => {
  const res = await getPendingClubs(request('GET', '/api/pending-clubs?user=execB', 'student'));

  expect(res.status).toBe(200);
  expect((await res.json()).map((club: any) => club.id)).toEqual(['p1']);
});

it('T4: an exec cannot remove someone from a club they do not manage', async () => {
  const before = structuredClone(mockDb);

  const res = await updateUser(request('PUT', '/api/users', 'execA', { id: 'execB', managed_clubs: ['A'] }));

  expect(res.status).toBe(403);
  expect(mockDb).toEqual(before);
});

it('an exec can still add a user to a club they manage', async () => {
  const res = await updateUser(request('PUT', '/api/users', 'execA', { id: 'student', managed_clubs: ['A'] }));

  expect(res.status).toBe(200);
  expect(mockDb.Users.student).toMatchObject({ is_executive: true, managed_clubs: ['A'] });
});

it('T5: PUT /api/clubs only writes editable fields', async () => {
  const res = await updateClub(request('PUT', '/api/clubs?id=A', 'execA', { name: 'New', executives: ['attacker'] }));

  expect(res.status).toBe(200);
  expect(mockDb.Clubs.A).toEqual({ id: 'A', name: 'New', executives: ['execA'], followers: 3 });
});
