import { gatherContext, keywords, matches } from '@/lib/chatbot/chatbotService';

const mockDb: Record<string, any[]> = {};

// Just enough of the Firestore query API for the chatbot's reads
jest.mock('../firebaseAdmin', () => {
  const query = (docs: any[]): any => ({
    select: () => query(docs),
    where: (field: string, _op: '>=', value: string) => query(docs.filter(doc => doc[field] >= value)),
    orderBy: (field: string, dir: 'asc' | 'desc') =>
      query([...docs].sort((a, b) => (a[field] > b[field] ? 1 : -1) * (dir === 'desc' ? -1 : 1))),
    limit: (n: number) => query(docs.slice(0, n)),
    get: async () => ({ docs: docs.map(({ id, ...data }) => ({ id, data: () => data })) }),
  });
  return { firestore: { collection: (name: string) => query(mockDb[name] ?? []) } };
});

const nextYear = new Date().getUTCFullYear() + 1;

beforeEach(() => {
  mockDb.Clubs = [
    { id: 'cssu', name: 'Computer Science Student Union', description: 'CS events', campus: 'UTSG', instagram: 'cssu' },
    { id: 'utat', name: 'University of Toronto Aerospace Team', description: 'Rockets and satellites', campus: 'UTSG', instagram: 'uoft_aerospaceteam' },
    { id: 'utmrobo', name: 'UTM Robotics', description: 'Build robots', campus: 'UTM' },
    { id: 'sgrobo', name: 'St. George Robotics Society', description: 'Robot competitions', campus: 'UTSG' },
  ];
  mockDb.Posts = [
    { id: 'p1', title: 'Rocket launch day', club: 'utat', campus: 'UTSG', category: 'Event', date_posted: '2026-09-01T00:00:00.000Z', date_occurring: `${nextYear}-01-15T18:00:00.000Z`, hashtags: [] },
    { id: 'p2', title: 'Old social', club: 'cssu', campus: 'UTSG', category: 'Event', date_posted: '2020-01-01T00:00:00.000Z', date_occurring: '2020-01-02T18:00:00.000Z', hashtags: [] },
    { id: 'p3', title: 'Mystery meetup', club: 'cssu', campus: 'UTSG', category: 'Event', date_posted: '2026-09-02T00:00:00.000Z', date_occurring: 'TBD', hashtags: [] },
  ];
});

it('short keywords only match whole words', () => {
  expect(matches(keywords('physics clubs'), 'Computer Science Student Union cs')).toBe(0);
  expect(matches(keywords('cs clubs'), 'Computer Science Student Union cs')).toBe(1);
  expect(matches(keywords('robot clubs'), 'UTM Robotics')).toBe(1);
});

it('filters clubs by the campus named in the question', async () => {
  const context = await gatherContext('any robotics clubs at UTM?');

  expect(context).toContain('ClubHub lists 4 clubs, 1 of them at UTM.');
  expect(context).toContain('UTM Robotics');
  expect(context).not.toContain('St. George Robotics Society');
});

it('finds posts by the club that made them', async () => {
  const context = await gatherContext('anything from the aerospace team?');

  expect(context).toContain('Posts matching the question:\n- "Rocket launch day" by University of Toronto Aerospace Team');
});

it('lists only real upcoming dates and labels non-matches as such', async () => {
  const context = await gatherContext('hi');

  expect(context).toContain("No club matched the question's keywords. Some clubs, not search results:");
  expect(context).toContain(`Upcoming dated posts, soonest first:\n- "Rocket launch day"`);
  expect(context).toContain(`happens Jan 15, ${nextYear}, 6:00 PM`);
  expect(context).not.toContain('Old social');
  expect(context).not.toContain('Mystery meetup');
});
