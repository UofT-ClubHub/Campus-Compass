import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// Mock Firebase and Firestore
jest.mock('@/model/firebase', () => ({
  auth: {
    currentUser: null,
  },
  default: {},
}));

// Mocking firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}));

// Mocking auth functions
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock PostCard component
jest.mock('@/components/post-card', () => ({
  PostCard: ({ post }: any) => (
    <div data-testid="post-card">
      <h3>{post.title}</h3>
      <p>{post.content}</p>
    </div>
  ),
}));

// Import the real component
import ClubPage from '@/app/clubPage/[clubID]/page';

describe('ClubPage Component', () => {
  const mockGetDocs = require('firebase/firestore').getDocs;
  const mockOnAuthStateChanged = require('firebase/auth').onAuthStateChanged;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful Firestore responses
    // mock the getDocs function to return the mock data
    mockGetDocs
      .mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => ({
            name: 'Test Club',
            description: 'A test club for testing',
            campus: 'UTSG',
            instagram: '@testclub',
            image: '/test-image.jpg',
            followers: 42,
            executives: ['exec-1', 'exec-2'],
          })
        }]
      })
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'post-1',
            data: () => ({
              title: 'Test Post 1',
              content: 'Test content 1',
              club: 'club-123',
              likes: 5,
              created_at: { _seconds: 1640995200 },
            })
          }
        ]
      });

    // Mock auth state
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // No authenticated user initially
      return jest.fn(); // unsubscribe function
    });

    // Mock successful API responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        followed_clubs: [],
        liked_posts: [],
        managed_clubs: [],
      }),
    });
  });

  describe('Club Data Display', () => {
    it('displays club information when data loads successfully', async () => {
      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
        expect(screen.getByText('A test club for testing')).toBeInTheDocument();
        expect(screen.getByText('UTSG')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Followers')).toBeInTheDocument();
      });
    });

    it('displays club image when available', async () => {
      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        const clubImage = screen.getByAltText('Test Club logo');
        expect(clubImage).toBeInTheDocument();
        expect(clubImage).toHaveAttribute('src', '/test-image.jpg');
      });
    });

    it('displays club stats correctly', async () => {
      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Followers')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Executives')).toBeInTheDocument();
        expect(screen.getByText('@testclub')).toBeInTheDocument();
        expect(screen.getByText('UTSG')).toBeInTheDocument();
      });
    });
  });

  describe('Posts Display', () => {
    it('displays posts when available', async () => {
      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.getByText('Test content 1')).toBeInTheDocument();
      });
    });

    it('renders post cards with correct structure', async () => {
      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        const postCards = screen.getAllByTestId('post-card');
        expect(postCards).toHaveLength(1);
      });
    });
  });

  describe('Component Structure', () => {
    it('renders main layout structure', async () => {
      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByText('Test Club')).toBeInTheDocument();
      });
    });

    it('renders header with background image', async () => {
      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        const header = screen.getByRole('banner');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass('relative', 'text-white', 'rounded-2xl');
      });
    });


  });

  describe('Authentication States', () => {
    it('shows follow button when user is authenticated', async () => {
      // Mock authenticated user (logged in user)
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ uid: 'user-123', getIdToken: () => Promise.resolve('token') });  // mock the user token
        return jest.fn();
      });

      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
        // Should show follow button for authenticated users
        expect(screen.getByText('Follow')).toBeInTheDocument();
      });
    });

    it('hides follow button when user is not authenticated', async () => {
      // Mock unauthenticated user (not logged in user)
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);  // return null so the user is not logged in (no token)
        return jest.fn();
      });

      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
        // Should NOT show follow button for unauthenticated users
        expect(screen.queryByText('Follow')).not.toBeInTheDocument();
        expect(screen.queryByText('Unfollow')).not.toBeInTheDocument();
      });
    });

    it('shows manage club button for club executives', async () => {
      // Mock authenticated user who is a club executive
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ uid: 'user-123', getIdToken: () => Promise.resolve('token') });
        return jest.fn();
      });

      // Mock user data showing they manage this club
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          followed_clubs: [],
          liked_posts: [],
          managed_clubs: ['club-123'], // User manages this club
        }),
      });

      // create clubPage with the component that the user manages 
      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
        expect(screen.getByText('Follow')).toBeInTheDocument();
        expect(screen.getByText('Manage Club')).toBeInTheDocument();
      });
    });

    it('hides manage club button for non-executives', async () => {
      // Mock authenticated user who is NOT a club executive
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ uid: 'user-123', getIdToken: () => Promise.resolve('token') });
        return jest.fn();
      });

      // Mock user data showing they don't manage this club
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          followed_clubs: [],
          liked_posts: [],
          managed_clubs: [], // User doesn't manage this club
        }),
      });

      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
        expect(screen.getByText('Follow')).toBeInTheDocument();
        expect(screen.queryByText('Manage Club')).not.toBeInTheDocument();  // user is not executive so they cant manage club
      });
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      // Mock fetch error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
      });
    });

    it('handles club data with missing optional fields', async () => {
      // Mock club data with missing fields
      mockGetDocs
        .mockResolvedValueOnce({
          empty: false,
          docs: [{
            data: () => ({
              name: 'Test Club',
              description: 'A test club for testing',
            })
          }]
        })
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'post-1',
              data: () => ({
                title: 'Test Post 1',
                content: 'Test content 1',
                club: 'club-123',
                likes: 5,
                created_at: { _seconds: 1640995200 },
              })
            }
          ]
        });

      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
        expect(screen.getByText('A test club for testing')).toBeInTheDocument();
      });
    });
  });

  describe('Follow Club Functionality', () => {
    it('handles follow club success', async () => {
      // Mock authenticated user
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ uid: 'user-123', getIdToken: () => Promise.resolve('token') }); // authenticated user
        return jest.fn();
      });

      // Mock successful follow API response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            followed_clubs: [],
            liked_posts: [],
            managed_clubs: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            following: true,
            followersCount: 43,  // increment followers count 
          }),
        });

      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
        expect(screen.getByText('Follow')).toBeInTheDocument();
      });

      // Click the follow button to trigger handleFollowClub function
      const followButton = screen.getByText('Follow');
      await act(async () => {
        followButton.click();
      });

      // Verify that the follow button click triggered the function (and no errors are thrown)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    // this test case cases component to throw an error, so error will be thrown on console (NOT AN ISSUE, ITS EXPECTED)
    it('handles follow club error', async () => {
      // Mock authenticated user
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ uid: 'user-123', getIdToken: () => Promise.resolve('token') });
        return jest.fn();
      });

      // Mock failed follow API response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            followed_clubs: [],
            liked_posts: [],
            managed_clubs: [],
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'));  // second API call should fail so we do this

      // Mock alert
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
        expect(screen.getByText('Follow')).toBeInTheDocument();
      });

      // Click the follow button to trigger error handling
      const followButton = screen.getByText('Follow');
      await act(async () => {
        followButton.click();
      });

      // Verify error handling was triggered
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      // restore the mock alert (cleanup)
      mockAlert.mockRestore();
    });

    // this test case cases component to throw an error, so error will be thrown on console (NOT AN ISSUE, ITS EXPECTED)
    it('handles follow club when user is not authenticated', async () => {
      // Mock authenticated user
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ uid: 'user-123', getIdToken: () => Promise.resolve('token') });
        return jest.fn();
      });

      // Mock user data but then make auth.currentUser null when follow is called
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          followed_clubs: [],
          liked_posts: [],
          managed_clubs: [],
        }),
      });

      // Mock alert
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Mock auth.currentUser to be null when follow is called
      const mockAuth = require('@/model/firebase').auth;
      mockAuth.currentUser = null;

      await act(async () => {
        render(<ClubPage params={Promise.resolve({ clubID: 'club-123' })} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
        expect(screen.getByText('Follow')).toBeInTheDocument();
      });

      // Click the follow button
      const followButton = screen.getByText('Follow');
      await act(async () => {
        followButton.click();
      });

      // Verify error handling for unauthenticated user
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Please log in to follow clubs');
      });

      // restore the mock alert (cleanup)
      mockAlert.mockRestore();
    });
  });
});