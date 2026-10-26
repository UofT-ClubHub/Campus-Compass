import { answer, createTools, keywords, matches } from '@/lib/chatbot/chatbotService';

const mockDb: Record<string, any[]> = {};

// Just enough of the Firestore query API for the chatbot's reads; clubId stands in for an OpenPositions doc's parent club
jest.mock('../firebaseAdmin', () => {
  const query = (docs: any[]): any => ({
    select: () => query(docs),
    where: (field: string, _op: '>=', value: string) => query(docs.filter(doc => doc[field] >= value)),
    orderBy: (field: string, dir: 'asc' | 'desc') =>
      query([...docs].sort((a, b) => (a[field] > b[field] ? 1 : -1) * (dir === 'desc' ? -1 : 1))),
    limit: (n: number) => query(docs.slice(0, n)),
    get: async () => ({
      docs: docs.map(({ id, clubId, ...data }) => ({ id, data: () => data, ref: { parent: { parent: { id: clubId } } } })),
    }),
  });
  const collection = (name: string) => query(mockDb[name] ?? []);
  return { firestore: { collection, collectionGroup: collection } };
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
    { id: 'p4', title: 'Exec applications are open', club: 'cssu', campus: 'UTSG', category: 'Hiring Opportunity', date_posted: '2026-09-03T00:00:00.000Z', hashtags: [] },
  ];
  mockDb.OpenPositions = [
    { id: 'pos1', clubId: 'utat', title: 'Avionics Lead', status: 'open', deadline: `${nextYear}-01-01` },
    { id: 'pos2', clubId: 'cssu', title: 'Treasurer', status: 'open', deadline: '2020-01-01' },
    { id: 'pos3', clubId: 'cssu', title: 'Secretary', status: 'closed' },
  ];
});

it('short keywords only match whole words and plurals match the singular', () => {
  expect(matches(keywords('physics clubs'), 'Computer Science Student Union cs')).toBe(0);
  expect(matches(keywords('cs clubs'), 'Computer Science Student Union cs')).toBe(1);
  expect(matches(keywords('robot clubs'), 'UTM Robotics')).toBe(1);
  expect(matches(keywords('announcements opportunities'), 'General Announcement, Hiring Opportunity')).toBe(2);
});

it('search_clubs filters by campus and gives the total', async () => {
  const result = await createTools().search_clubs({ text: 'robotics', campus: 'UTM' });

  expect(result).toContain('ClubHub lists 4 clubs, 1 of them at UTM.');
  expect(result).toContain('UTM Robotics');
  expect(result).not.toContain('St. George Robotics Society');
});

it('search_posts finds posts by the club that made them', async () => {
  const result = await createTools().search_posts({ text: 'aerospace team' });

  expect(result).toContain('1 posts found:\n- "Rocket launch day" by University of Toronto Aerospace Team');
});

it('search_posts filters by category without search words', async () => {
  const result = await createTools().search_posts({ category: 'Hiring Opportunity' });

  expect(result).toContain('"Exec applications are open" by Computer Science Student Union (UTSG, Hiring Opportunity)');
  expect(result).not.toContain('Rocket launch day');
});

it('search_posts date ranges keep only real dates in range', async () => {
  const result = await createTools().search_posts({ from: `${nextYear}-01-01`, to: `${nextYear}-01-31` });

  expect(result).toContain(`"Rocket launch day"`);
  expect(result).toContain(`happens Jan 15, ${nextYear}, 6:00 PM`);
  expect(result).not.toContain('Old social');
  expect(result).not.toContain('Mystery meetup');
});

it('search_positions lists open positions with their club and apply link', async () => {
  const result = await createTools().search_positions({});

  expect(result).toContain('"Avionics Lead" at University of Toronto Aerospace Team (UTSG)');
  expect(result).toContain('apply: /apply/utat/pos1');
  expect(result).not.toContain('Treasurer');
  expect(result).not.toContain('Secretary');
});

it('answer runs the tools the model calls and returns its final reply', async () => {
  process.env.OPENROUTER_API_KEY = 'key';
  process.env.OPENROUTER_MODEL = 'model';
  const replies = [
    { tool_calls: [{ id: 'c1', type: 'function', function: { name: 'search_posts', arguments: '{"category":"Hiring Opportunity"}' } }] },
    { content: 'CSSU is hiring.' },
  ];
  const fetchMock = jest.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: replies.shift() }] }) }));
  global.fetch = fetchMock as any;

  expect(await answer('any clubs hiring?')).toBe('CSSU is hiring.');
  const sent = JSON.parse((fetchMock.mock.calls[1] as any)[1].body).messages;
  expect(sent.at(-1)).toMatchObject({ role: 'tool', tool_call_id: 'c1' });
  expect(sent.at(-1).content).toContain('Exec applications are open');
});
