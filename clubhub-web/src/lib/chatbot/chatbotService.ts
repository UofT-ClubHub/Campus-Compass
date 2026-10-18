import { getClubs, getRecentPosts, getUpcomingPosts } from './functions';
import { NextRequest } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function generateReply(system: string, user: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) throw new Error('OPENROUTER_API_KEY and OPENROUTER_MODEL must be set');
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
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

const SYSTEM_PROMPT = `You are ClubHub Assistant, the chatbot for ClubHub, a directory of University of Toronto student clubs and their posts across three campuses: UTSG (St. George), UTM (Mississauga) and UTSC (Scarborough).

Answer the question using only the ClubHub data given with it.
- Never invent clubs, posts, dates, people, handles or links. If the data does not answer the question, say so in one sentence and suggest a different search term.
- Copy names, Instagram handles, links, dates and locations exactly as they appear in the data.
- The data holds search matches, not the whole database. Only state how many clubs exist using the total given.
- Mention only what the question needs. Keep it short: a sentence or two, then a bullet list when listing items. No filler, no sign-off, no emojis.
- For a greeting or small talk, reply in one short sentence and ask what they are looking for.
- Format with Markdown and only link URLs that appear in the data.`;

const STOP_WORDS = new Set((
  'a about all an and any anything are at be can club clubs could do does event events for from get give happening ' +
  'have hello help hey hi how i in is it know like list looking me more my of on or please post posts show some ' +
  'tell that the there these this to toronto u uoft university what whats when where which who will with would you your ' +
  'utsg utm utsc st george mississauga scarborough downtown campus campuses'
).split(' '));

const CAMPUSES: [string, RegExp][] = [
  ['UTSG', /\b(utsg|st\.? george|downtown)\b/i],
  ['UTM', /\b(utm|mississauga)\b/i],
  ['UTSC', /\b(utsc|scarborough)\b/i],
];

const tokenize = (text: unknown) => String(text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];

export const keywords = (message: string) =>
  [...new Set(tokenize(message))].filter(word => word.length > 1 && !STOP_WORDS.has(word));

// How many keywords appear in text; short ones must match a whole word so "cs" doesn't hit "physics"
export const matches = (words: string[], text: unknown) => {
  const tokens = tokenize(text);
  return words.filter(word => tokens.some(token => word.length < 3 ? token === word : token.startsWith(word))).length;
};

const topBy = <T>(items: T[], score: (item: T) => number, n: number) =>
  items.map(item => ({ item, score: score(item) }))
    .filter(scored => scored.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(scored => scored.item);

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

export async function gatherContext(message: string): Promise<string> {
  const words = keywords(message);
  const campus = CAMPUSES.find(([, pattern]) => pattern.test(message))?.[0];
  const inCampus = (item: any) => !campus || item.campus === campus;

  const [clubs, posts, upcoming] = await Promise.all([getClubs(), getRecentPosts(), getUpcomingPosts()]);
  const clubNames = new Map<string, string>(clubs.map(club => [club.id, club.name]));
  const campusClubs = clubs.filter(inCampus);

  const matchedClubs = topBy(campusClubs, club => 3 * matches(words, club.name) + matches(words, club.description), 8);
  const matchedPosts = topBy(posts.filter(inCampus), post =>
    3 * matches(words, post.title) +
    2 * matches(words, `${clubNames.get(post.club) ?? ''} ${(post.hashtags ?? []).join(' ')}`) +
    matches(words, post.details), 6);
  const upcomingPosts = upcoming.filter(inCampus).slice(0, 6);
  const postLines = (list: any[]) => list.map(post => postLine(post, clubNames)).join('\n');

  return [
    `ClubHub lists ${clubs.length} clubs${campus ? `, ${campusClubs.length} of them at ${campus}` : ''}.`,
    matchedClubs.length
      ? `Clubs matching the question:\n${matchedClubs.map(clubLine).join('\n')}`
      : `No club matched the question's keywords. Some clubs${campus ? ` at ${campus}` : ''}, not search results:\n${campusClubs.slice(0, 8).map(clubLine).join('\n')}`,
    matchedPosts.length ? `Posts matching the question:\n${postLines(matchedPosts)}` : `No post matched the question's keywords.`,
    upcomingPosts.length ? `Upcoming dated posts, soonest first:\n${postLines(upcomingPosts)}` : `No upcoming dated posts.`,
  ].join('\n\n');
}

export class ChatbotService {
  async processMessage(message: string, request: NextRequest): Promise<{ message: string; data?: any }> {
    // Auth errors propagate so the route can return 401/403
    await ensureAuthenticated(request);
    try {
      const context = await gatherContext(message);
      const reply = await generateReply(SYSTEM_PROMPT, `ClubHub data:\n${context}\n\nQuestion: ${message}`);
      return { message: reply || "Sorry, I couldn't generate a response." };
    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        message: "I'm sorry, I encountered an error while processing your request. Please try again or ask for help!"
      };
    }
  }
}
