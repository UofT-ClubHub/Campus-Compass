# 🧭 Campus Compass

**Every club, event and opportunity at the University of Toronto, all in one place.**

Campus Compass is the discovery hub for U of T's 99,794 students. Find your people across 1,000+ student clubs, catch every event, apply for exec roles, and never scroll through ten Instagram accounts again. 🎉

> 🏫 St. George · 🌳 Scarborough · 🌲 Mississauga, all three campuses, one compass.

---

## ✨ Why Campus Compass?

Club life at U of T is scattered across Instagram pages, group chats and posters taped to walls. Campus Compass pulls it together automatically: every night it reads club Instagram posts and uses AI to sort them into events, hiring calls, announcements and surveys, so the feed is always fresh without anyone lifting a finger. 🤖📸

---

## 🎒 For Students

### 🔍 Discover Clubs
- 🗂️ Browse 1,000+ clubs across all three campuses
- 🎯 Filter by campus, department and popularity
- ⭐ Follow the clubs you love to build your own personalized feed

### 📰 Stay in the Loop
- 📅 **Events**, 💼 **Hiring Opportunities**, 📢 **Announcements** and 📝 **Surveys**, auto-sorted from club posts
- 🔎 Search and filter by category, campus or department
- ❤️ Like posts and keep up with what's trending
- 🗓️ Save events to your personal calendar so you never miss a deadline

### 🚀 Join the Team
- 🧑‍💼 Explore open exec and member positions across campus
- ✍️ Apply right on the platform with each club's custom application form
- 📬 Track every application from submitted to decision

### 🎨 Make It Yours
- 🌗 Four themes: Light, Warm Light, Deep Dark and Vibrant Dark
- 👤 A profile with your campus, bio and followed clubs

---

## 🛠️ For Club Executives

- 🏛️ **Register your club** and get approved by the Campus Compass team
- 🧭 **Executive dashboard** to edit your club's description, logo, Instagram and links
- 📣 **Publish** events, announcements and job postings
- 📋 **Recruit**: create positions, review applications and accept or reject candidates
- 📊 **Track** applications with built-in charts
- 🤖 **AI assistant** that answers questions about clubs, events and deadlines in plain language

---

## 🛡️ For Admins

- ✅ **Approve or reject** new club requests, with full history of every approved request
- 🌈 **Color-coded roles** so you can spot 🟣 Admins, 🔵 Execs and ⚪ Users at a glance
- 🗝️ **Manage every club** from the exec portal, no extra setup needed
- 🔐 **Grant or revoke** admin and exec roles

---

## 🔒 Security

- 🧱 All writes go through the server, so roles can only be granted by admins (or by execs for their own clubs)
- ✉️ Only verified emails are trusted when finding users
- 📜 Firestore rules allow the browser to read public club and post data only

---

## 🧰 Tech Stack

| Layer | Tools |
|---|---|
| 🌐 Web app | Next.js 15, React 19, Tailwind CSS 4, TypeScript |
| 🔥 Backend | Firebase Auth, Firestore, Cloud Storage, Firebase Admin SDK |
| 🤖 AI assistant | OpenRouter free models (Inkling by default, with automatic fallbacks) |
| 🕷️ Nightly scraper | Python, Apify Instagram scraper, Google Gemini for post categorization |
| ⚙️ Automation | GitHub Actions (nightly scrape), Vercel (hosting) |

---

## 🏃 Run It Locally

```bash
cd clubhub-web
npm install
npm run dev        # http://localhost:3000
npm run test:api   # API security tests
```

### 🔑 Environment Variables

Set these in `clubhub-web/.env.local` for local work, or in Vercel for production:

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | 🔥 Firebase web config |
| `ADMIN_FIREBASE_PROJECT_ID`, `ADMIN_FIREBASE_CLIENT_EMAIL`, `ADMIN_FIREBASE_PRIVATE_KEY` | 🛡️ Firebase Admin SDK (server only) |
| `OPENROUTER_API_KEY` | 🤖 AI assistant (required for the chatbot) |
| `OPENROUTER_MODEL` | 🧪 Optional: swap the default chatbot model |

The nightly scraper uses its own secrets in GitHub Actions (`APIFY_KEY_1`–`8`, `GENAI_API_KEY`, and the `ADMIN_FIREBASE_*` keys).

### 📜 Firestore Rules

```bash
firebase deploy --only firestore:rules --project <your-project-id>
```

---

<p align="center">Made with 💙 for U of T students</p>
