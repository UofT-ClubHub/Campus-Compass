import { getClubs, getOpenPositions, getRecentPosts, getUpcomingPosts } from './functions';
import { NextRequest } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CATEGORIES = ['Event', 'Hiring Opportunity', 'General Announcement', 'Survey'];
const CAMPUS_CODES = ['UTSG', 'UTM', 'UTSC'];
const MAX_RESULTS = 15;
const MAX_ROUNDS = 5;

const text = { type: 'string', description: 'Optional words to search for. Leave it out to list everything that fits the other filters.' };
const campus = { type: 'string', enum: CAMPUS_CODES };
const tool = (name: string, description: string, properties: object) =>
  ({ type: 'function', function: { name, description, parameters: { type: 'object', properties } } });

const TOOLS = [
  tool('search_clubs', 'Find ClubHub clubs by name, description or campus. Also gives the total number of clubs.', { text, campus }),
  tool('search_posts', 'Find posts that clubs published: events, hiring opportunities, general announcements and surveys.', {
    text, campus,
    category: { type: 'string', enum: CATEGORIES },
    from: { type: 'string', description: 'Only posts happening on or after this date, YYYY-MM-DD' },
    to: { type: 'string', description: 'Only posts happening on or before this date, YYYY-MM-DD' },
  }),
  tool('search_positions', 'Find open positions clubs are recruiting for, which students apply to through ClubHub.', { text, campus }),
];

async function callModel(messages: any[], toolChoice: 'auto' | 'none') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) throw new Error('OPENROUTER_API_KEY and OPENROUTER_MODEL must be set');
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, tools: TOOLS, tool_choice: toolChoice, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message;
}

// Only allow authenticated admins and executives
async function ensureAuthenticated(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('User must be signed in to use the chatbot. Please log in first.');
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    // Dynamic import to avoid loading Firebase Admin during build time
    const { auth, firestore } = await import('@/app/api/firebaseAdmin');
    const decoded = await auth.verifyIdToken(idToken);
    console.log('User authenticated:', decoded.email || decoded.uid);

    // Check if user is admin or executive
    const userDoc = await firestore.collection('Users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      throw new Error('Due to cost concerns, only users with special roles (admins or club executives) can access the chatbot at this time.');
    }

    const userData = userDoc.data();
    const isAdmin = userData?.is_admin === true;
    const isExecutive = userData?.is_executive === true;

    if (!isAdmin && !isExecutive) {
      throw new Error('Due to cost concerns, only users with special roles (admins or club executives) can access the chatbot at this time.');
    }

    console.log('User authorized for chatbot:', decoded.email || decoded.uid, `(admin: ${isAdmin}, executive: ${isExecutive})`);
  } catch (e) {
    if (e instanceof Error && e.message.includes('cost concerns')) {
      throw e;
    }
    throw new Error('User must be signed in to use the chatbot. Please log in first.');
  }
}

const systemPrompt = () => `You are ClubHub Assistant, the chatbot for ClubHub, a directory of University of Toronto student clubs and their posts across three campuses: UTSG (St. George), UTM (Mississauga) and UTSC (Scarborough).

Today is ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Toronto', dateStyle: 'full' })}.

Look up the answer with the tools before answering anything about clubs, posts or positions. Call them as often as you need: pick the post category that fits (hiring, recruiting or "join our team" is Hiring Opportunity, news or updates is General Announcement), turn dates like "this week" into from/to, fix typos in search words, and try other words or leave the words out if a search finds nothing. For hiring questions, search both posts and positions.

Answer using only what the tools return.
- Never invent clubs, posts, dates, people, handles or links. If the tools find nothing, say so in one sentence and suggest a different search.
- Copy names, Instagram handles, links, dates and locations exactly as they appear in the results.
- Results are search matches, not the whole database. Only state how many clubs exist using the total search_clubs gives.
- Mention only what the question needs. Keep it short: a sentence or two, then a bullet list when listing items. No filler, no sign-off, no emojis.
- For a greeting or small talk, reply in one short sentence and ask what they are looking for.
- Format with Markdown and only link URLs that appear in the results.`;

const STOP_WORDS = new Set((
  'a about all an and any anything are at be can club clubs could do does event events for from get give happening ' +
  'have hello help hey hi how i in is it know like list looking me more my of on or please post posts show some ' +
  'tell that the there these this to toronto u uoft university what whats when where which who will with would you your ' +
  'utsg utm utsc st george mississauga scarborough downtown campus campuses'
).split(' '));

const tokenize = (text: unknown) => String(text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];

export const keywords = (message: string) =>
  [...new Set(tokenize(message))].filter(word => word.length > 1 && !STOP_WORDS.has(word));

// shortcut: only strips plural endings so "workshops" finds "workshop"; use a real stemmer if verb forms need matching
const stem = (word: string) => word.length > 4 ? word.replace(/(ies|es|s)$/, '') : word;

// How many keywords appear in text; short ones must match a whole word so "cs" doesn't hit "physics"
export const matches = (words: string[], text: unknown) => {
  const tokens = tokenize(text);
  return words.filter(word => tokens.some(token => word.length < 3 ? token === word : token.startsWith(stem(word)))).length;
};

const topBy = <T>(items: T[], score: (item: T) => number, n: number) =>
  items.map(item => ({ item, score: score(item) }))
    .filter(scored => scored.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(scored => scored.item);

// Items scoring above 0 for the search words, best first; every item when there are no words
const search = <T>(items: T[], words: unknown, score: (words: string[], item: T) => number) => {
  const list = keywords(String(words ?? ''));
  return list.length ? topBy(items, item => score(list, item), Infinity) : items;
};

const listing = (found: any[], noun: string, line: (item: any) => string) => found.length
  ? `${found.length} ${noun} found${found.length > MAX_RESULTS ? `, showing the first ${MAX_RESULTS}` : ''}:\n${found.slice(0, MAX_RESULTS).map(line).join('\n')}`
  : `No ${noun} found.`;

const truncate = (text: unknown, n: number) => {
  const s = String(text);
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

// Stored dates are wall-clock times marked as UTC, so format them in UTC
const formatDate = (value: unknown, withTime = false) => {
  const date = new Date(value as string);
  if (!value || isNaN(date.getTime())) return undefined;
  return date.toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', ...(withTime && { timeStyle: 'short' }) });
};

// The YYYY-MM-DD part of a date string, or '' for values like "TBD"
const day = (value: unknown) => /^\d{4}-\d{2}-\d{2}/.test(String(value)) ? String(value).slice(0, 10) : '';

const clubLine = (club: any) => [
  `- ${club.name} (${club.campus || 'campus unknown'})`,
  club.description && `: ${truncate(club.description, 300)}`,
  club.instagram && ` | Instagram: ${club.instagram}`,
  club.links && Object.keys(club.links).length > 0 &&
    ` | Links: ${Object.entries(club.links).map(([name, url]) => `${name}: ${url}`).join(', ')}`,
].filter(Boolean).join('');

const postLine = (post: any, clubNames: Map<string, string>) => {
  // The bot stores midnight when a post gives no time
  const when = formatDate(post.date_occurring, !String(post.date_occurring).includes('T00:00'));
  const posted = formatDate(post.date_posted);
  return [
    `- "${post.title || 'Untitled'}" by ${clubNames.get(post.club) || 'unknown club'} (${post.campus || 'campus unknown'}, ${post.category || 'uncategorized'})`,
    when && ` | happens ${when}`,
    post.location && ` | at ${post.location}`,
    posted && ` | posted ${posted}`,
    post.details && ` | ${truncate(post.details, 300)}`,
    Array.isArray(post.links) && post.links[0] && ` | link: ${post.links[0]}`,
  ].filter(Boolean).join('');
};

const positionLine = (position: any, club: any) => [
  `- "${position.title || 'Untitled'}" at ${club?.name || 'unknown club'} (${club?.campus || 'campus unknown'})`,
  position.deadline && ` | apply by ${position.deadline}`,
  position.description && ` | ${truncate(position.description, 300)}`,
  ` | apply: /apply/${position.club}/${position.id}`,
].filter(Boolean).join('');

// The tools the model can call; each Firestore read runs at most once per message however many calls it makes
export function createTools() {
  const once = <T>(load: () => Promise<T>) => { let loaded: Promise<T> | undefined; return () => (loaded ??= load()); };
  const clubs = once(getClubs);
  const posts = once(async () => {
    const [recent, upcoming] = await Promise.all([getRecentPosts(), getUpcomingPosts()]);
    return [...new Map([...recent, ...upcoming].map(post => [post.id, post])).values()];
  });
  const positions = once(getOpenPositions);

  return {
    search_clubs: async (args: any) => {
      const all = await clubs();
      const inCampus = all.filter(club => !args.campus || club.campus === args.campus);
      const found = search(inCampus, args.text, (words, club) => 3 * matches(words, club.name) + matches(words, club.description));
      return `ClubHub lists ${all.length} clubs${args.campus ? `, ${inCampus.length} of them at ${args.campus}` : ''}.\n${listing(found, 'clubs', clubLine)}`;
    },

    search_posts: async (args: any) => {
      const [all, clubList] = await Promise.all([posts(), clubs()]);
      const clubNames = new Map<string, string>(clubList.map(club => [club.id, club.name]));
      const dated = args.from || args.to;
      const filtered = all
        .filter(post => (!args.category || post.category === args.category) && (!args.campus || post.campus === args.campus))
        .filter(post => !dated || (day(post.date_occurring) && (!args.from || day(post.date_occurring) >= args.from) && (!args.to || day(post.date_occurring) <= args.to)))
        // Soonest first when asking about dates, newest posted first otherwise; the text ranking below keeps this order for ties
        .sort((a, b) => dated
          ? String(a.date_occurring).localeCompare(String(b.date_occurring))
          : String(b.date_posted).localeCompare(String(a.date_posted)));
      const found = search(filtered, args.text, (words, post) =>
        3 * matches(words, post.title) +
        2 * matches(words, `${clubNames.get(post.club) ?? ''} ${(post.hashtags ?? []).join(' ')} ${post.category ?? ''}`) +
        matches(words, `${post.details ?? ''} ${post.location ?? ''}`));
      return listing(found, 'posts', post => postLine(post, clubNames));
    },

    search_positions: async (args: any) => {
      const [all, clubList] = await Promise.all([positions(), clubs()]);
      const clubById = new Map(clubList.map(club => [club.id, club]));
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
      const open = all.filter(position =>
        // Older edits left some closed positions in OpenPositions
        position.status !== 'closed' && !(day(position.deadline) && day(position.deadline) < today) &&
        (!args.campus || clubById.get(position.club)?.campus === args.campus));
      const found = search(open, args.text, (words, position) =>
        3 * matches(words, position.title) +
        2 * matches(words, clubById.get(position.club)?.name) +
        matches(words, `${position.description ?? ''} ${(position.requirements ?? []).join(' ')}`));
      return listing(found, 'open positions', position => positionLine(position, clubById.get(position.club)));
    },
  };
}

async function runTool(tools: ReturnType<typeof createTools>, name: string, args: string) {
  try {
    const run = tools[name as keyof typeof tools];
    return run ? await run(JSON.parse(args || '{}')) : `There is no tool called ${name}.`;
  } catch (error) {
    // Hand the error to the model so it can retry with other arguments
    console.error(`Chatbot tool ${name} failed:`, error);
    return `${name} failed: ${error instanceof Error ? error.message : error}`;
  }
}

// Let the model call tools until it answers, forcing an answer on the last round
export async function answer(message: string): Promise<string> {
  const tools = createTools();
  const messages: any[] = [{ role: 'system', content: systemPrompt() }, { role: 'user', content: message }];
  for (let round = 1; ; round++) {
    const reply = await callModel(messages, round < MAX_ROUNDS ? 'auto' : 'none');
    if (!reply?.tool_calls?.length || round >= MAX_ROUNDS) return reply?.content?.trim() || '';
    messages.push(reply);
    for (const call of reply.tool_calls) {
      messages.push({ role: 'tool', tool_call_id: call.id, content: await runTool(tools, call.function?.name, call.function?.arguments) });
    }
  }
}

export class ChatbotService {
  async processMessage(message: string, request: NextRequest): Promise<{ message: string; data?: any }> {
    // Auth errors propagate so the route can return 401/403
    await ensureAuthenticated(request);
    try {
      const reply = await answer(message);
      return { message: reply || "Sorry, I couldn't generate a response." };
    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        message: "I'm sorry, I encountered an error while processing your request. Please try again or ask for help!"
      };
    }
  }
}
