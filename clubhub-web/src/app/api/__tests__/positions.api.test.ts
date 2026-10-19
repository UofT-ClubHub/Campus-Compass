import { NextRequest } from 'next/server';
import { GET as getPositions, PATCH as savePosition, DELETE as deletePosition } from '../positions/route';
import { GET as getApplications, POST as apply } from '../submitted-applications/route';

// In-memory Firestore keyed by full document path, e.g. 'Clubs/A/OpenPositions/p1'
const mockDb: Record<string, any> = {};
let autoId = 0;

jest.mock('firebase-admin', () => ({
  firestore: { FieldValue: { arrayUnion: (...values: any[]) => ({ arrayUnion: values }), delete: () => undefined } },
}));

jest.mock('../firebaseAdmin', () => {
  const snap = (path: string): any => ({
    id: path.split('/').pop(),
    exists: path in mockDb,
    data: () => mockDb[path] && { ...mockDb[path] },
    ref: docRef(path),
  });
  const docRef = (path: string): any => ({
    id: path.split('/').pop(),
    get: async () => snap(path),
    set: async (data: any) => { mockDb[path] = { ...data }; },
    update: async (data: any) => {
      if (!(path in mockDb)) throw new Error(`NOT_FOUND: ${path}`);
      for (const [key, value] of Object.entries(data)) {
        mockDb[path][key] = (value as any)?.arrayUnion
          ? [...new Set([...(mockDb[path][key] ?? []), ...(value as any).arrayUnion])]
          : value;
      }
    },
    delete: async () => { delete mockDb[path]; },
    collection: (name: string) => collection(`${path}/${name}`),
  });
  const collection = (path: string, filters: [string, any][] = []): any => ({
    doc: (id = `auto${++autoId}`) => docRef(`${path}/${id}`),
    add: async (data: any) => { const ref = docRef(`${path}/auto${++autoId}`); await ref.set(data); return ref; },
    where: (field: string, _op: string, value: any) => collection(path, [...filters, [field, value]]),
    get: async () => {
      const docs = Object.keys(mockDb)
        .filter(key => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/'))
        .map(snap)
        .filter(doc => filters.every(([field, value]) => doc.data()[field] === value));
      return { empty: docs.length === 0, docs };
    },
  });
  const batch = () => {
    const ops: (() => Promise<void>)[] = [];
    return {
      set: (ref: any, data: any) => ops.push(() => ref.set(data)),
      update: (ref: any, data: any) => ops.push(() => ref.update(data)),
      delete: (ref: any) => ops.push(() => ref.delete()),
      commit: async () => { for (const op of ops) await op(); },
    };
  };
  return {
    auth: { verifyIdToken: async (token: string) => ({ uid: token, email: `${token}@mail.utoronto.ca`, email_verified: true }) },
    firestore: { collection: (name: string) => collection(name), batch },
  };
});

const request = (method: string, path: string, uid?: string, body?: object) =>
  new NextRequest(`http://localhost${path}`, {
    method,
    headers: uid ? { Authorization: `Bearer ${uid}` } : {},
    body: body && JSON.stringify(body),
  });

// The bodies the applications page and PositionCard send
const newPosition = {
  positionId: 'pos-123', currentStatus: 'open', status: 'open', title: 'Treasurer', description: 'Money',
  requirements: ['Excel'], questions: { Q1: { question: 'Why?', type: 'text' } }, deadline: null,
};
const createPosition = async () => {
  const res = await savePosition(request('PATCH', '/api/positions?id=A', 'execA', newPosition));
  expect(res.status).toBe(200);
  return (await res.json()).positionId as string;
};

beforeEach(() => {
  for (const key of Object.keys(mockDb)) delete mockDb[key];
  Object.assign(mockDb, {
    'Users/student': { id: 'student', is_admin: false, is_executive: false, managed_clubs: [] },
    'Users/execA': { id: 'execA', is_admin: false, is_executive: true, managed_clubs: ['A'] },
    'Clubs/A': { id: 'A', name: 'Club A', executives: ['execA'] },
  });
});

it('an exec creates a position, a student applies, and the exec sees it as pending', async () => {
  const positionId = await createPosition();

  const fetched = await (await getPositions(request('GET', `/api/positions?id=A&positionId=${positionId}`))).json();
  expect(fetched.position).toMatchObject({ id: positionId, title: 'Treasurer', status: 'open' });

  const applied = await apply(request('POST', '/api/submitted-applications', 'student', {
    clubId: 'A', positionId, userId: 'student', answers: { Q1: 'Because' }, isFinalSubmission: true,
  }));
  expect(applied.status).toBe(200);

  const apps = await (await getApplications(request('GET', `/api/submitted-applications?clubId=A&positionId=${positionId}`, 'execA'))).json();
  expect(apps).toEqual([expect.objectContaining({ userId: 'student', status: 'pending', answers: { Q1: 'Because' } })]);
  expect(mockDb[`Clubs/A/OpenPositions/${positionId}`].applicants).toEqual(['student']);
});

it('an exec edit cannot overwrite server-controlled fields', async () => {
  const positionId = await createPosition();
  await apply(request('POST', '/api/submitted-applications', 'student', {
    clubId: 'A', positionId, userId: 'student', answers: { Q1: 'x' }, isFinalSubmission: true,
  }));

  const res = await savePosition(request('PATCH', '/api/positions?id=A', 'execA', {
    ...newPosition, positionId, title: 'Renamed', applicants: [], date_posted: 'forged',
  }));

  expect(res.status).toBe(200);
  expect(mockDb[`Clubs/A/OpenPositions/${positionId}`]).toMatchObject({ title: 'Renamed', applicants: ['student'], status: 'open' });
  expect(mockDb[`Clubs/A/OpenPositions/${positionId}`].date_posted).not.toBe('forged');
});

it('a student cannot create a position', async () => {
  const res = await savePosition(request('PATCH', '/api/positions?id=A', 'student', newPosition));

  expect(res.status).toBe(403);
  expect(Object.keys(mockDb).some(key => key.includes('Positions'))).toBe(false);
});

it('closing a position moves it, blocks applications, and it can still be deleted', async () => {
  const positionId = await createPosition();

  const closed = await savePosition(request('PATCH', '/api/positions?id=A', 'execA', {
    ...newPosition, positionId, currentStatus: 'closed', status: 'closed',
  }));
  expect(closed.status).toBe(200);
  expect(mockDb[`Clubs/A/OpenPositions/${positionId}`]).toBeUndefined();
  expect(mockDb[`Clubs/A/ClosedPositions/${positionId}`]).toMatchObject({ status: 'closed', title: 'Treasurer' });

  const applied = await apply(request('POST', '/api/submitted-applications', 'student', {
    clubId: 'A', positionId, userId: 'student', answers: { Q1: 'x' }, isFinalSubmission: true,
  }));
  expect(applied.status).toBe(404);

  const deleted = await deletePosition(request('DELETE', `/api/positions?positionId=${positionId}&clubId=A&isOpenPosition=false`, 'execA'));
  expect(deleted.status).toBe(200);
  expect(mockDb[`Clubs/A/ClosedPositions/${positionId}`]).toBeUndefined();
});

it('a legacy closed position left in OpenPositions refuses applications and can be deleted', async () => {
  mockDb['Clubs/A/OpenPositions/old'] = { id: 'old', title: 'Old', status: 'closed' };

  const applied = await apply(request('POST', '/api/submitted-applications', 'student', {
    clubId: 'A', positionId: 'old', userId: 'student', answers: { Q1: 'x' }, isFinalSubmission: true,
  }));
  expect(applied.status).toBe(400);

  const deleted = await deletePosition(request('DELETE', '/api/positions?positionId=old&clubId=A&isOpenPosition=false', 'execA'));
  expect(deleted.status).toBe(200);
  expect(mockDb['Clubs/A/OpenPositions/old']).toBeUndefined();
});

it("a club's position list is not cut off at 10", async () => {
  for (let i = 0; i < 12; i++) mockDb[`Clubs/A/${i % 2 ? 'Open' : 'Closed'}Positions/p${i}`] = { title: `P${i}` };

  const res = await getPositions(request('GET', '/api/positions?id=A&show_open=true&show_closed=true'));

  expect(await res.json()).toHaveLength(12);
});
