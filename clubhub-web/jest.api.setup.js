// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  firestore: {
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock-timestamp'),
      arrayUnion: jest.fn((item) => [item]),
    },
  },
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn(),
  },
}));

// Mock Next.js
jest.mock('next/server', () => ({
  NextRequest: class {
    constructor(url = 'http://localhost:3000/api/pending-clubs') {
      this.url = url;
      this.nextUrl = new URL(url);
      this.headers = new Map();
      this.json = jest.fn();
    }
  },
  NextResponse: {
    json: jest.fn((data, options) => ({ data, status: options?.status || 200 })),
  },
})); 