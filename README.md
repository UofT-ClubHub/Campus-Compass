# 🧭 Campus Compass

Campus Compass is a club discovery platform for University of Toronto students. It brings 1,000+ student clubs across St. George, Scarborough and Mississauga into one place, so you can find clubs, keep up with their events and apply for positions without checking a dozen Instagram accounts.

Every night, a scraper pulls new posts from club Instagram pages and sorts them into events, hiring opportunities, announcements and surveys. The feed stays current without clubs having to post twice.

## Features

### For students

- **Find clubs** on any campus and filter by campus, department or popularity
- **Follow clubs** to get a feed of the ones you care about
- **Browse posts** by category: events, hiring opportunities, announcements and surveys
- **Save events** to your calendar so you don't miss a deadline
- **Apply for positions** using each club's own application form, then track your application status
- **Pick a theme**: Light, Warm Light, Deep Dark or Vibrant Dark

### For club executives

- **Register your club** and manage it from the executive dashboard
- **Edit club details** like the description, logo, Instagram and links
- **Post** events, announcements and job openings
- **Recruit** by creating positions and reviewing applications, with charts to track them
- **Ask the AI assistant** about clubs, events and deadlines

## Tech stack

| | |
|---|---|
| Web app | Next.js 15, React 19, Tailwind CSS 4, TypeScript |
| Backend | Firebase Auth, Firestore, Cloud Storage |
| AI assistant | OpenRouter |
| Scraper | Python, Apify, Google Gemini |
| Hosting | Vercel, GitHub Actions for the nightly scrape |

## Running locally

```bash
cd clubhub-web
npm install
npm run dev
```

Then open http://localhost:3000.

### Environment variables

Put these in `clubhub-web/.env.local` locally, or in Vercel for production:

- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase web config
- `ADMIN_FIREBASE_PROJECT_ID`, `ADMIN_FIREBASE_CLIENT_EMAIL`, `ADMIN_FIREBASE_PRIVATE_KEY`: Firebase Admin SDK
- `OPENROUTER_API_KEY`: required for the AI assistant
- `OPENROUTER_MODEL`: required for the AI assistant, the OpenRouter model ID to use. There is no default

The nightly scraper reads its own secrets from GitHub Actions: `APIFY_KEY_1` to `APIFY_KEY_8`, `GENAI_API_KEY`, and the `ADMIN_FIREBASE_*` keys.

### Firestore rules

```bash
firebase deploy --only firestore:rules --project <your-project-id>
```
