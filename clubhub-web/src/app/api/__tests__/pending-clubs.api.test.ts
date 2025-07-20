import { GET, POST, DELETE } from '../pending-clubs/route';

// Mock the firebaseAdmin module
// Mocking firebase calls so we don't need to interact with real firebase database
jest.mock('../firebaseAdmin', () => ({
  firestore: {
    collection: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        get: jest.fn(() => ({
          docs: [
            {
              id: 'pending-club-1',
              data: () => ({
                user: 'test-user-123',
                club_name: 'Test Club',
                club_campus: 'UTSG',
                club_description: 'Test Description',
                club_image: '',
                club_instagram: '',
                created_at: 'mock-timestamp'
              })
            }
          ]
        }))
      })),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => ({
            empty: true
          }))
        }))
      })),
      add: jest.fn(() => ({
        id: 'new-pending-club-123',
        update: jest.fn(),
        get: jest.fn(() => ({
          data: () => ({
            user: 'test-user-123',
            club_name: 'New Test Club',
            club_campus: 'UTSG',
            club_description: 'New Test Description'
          })
        }))
      })),
      doc: jest.fn(() => ({
        get: jest.fn(() => ({
          exists: true,
          data: () => ({
            user: 'test-user-123',
            club_name: 'Test Club',
            club_campus: 'UTSG',
            club_description: 'Test Description'
          }),
          ref: {
            delete: jest.fn()
          }
        })),
        update: jest.fn()
      }))
    }))
  }
}));

// Mock auth middleware to pass through the handler
// Skips auth middleware for testing purposes by mocking
jest.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: any) => handler
}));

describe('Pending Clubs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET function', () => {
    it('should handle GET request successfully', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'campus') return 'UTSG';
              if (param === 'limit') return '50';
              if (param === 'offset') return '0';
              return null;
            })
          }
        }
      } as any;

      // call real GET function
      const response = await GET(mockRequest);

      // Check that the response is correct
      expect(response.status).toBe(200);
      // Response data should be dormatted like this
      expect(response.data).toEqual([
        {
          id: 'pending-club-1',
          user: 'test-user-123',
          club_name: 'Test Club',
          club_campus: 'UTSG',
          club_description: 'Test Description',
          club_image: '',
          club_instagram: '',
          created_at: 'mock-timestamp'
        }
      ]);
    });

    it('should handle database error in GET request', async () => {
      // Mock the firestore collection to throw an error
      const mockFirestore = require('../firebaseAdmin').firestore; // get reference to firestore database to modify it
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Create a request and call the real GET function, but it should throw an error
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'campus') return 'UTSG';
              return null;
            })
          }
        }
      } as any;

      const response = await GET(mockRequest);

      // Check that the response is correct
      expect(response.status).toBe(500);
      expect(response.data).toHaveProperty('error');
      
      // Restore the default implementation for following tests
      // We made database throw an error before, so now we have to restore it back to normal behaviour
      mockFirestore.collection.mockImplementation(() => ({
        orderBy: jest.fn(() => ({
          get: jest.fn(() => ({
            docs: [
              {
                id: 'pending-club-1',
                data: () => ({
                  user: 'test-user-123',
                  club_name: 'Test Club',
                  club_campus: 'UTSG',
                  club_description: 'Test Description',
                  club_image: '',
                  club_instagram: '',
                  created_at: 'mock-timestamp'
                })
              }
            ]
          }))
        })),
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => ({
              empty: true
            }))
          }))
        })),
        add: jest.fn(() => ({
          id: 'new-pending-club-123',
          update: jest.fn(),
          get: jest.fn(() => ({
            data: () => ({
              user: 'test-user-123',
              club_name: 'New Test Club',
              club_campus: 'UTSG',
              club_description: 'New Test Description'
            })
          }))
        })),
        doc: jest.fn(() => ({
          get: jest.fn(() => ({
            exists: true,
            data: () => ({
              user: 'test-user-123',
              club_name: 'Test Club',
              club_campus: 'UTSG',
              club_description: 'Test Description'
            }),
            ref: {
              delete: jest.fn()
            }
          })),
          update: jest.fn()
        }))
      }));
    });
  });

  describe('POST function', () => {
    it('should handle POST request successfully', async () => {
      // Create a mock request and call the real POST function
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          club_name: 'New Test Club',
          club_campus: 'UTSG',
          club_description: 'New Test Description'
        }),
        auth: { uid: 'test-user-123' }
      } as any;

      const response = await POST(mockRequest);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id', 'new-pending-club-123');
    });

    it('should return 400 if required fields are missing', async () => {
        // No club_name
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          club_campus: 'UTSG',
          club_description: 'Test Description'
        }),
        auth: { uid: 'test-user-123' }
      } as any;

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });

    it('should return 400 if user already has a pending club', async () => {
      const mockFirestore = require('../firebaseAdmin').firestore;
      mockFirestore.collection.mockImplementation(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => ({
              empty: false // User already has pending club
            }))
          }))
        }))
      }));

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          club_name: 'New Test Club',
          club_campus: 'UTSG',
          club_description: 'New Test Description'
        }),
        auth: { uid: 'test-user-123' }
      } as any;

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');

      // Restore default mock database behaviour
      mockFirestore.collection.mockImplementation(() => ({
        orderBy: jest.fn(() => ({
          get: jest.fn(() => ({
            docs: [
              {
                id: 'pending-club-1',
                data: () => ({
                  user: 'test-user-123',
                  club_name: 'Test Club',
                  club_campus: 'UTSG',
                  club_description: 'Test Description',
                  club_image: '',
                  club_instagram: '',
                  created_at: 'mock-timestamp'
                })
              }
            ]
          }))
        })),
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => ({
              empty: true
            }))
          }))
        })),
        add: jest.fn(() => ({
          id: 'new-pending-club-123',
          update: jest.fn(),
          get: jest.fn(() => ({
            data: () => ({
              user: 'test-user-123',
              club_name: 'New Test Club',
              club_campus: 'UTSG',
              club_description: 'New Test Description'
            })
          }))
        })),
        doc: jest.fn(() => ({
          get: jest.fn(() => ({
            exists: true,
            data: () => ({
              user: 'test-user-123',
              club_name: 'Test Club',
              club_campus: 'UTSG',
              club_description: 'Test Description'
            }),
            ref: {
              delete: jest.fn()
            }
          })),
          update: jest.fn()
        }))
      }));
    });

    it('should handle database error in POST request', async () => {
      const mockFirestore = require('../firebaseAdmin').firestore;
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          club_name: 'New Test Club',
          club_campus: 'UTSG',
          club_description: 'New Test Description'
        }),
        auth: { uid: 'test-user-123' }
      } as any;

      const response = await POST(mockRequest);
      expect(response.status).toBe(500);
      expect(response.data).toHaveProperty('error');

      // Restore default mock
      mockFirestore.collection.mockImplementation(() => ({
        orderBy: jest.fn(() => ({
          get: jest.fn(() => ({
            docs: [
              {
                id: 'pending-club-1',
                data: () => ({
                  user: 'test-user-123',
                  club_name: 'Test Club',
                  club_campus: 'UTSG',
                  club_description: 'Test Description',
                  club_image: '',
                  club_instagram: '',
                  created_at: 'mock-timestamp'
                })
              }
            ]
          }))
        })),
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => ({
              empty: true
            }))
          }))
        })),
        add: jest.fn(() => ({
          id: 'new-pending-club-123',
          update: jest.fn(),
          get: jest.fn(() => ({
            data: () => ({
              user: 'test-user-123',
              club_name: 'New Test Club',
              club_campus: 'UTSG',
              club_description: 'New Test Description'
            })
          }))
        })),
        doc: jest.fn(() => ({
          get: jest.fn(() => ({
            exists: true,
            data: () => ({
              user: 'test-user-123',
              club_name: 'Test Club',
              club_campus: 'UTSG',
              club_description: 'Test Description'
            }),
            ref: {
              delete: jest.fn()
            }
          })),
          update: jest.fn()
        }))
      }));
    });
  });

  describe('DELETE function', () => {
    it('should handle DELETE request successfully', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'id') return 'pending-club-123';
              if (param === 'action') return 'approve';  // approve club request
              return null;
            })
          }
        }
      } as any;

      const response = await DELETE(mockRequest);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Club approved and created successfully');  // pending club request is deleted --> club is created (since action is approve)
    });

    it('should handle DELETE request successfully in reject case', async () => {
        const mockRequest = {
          nextUrl: {
            searchParams: {
              get: jest.fn((param: string) => {
                if (param === 'id') return 'pending-club-123';
                if (param === 'action') return 'reject';  // reject club request
                return null;
              })
            }
          }
        } as any;
  
        const response = await DELETE(mockRequest);
  
        expect(response.status).toBe(200);
        expect(response.data.message).toBe('Club request rejected successfully');  // pending club request is deleted --> club is rejected (since action is reject)
      });

    it('should return 400 if id is missing', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'action') return 'approve';
              return null;
            })
          }
        }
      } as any;
      const response = await DELETE(mockRequest);
      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });

    it('should return 400 if action is invalid', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'id') return 'pending-club-123';
              if (param === 'action') return 'invalid-action';
              return null;
            })
          }
        }
      } as any;
      const response = await DELETE(mockRequest);
      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });

    it('should return 404 if pending club not found', async () => {
      const mockFirestore = require('../firebaseAdmin').firestore;
      mockFirestore.collection.mockImplementation(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(() => ({ exists: false }))
        }))
      }));
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'id') return 'pending-club-123';
              if (param === 'action') return 'approve';
              return null;
            })
          }
        }
      } as any;
      const response = await DELETE(mockRequest);
      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('error');
      // Restore default mock
      mockFirestore.collection.mockImplementation(() => ({
        orderBy: jest.fn(() => ({
          get: jest.fn(() => ({
            docs: [
              {
                id: 'pending-club-1',
                data: () => ({
                  user: 'test-user-123',
                  club_name: 'Test Club',
                  club_campus: 'UTSG',
                  club_description: 'Test Description',
                  club_image: '',
                  club_instagram: '',
                  created_at: 'mock-timestamp'
                })
              }
            ]
          }))
        })),
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => ({
              empty: true
            }))
          }))
        })),
        add: jest.fn(() => ({
          id: 'new-pending-club-123',
          update: jest.fn(),
          get: jest.fn(() => ({
            data: () => ({
              user: 'test-user-123',
              club_name: 'New Test Club',
              club_campus: 'UTSG',
              club_description: 'New Test Description'
            })
          }))
        })),
        doc: jest.fn(() => ({
          get: jest.fn(() => ({
            exists: true,
            data: () => ({
              user: 'test-user-123',
              club_name: 'Test Club',
              club_campus: 'UTSG',
              club_description: 'Test Description'
            }),
            ref: {
              delete: jest.fn()
            }
          })),
          update: jest.fn()
        }))
      }));
    });

    it('should handle database error in DELETE request', async () => {
      const mockFirestore = require('../firebaseAdmin').firestore;
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'id') return 'pending-club-123';
              if (param === 'action') return 'approve';
              return null;
            })
          }
        }
      } as any;

      const response = await DELETE(mockRequest);
      expect(response.status).toBe(500);
      expect(response.data).toHaveProperty('error');

      // Restore default mock
      mockFirestore.collection.mockImplementation(() => ({
        orderBy: jest.fn(() => ({
          get: jest.fn(() => ({
            docs: [
              {
                id: 'pending-club-1',
                data: () => ({
                  user: 'test-user-123',
                  club_name: 'Test Club',
                  club_campus: 'UTSG',
                  club_description: 'Test Description',
                  club_image: '',
                  club_instagram: '',
                  created_at: 'mock-timestamp'
                })
              }
            ]
          }))
        })),
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => ({
              empty: true
            }))
          }))
        })),
        add: jest.fn(() => ({
          id: 'new-pending-club-123',
          update: jest.fn(),
          get: jest.fn(() => ({
            data: () => ({
              user: 'test-user-123',
              club_name: 'New Test Club',
              club_campus: 'UTSG',
              club_description: 'New Test Description'
            })
          }))
        })),
        doc: jest.fn(() => ({
          get: jest.fn(() => ({
            exists: true,
            data: () => ({
              user: 'test-user-123',
              club_name: 'Test Club',
              club_campus: 'UTSG',
              club_description: 'Test Description'
            }),
            ref: {
              delete: jest.fn()
            }
          })),
          update: jest.fn()
        }))
      }));
    });
  });
}); 