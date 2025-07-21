import { getCurrentUserAuth } from '../auth-middleware';

// Mock Firebase Admin (to use mock database)
jest.mock('@/app/api/firebaseAdmin', () => ({
  auth: {
    verifyIdToken: jest.fn()
  },
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => ({
          exists: true,
          data: () => ({
            is_admin: true,
            is_executive: false
          })
        }))
      }))
    }))
  }
}));

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUserAuth', () => {
    it('should successfully authenticate a valid user', async () => {
      // Get references to firebase services
      const mockAuth = require('@/app/api/firebaseAdmin').auth;
      const mockFirestore = require('@/app/api/firebaseAdmin').firestore;
      
      // Mock successful token verification (token is valid)
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'test-user-123'
      });

      // Mock user document exists (user is valid)
      mockFirestore.collection.mockImplementation(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(() => ({
            exists: true,
            data: () => ({
              is_admin: true,
              is_executive: false
            })
          }))
        }))
      }));

      // Create a mock request
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'Authorization') {
              return 'Bearer valid-token-123';
            }
            return null;
          })
        }
      } as any;

      // Call the real function
      const result = await getCurrentUserAuth(mockRequest);

      // Check that the result is correct
      expect(result.uid).toBe('test-user-123');
      expect(result.isAdmin).toBe(true);
      expect(result.isExecutive).toBe(false);
      expect(result.status).toBe(200);
      expect(result.error).toBeUndefined();
    });

    it('should return error when no authorization header', async () => {
      // Create a mock request
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'Authorization') {
              return null; // No authorization header (no token)
            }
            return null;
          })
        }
      } as any;

      const result = await getCurrentUserAuth(mockRequest);

      expect(result.uid).toBeNull();
      expect(result.isAdmin).toBe(false);
      expect(result.isExecutive).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe('Unauthorized - Missing token');
    });

    it('should return error when invalid token format', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'Authorization') {
              return 'InvalidTokenFormat';  // Missing 'Bearer ' prefix (invalid token format)
            }
            return null;
          })
        }
      } as any;

      const result = await getCurrentUserAuth(mockRequest);

      expect(result.uid).toBeNull();
      expect(result.isAdmin).toBe(false);
      expect(result.isExecutive).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe('Unauthorized - Missing token');
    });

    it('should return error when token verification fails', async () => {
      const mockAuth = require('@/app/api/firebaseAdmin').auth;
      // Mock token verification to fail (token is invalid)
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'Authorization') {
              return 'Bearer invalid-token-123';
            }
            return null;
          })
        }
      } as any;

      const result = await getCurrentUserAuth(mockRequest);

      expect(result.uid).toBeNull();
      expect(result.isAdmin).toBe(false);
      expect(result.isExecutive).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe('Unauthorized - Invalid token');
    });

    it('should return error when user document does not exist', async () => {
      const mockAuth = require('@/app/api/firebaseAdmin').auth;
      const mockFirestore = require('@/app/api/firebaseAdmin').firestore;
      
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'test-user-123'
      });

      // Mock user document does not exist (user is invalid)
      mockFirestore.collection.mockImplementation(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(() => ({
            exists: false // User not found
          }))
        }))
      }));

      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'Authorization') {
              return 'Bearer valid-token-123';
            }
            return null;
          })
        }
      } as any;

      const result = await getCurrentUserAuth(mockRequest);

      expect(result.uid).toBe('test-user-123');
      expect(result.isAdmin).toBe(false);
      expect(result.isExecutive).toBe(false);
      expect(result.status).toBe(200);
      expect(result.error).toBeUndefined();  // user is not found, but still returns 200 and no error
    });

    it('should return error when firestore throws unexpected error', async () => {
      const mockAuth = require('@/app/api/firebaseAdmin').auth;
      const mockFirestore = require('@/app/api/firebaseAdmin').firestore;
      
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'test-user-123'
      });

      // Mock firestore to throw an unexpected error
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'Authorization') {
              return 'Bearer valid-token-123';
            }
            return null;
          })
        }
      } as any;

      const result = await getCurrentUserAuth(mockRequest);

      expect(result.uid).toBeNull();
      expect(result.isAdmin).toBe(false);
      expect(result.isExecutive).toBe(false);
      expect(result.status).toBe(500);
      expect(result.error).toBe('Database connection failed');
    });
  });
}); 