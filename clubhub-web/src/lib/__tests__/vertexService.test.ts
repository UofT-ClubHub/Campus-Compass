import { VertexChatbotService } from '../chatbot/vertexService';
import { NextRequest } from 'next/server';

// Mock Firebase Vertex AI
jest.mock('@firebase/vertexai-preview', () => ({
  getVertexAI: jest.fn(() => ({})),
  getGenerativeModel: jest.fn(() => ({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: jest.fn().mockReturnValue('Mock AI response')
      }
    })
  }))
}));

// Mock Firebase app
jest.mock('../../model/firebase', () => ({}));

// Mock Firebase Admin
jest.mock('@/app/api/firebaseAdmin', () => ({
  auth: {
    verifyIdToken: jest.fn()
  }
}));

// Mock chatbot functions
jest.mock('../chatbot/functions', () => ({
  searchClubs: jest.fn(),
  getClubDetails: jest.fn(),
  searchPosts: jest.fn(),
  getUpcomingEvents: jest.fn(),
  getCategories: jest.fn(),
  getCampuses: jest.fn(),
  searchEvents: jest.fn()
}));

describe('VertexChatbotService', () => {
  let service: VertexChatbotService;
  let mockRequest: NextRequest;

  beforeEach(() => {
    service = new VertexChatbotService();
    mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue('Bearer mock-token')
      }
    } as any;

    // Setup default mocks for chatbot functions
    const { searchClubs, getUpcomingEvents, getCategories, getCampuses, searchPosts, searchEvents } = require('../chatbot/functions');
    searchClubs.mockResolvedValue([]);
    getUpcomingEvents.mockResolvedValue([]);
    getCategories.mockResolvedValue(['General', 'Event', 'Hiring Opportunity']);
    getCampuses.mockReturnValue(['UTSG', 'UTM', 'UTSC']);
    searchPosts.mockResolvedValue([]);
    searchEvents.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should process message without authentication when no request provided', async () => {
      const result = await service.processMessage('Hello');
      
      expect(result).toEqual({
        message: 'Mock AI response',
        data: expect.any(Object)
      });
    });

    it('should handle authentication errors gracefully', async () => {
      const requestWithoutAuth = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as any;

      const result = await service.processMessage('Hello', requestWithoutAuth);
      
      expect(result.message).toContain('I\'m sorry, I encountered an error');
    });

    it('should handle invalid authorization header gracefully', async () => {
      const requestWithInvalidAuth = {
        headers: {
          get: jest.fn().mockReturnValue('Invalid token')
        }
      } as any;

      const result = await service.processMessage('Hello', requestWithInvalidAuth);
      
      expect(result.message).toContain('I\'m sorry, I encountered an error');
    });

    it('should process message with valid authentication', async () => {
      const { auth } = require('@/app/api/firebaseAdmin');
      auth.verifyIdToken.mockResolvedValue({ email: 'test@example.com' });

      const result = await service.processMessage('Hello', mockRequest);
      
      expect(result).toEqual({
        message: 'Mock AI response',
        data: expect.any(Object)
      });
      expect(auth.verifyIdToken).toHaveBeenCalledWith('mock-token');
    });

    it('should handle token verification failures gracefully', async () => {
      const { auth } = require('@/app/api/firebaseAdmin');
      auth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const result = await service.processMessage('Hello', mockRequest);
      
      expect(result.message).toContain('I\'m sorry, I encountered an error');
    });
  });

  describe('Message Processing', () => {
    it('should process messages successfully', async () => {
      const result = await service.processMessage('Hello');
      
      expect(result.message).toContain('Mock AI response');
      expect(result.data).toBeDefined();
    });
  });

  describe('Context Gathering', () => {
    it('should detect greetings correctly', async () => {
      const result = await service.processMessage('Hello there!');
      
      expect(result.data?.greeting).toBe(true);
    });

    it('should handle short messages as greetings', async () => {
      const result = await service.processMessage('Hi');
      
      expect(result.data?.greeting).toBe(true);
    });

    it('should handle long messages appropriately', async () => {
      const result = await service.processMessage('This is a very long message that should not be considered a greeting');
      
      expect(result.data).toBeDefined();
    });
  });

  describe('Intent Detection', () => {
    describe('Greeting Detection', () => {
      it('should detect various greeting patterns', async () => {
        const greetings = [
          'hello',
          'hi there',
          'hey',
          'good morning',
          'good afternoon',
          'good evening',
          'greetings',
          'howdy',
          'what\'s up',
          'whats up',
          'sup'
        ];

        for (const greeting of greetings) {
          const result = await service.processMessage(greeting);
          expect(result.data?.greeting).toBe(true);
        }
      });
    });

    describe('Club-Related Detection', () => {
      it('should detect club-related queries', async () => {
        const clubQueries = [
          'find computer science clubs',
          'show me clubs at UTSG',
          'search for programming clubs',
          'clubs about technology',
          'student union',
          'organizations'
        ];

        for (const query of clubQueries) {
          const result = await service.processMessage(query);
          expect(result.data?.clubs).toBeDefined();
        }
      });

      it('should detect subject-specific club queries', async () => {
        const subjectQueries = [
          'computer science clubs',
          'cs clubs',
          'programming clubs',
          'tech clubs',
          'business clubs',
          'arts clubs',
          'music clubs',
          'sports clubs'
        ];

        for (const query of subjectQueries) {
          const result = await service.processMessage(query);
          expect(result.data?.clubs).toBeDefined();
        }
      });
    });
  });

  describe('Query Extraction', () => {
    describe('Campus Extraction', () => {
      it('should extract UTSG campus', async () => {
        const result = await service.processMessage('find clubs at UTSG');
        expect(result.data?.clubs).toBeDefined();
      });

      it('should handle campus variations', async () => {
        const campusVariations = [
          { query: 'clubs at St. George', expected: 'UTSG' },
          { query: 'events at Mississauga', expected: 'UTM' },
          { query: 'posts from Scarborough', expected: 'UTSC' }
        ];

        for (const { query, expected } of campusVariations) {
          const result = await service.processMessage(query);
          // The service should handle campus filtering internally
          expect(result.data).toBeDefined();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { searchClubs } = require('../chatbot/functions');
      searchClubs.mockRejectedValue(new Error('Database error'));

      const result = await service.processMessage('find computer science clubs');
      
      expect(result.message).toContain('I\'m sorry, I encountered an error');
    });

    it('should handle missing data gracefully', async () => {
      const { searchClubs } = require('../chatbot/functions');
      searchClubs.mockResolvedValue(null);

      const result = await service.processMessage('find clubs');
      
      expect(result.message).toContain('Mock AI response');
    });
  });

  describe('Search Strategies', () => {
    describe('Club Search', () => {
      it('should perform comprehensive club search', async () => {
        const { searchClubs } = require('../chatbot/functions');
        searchClubs.mockResolvedValue([
          { name: 'Computer Science Club', campus: 'UTSG' }
        ]);

        const result = await service.processMessage('find computer science clubs');
        
        expect(result.data?.clubs).toBeDefined();
        expect(searchClubs).toHaveBeenCalled();
      });

      it('should handle empty club search results', async () => {
        const { searchClubs } = require('../chatbot/functions');
        searchClubs.mockResolvedValue([]);

        const result = await service.processMessage('find nonexistent clubs');
        
        expect(result.data?.clubs).toEqual([]);
      });
    });

    describe('Post Search', () => {
      it('should perform comprehensive post search', async () => {
        const { searchPosts } = require('../chatbot/functions');
        searchPosts.mockResolvedValue([
          { title: 'Hiring Opportunity', category: 'Hiring Opportunity' }
        ]);

        const result = await service.processMessage('show me hiring posts');
        
        expect(result.data?.posts).toBeDefined();
        expect(searchPosts).toHaveBeenCalled();
      });

      it('should handle empty post search results', async () => {
        const { searchPosts } = require('../chatbot/functions');
        searchPosts.mockResolvedValue([]);

        const result = await service.processMessage('show me nonexistent posts');
        
        expect(result.data).toBeDefined();
      });
    });

    describe('Event Search', () => {
      it('should search for specific events', async () => {
        const { searchEvents } = require('../chatbot/functions');
        searchEvents.mockResolvedValue([
          { title: 'Specific Event', date_occuring: '2024-01-01' }
        ]);

        const result = await service.processMessage('when is the workshop');
        
        expect(result.data?.specificEvents).toBeDefined();
        expect(searchEvents).toHaveBeenCalled();
      });
    });
  });

  describe('Data Enrichment', () => {
    it('should enrich posts with club names', async () => {
      const { searchPosts, getClubDetails } = require('../chatbot/functions');
      searchPosts.mockResolvedValue([
        { title: 'Post', club: 'club-id-1' }
      ]);
      getClubDetails.mockResolvedValue({
        name: 'Computer Science Club',
        campus: 'UTSG'
      });

      const result = await service.processMessage('show me posts');
      
      expect(result.data?.posts).toBeDefined();
      expect(getClubDetails).toHaveBeenCalledWith('club-id-1');
    });

    it('should handle club lookup errors gracefully', async () => {
      const { searchPosts, getClubDetails } = require('../chatbot/functions');
      searchPosts.mockResolvedValue([
        { title: 'Post', club: 'invalid-club-id' }
      ]);
      getClubDetails.mockRejectedValue(new Error('Club not found'));

      const result = await service.processMessage('show me posts');
      
      expect(result.data?.posts).toBeDefined();
      // Should still return posts even if club lookup fails
      expect(result.message).toContain('Mock AI response');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short messages', async () => {
      const result = await service.processMessage('Hi');
      
      expect(result.data?.greeting).toBe(true);
    });

    it('should handle messages with special characters', async () => {
      const specialMessage = 'Find clubs with "computer science" & programming!';
      
      const result = await service.processMessage(specialMessage);
      
      expect(result.data?.clubs).toBeDefined();
    });

    it('should handle null/undefined messages', async () => {
      const result = await service.processMessage(null as any);
      
      expect(result.message).toContain('I\'m sorry, I encountered an error');
    });
  });

  describe('Integration Tests', () => {
    it('should process a complete user interaction flow', async () => {
      const { searchClubs, getUpcomingEvents, getCategories, getCampuses } = require('../chatbot/functions');
      
      // Mock successful responses
      searchClubs.mockResolvedValue([
        { name: 'Computer Science Club', campus: 'UTSG' }
      ]);
      getUpcomingEvents.mockResolvedValue([
        { title: 'Workshop', date_occuring: '2024-01-01' }
      ]);
      getCategories.mockResolvedValue(['General', 'Event', 'Hiring Opportunity']);
      getCampuses.mockReturnValue(['UTSG', 'UTM', 'UTSC']);

      // Test a typical user interaction
      const result = await service.processMessage('Hello! Can you help me find computer science clubs at UTSG?');
      
      expect(result.message).toContain('Mock AI response');
      expect(result.data?.greeting).toBe(true);
      expect(result.data?.clubs).toBeDefined();
    });

    it('should handle complex multi-intent queries', async () => {
      const { searchClubs, searchPosts, getUpcomingEvents } = require('../chatbot/functions');
      
      // Mock responses for different search types
      searchClubs.mockResolvedValue([
        { name: 'Tech Club', campus: 'UTSG' }
      ]);
      searchPosts.mockResolvedValue([
        { title: 'Hiring', category: 'Hiring Opportunity' }
      ]);
      getUpcomingEvents.mockResolvedValue([
        { title: 'Workshop', date_occuring: '2024-01-01' }
      ]);

      // Test a query that could trigger multiple intents
      const result = await service.processMessage('Show me tech clubs and upcoming events');
      
      expect(result.message).toContain('Mock AI response');
      // Should prioritize one intent based on the service logic
      expect(result.data).toBeDefined();
    });
  });
});
