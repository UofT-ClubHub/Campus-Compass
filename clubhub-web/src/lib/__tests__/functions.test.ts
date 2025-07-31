import {
  searchClubs,
  getClubDetails,
  searchPosts,
  getUpcomingEvents,
  getCategories,
  searchEvents,
  getCampuses
} from '../chatbot/functions';

// Mock Firebase Firestore
jest.mock('@/app/api/firebaseAdmin', () => ({
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn()
      })),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            limit: jest.fn(() => ({
              get: jest.fn()
            }))
          }))
        })),
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn()
          }))
        })),
        limit: jest.fn(() => ({
          get: jest.fn()
        })),
        get: jest.fn()
      })),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn()
        }))
      })),
      limit: jest.fn(() => ({
        get: jest.fn()
      })),
      get: jest.fn()
    }))
  }
}));

describe('Chatbot Functions', () => {
  let mockFirestore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore = require('@/app/api/firebaseAdmin').firestore;
  });

  describe('searchClubs', () => {
    it('should search clubs with query and return relevant results', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: 'club1',
            data: () => ({
              name: 'Computer Science Club',
              description: 'A club for computer science students',
              campus: 'UTSG',
              executives: ['user1', 'user2']
            })
          },
          {
            id: 'club2',
            data: () => ({
              name: 'Engineering Society',
              description: 'For engineering students',
              campus: 'UTSG',
              executives: ['user3']
            })
          }
        ]
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot)
          })
        })
      });

      const result = await searchClubs({
        query: 'computer science',
        campus: 'UTSG',
        limit: 5
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Computer Science Club');
      expect(result[0].executives).toBeUndefined(); // Sensitive data should be removed
    });

    it('should return empty array when no clubs found', async () => {
      const mockSnapshot = {
        empty: true,
        docs: []
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot)
          })
        })
      });

      const result = await searchClubs({
        query: 'nonexistent',
        limit: 5
      });

      expect(result).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await searchClubs({
        query: 'test',
        limit: 5
      });

      expect(result).toHaveLength(0);
    });

    it('should return first results when no query provided', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: 'club1',
            data: () => ({
              name: 'Test Club',
              description: 'A test club',
              campus: 'UTSG'
            })
          }
        ]
      };

      mockFirestore.collection.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockSnapshot)
        })
      });

      const result = await searchClubs({
        query: '',
        limit: 5
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('getClubDetails', () => {
    it('should return club details when club exists', async () => {
      const mockDoc = {
        exists: true,
        id: 'club1',
        data: () => ({
          name: 'Test Club',
          description: 'A test club',
          executives: ['user1', 'user2']
        })
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc)
        })
      });

      const result = await getClubDetails('club1') as any;

      expect(result.name).toBe('Test Club');
      expect(result.executives).toBeUndefined(); // Sensitive data should be removed
      expect(result.id).toBe('club1');
    });

    it('should return error when club does not exist', async () => {
      const mockDoc = {
        exists: false
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc)
        })
      });

      const result = await getClubDetails('nonexistent');

      expect(result.error).toBe('Club not found');
    });

    it('should handle database errors', async () => {
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await getClubDetails('club1');

      expect(result.error).toBe('Failed to fetch club details');
    });
  });

  describe('searchPosts', () => {
    it('should search posts with query and return relevant results', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: 'post1',
            data: () => ({
              title: 'Computer Science Workshop',
              details: 'Learn programming basics',
              category: 'Event',
              campus: 'UTSG',
              hashtags: ['programming', 'workshop']
            })
          }
        ]
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockSnapshot)
              })
            })
          })
        })
      });

      const result = await searchPosts({
        query: 'computer science',
        campus: 'UTSG',
        category: 'Event',
        limit: 5
      });

      expect(result).toHaveLength(1);
      expect((result[0] as any).title).toBe('Computer Science Workshop');
    });

    it('should handle abbreviations correctly', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: 'post1',
            data: () => ({
              title: 'CS Workshop',
              details: 'Computer science programming workshop',
              category: 'Event',
              hashtags: ['cs', 'programming']
            })
          }
        ]
      };

      mockFirestore.collection.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot)
          })
        })
      });

      const result = await searchPosts({
        query: 'cs',
        limit: 5
      });

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no posts found', async () => {
      const mockSnapshot = {
        empty: true,
        docs: []
      };

      mockFirestore.collection.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot)
          })
        })
      });

      const result = await searchPosts({
        query: 'nonexistent',
        limit: 5
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('getUpcomingEvents', () => {


    it('should filter out events with invalid dates', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: 'event1',
            data: () => ({
              title: 'Invalid Date Event',
              category: 'Event',
              date_occuring: 'invalid-date',
              campus: 'UTSG'
            })
          }
        ]
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot)
          })
        })
      });

      const result = await getUpcomingEvents({
        campus: 'UTSG',
        daysAhead: 7,
        limit: 5
      });

      expect(result).toHaveLength(0);
    });

    it('should return empty array when no events found', async () => {
      const mockSnapshot = {
        empty: true,
        docs: []
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot)
          })
        })
      });

      const result = await getUpcomingEvents({
        campus: 'UTSG',
        daysAhead: 7,
        limit: 5
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('getCategories', () => {
    it('should return unique categories from posts', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            data: () => ({ category: 'Event' })
          },
          {
            data: () => ({ category: 'Announcement' })
          },
          {
            data: () => ({ category: 'Event' }) // Duplicate
          },
          {
            data: () => ({ category: 'General' })
          }
        ]
      };

      mockFirestore.collection.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSnapshot)
      });

      const result = await getCategories();

      expect(result).toContain('Event');
      expect(result).toContain('Announcement');
      expect(result).toContain('General');
      expect(result).toHaveLength(3); // No duplicates
    });

    it('should return default categories when database error occurs', async () => {
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await getCategories();

      expect(result).toEqual(['General', 'Event', 'Announcement', 'Hiring Opportunity']);
    });
  });

  describe('searchEvents', () => {
    it('should search events with text and date filtering', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: 'event1',
            data: () => ({
              title: 'Future Workshop',
              category: 'Event',
              date_occuring: tomorrow.toISOString(),
              location: 'Room 101',
              campus: 'UTSG'
            })
          }
        ]
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockSnapshot)
              })
            })
          })
        })
      });

      const result = await searchEvents({
        query: 'workshop',
        campus: 'UTSG',
        includeExpired: false,
        limit: 5
      });

      expect(result).toHaveLength(1);
      expect((result[0] as any).title).toBe('Future Workshop');
    });


  });

  describe('getCampuses', () => {
    it('should return list of campuses', () => {
      const result = getCampuses();

      expect(result).toEqual(['UTSG', 'UTM', 'UTSC']);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const clubResult = await searchClubs({ query: 'test' });
      const postResult = await searchPosts({ query: 'test' });
      const eventResult = await getUpcomingEvents({});

      expect(clubResult).toEqual([]);
      expect(postResult).toEqual([]);
      expect(eventResult).toEqual([]);
    });

    it('should handle invalid date formats in events', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: 'event1',
            data: () => ({
              title: 'Event with Invalid Date',
              category: 'Event',
              date_occuring: 'not-a-date',
              campus: 'UTSG'
            })
          }
        ]
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot)
          })
        })
      });

      const result = await getUpcomingEvents({
        campus: 'UTSG',
        daysAhead: 7
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query strings', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: 'club1',
            data: () => ({
              name: 'Test Club',
              description: 'A test club',
              campus: 'UTSG'
            })
          }
        ]
      };

      mockFirestore.collection.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockSnapshot)
        })
      });

      const result = await searchClubs({
        query: '   ', // Whitespace only
        limit: 5
      });

      expect(result).toHaveLength(1);
    });

    it('should handle null or undefined data gracefully', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: 'post1',
            data: () => ({
              title: null,
              details: undefined,
              category: 'Event'
            })
          }
        ]
      };

      mockFirestore.collection.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot)
          })
        })
      });

      const result = await searchPosts({
        query: 'test',
        limit: 5
      });

      expect(result).toHaveLength(0); // Should filter out posts with no relevant text
    });

    it('should respect limit parameters', async () => {
      const mockSnapshot = {
        empty: false,
        docs: Array.from({ length: 20 }, (_, i) => ({
          id: `club${i}`,
          data: () => ({
            name: `Club ${i}`,
            description: 'A test club',
            campus: 'UTSG'
          })
        }))
      };

      mockFirestore.collection.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockSnapshot)
        })
      });

      const result = await searchClubs({
        query: '',
        limit: 3
      });

      expect(result).toHaveLength(3);
    });
  });
});
