import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from '../../app/admin/page';

// Mock Firebase auth
jest.mock('@/model/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

// Mock the pending clubs management component
jest.mock('@/components/pending-clubs-management', () => ({
  __esModule: true,
  default: () => <div data-testid="pending-clubs-management">Pending Clubs Management</div>,
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('AdminPage', () => {
  const mockUser = {
    uid: 'test-user-id',
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
  };

  const mockAdminUser = {
    id: 'admin-user-id',
    name: 'Admin User',
    email: 'admin@test.com',
    campus: 'UTSC',
    bio: 'Admin bio',
    followed_clubs: [],
    liked_posts: [],
    is_admin: true,
    is_executive: false,
    managed_clubs: [],
  };

  const mockRegularUser = {
    id: 'regular-user-id',
    name: 'Regular User',
    email: 'user@test.com',
    campus: 'UTSG',
    bio: 'User bio',
    followed_clubs: [],
    liked_posts: [],
    is_admin: false,
    is_executive: false,
    managed_clubs: [],
  };

  const mockClub = {
    id: 'club-id',
    name: 'Test Club',
    description: 'Test club description',
    campus: 'UTSC',
    image: 'test-image.jpg',
    instagram: 'testclub',
    followers: 10,
    executives: [],
    links: [],
  };

  const mockOnAuthStateChanged = require('firebase/auth').onAuthStateChanged;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
      callback(mockUser);
      return jest.fn(); // Return unsubscribe function
    });
  });

  describe('Authentication and Access Control', () => {
    it('shows loading state initially', () => {
      render(<AdminPage />);
      expect(screen.getByText('Loading admin panel...')).toBeInTheDocument();
    });

    it('redirects to auth page when user is not logged in', async () => {
      const mockRouter = require('next/navigation').useRouter();
      mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback(null);
        return jest.fn();
      });

      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(mockRouter().push).toHaveBeenCalledWith('/auth');
      });
    });

    it('shows access denied when user is not admin', async () => {
      // Mock successful user fetch but user is not admin
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockRegularUser, is_admin: false })
      });

      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Access Denied: You are not an admin.')).toBeInTheDocument();
      });
    });

    it('renders admin panel when user is admin', async () => {
      // Mock successful user fetch with admin user
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAdminUser
      });

      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
        expect(screen.getByText('Welcome, Admin User')).toBeInTheDocument();
      });
    });
  });

  describe('User Management', () => {
    beforeEach(async () => {
      // Mock successful user fetch with admin user
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdminUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockRegularUser, mockAdminUser]
        });
    });

    it('displays user search filters', async () => {
      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Search Users')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Filter by name...')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Filter by email...')).toBeInTheDocument();
        expect(screen.getByDisplayValue('All Campuses')).toBeInTheDocument();
      });
    });

    it('displays users list', async () => {
      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Regular User (user@test.com) - Campus: UTSG')).toBeInTheDocument();
        expect(screen.getByText('Admin User (admin@test.com) - Campus: UTSC')).toBeInTheDocument();
      });
    });

    it('filters users by name', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      // Mock filtered response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockRegularUser]
      });

      const nameFilter = screen.getByPlaceholderText('Filter by name...');
      await user.type(nameFilter, 'Regular');

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });
    });

    it('filters users by email', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      // Mock filtered response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockRegularUser]
      });

      const emailFilter = screen.getByPlaceholderText('Filter by email...');
      await user.type(emailFilter, 'user@test.com');

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });
    });

    it('filters users by campus', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      // Mock filtered response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockRegularUser]
      });

      const campusFilter = screen.getByDisplayValue('All Campuses');
      await user.selectOptions(campusFilter, 'UTSG');

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });
    });
  });

  describe('User Editing', () => {
    beforeEach(async () => {
      // Mock successful user fetch with admin user
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdminUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockRegularUser, mockAdminUser]
        });
    });

    it('opens user edit form when user is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Regular User'));

      await waitFor(() => {
        expect(screen.getByText('Edit User: Regular User')).toBeInTheDocument();
        expect(screen.getByText('Is Admin (Read-only)')).toBeInTheDocument();
        expect(screen.getByText('Is Executive')).toBeInTheDocument();
        expect(screen.getByText('Managed Clubs')).toBeInTheDocument();
      });
    });

    it('allows editing executive status', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Regular User'));

      await waitFor(() => {
        const executiveCheckbox = screen.getByText('Is Executive').previousElementSibling as HTMLInputElement;
        expect(executiveCheckbox).not.toBeChecked();
      });

      const executiveCheckbox = screen.getByText('Is Executive').previousElementSibling as HTMLInputElement;
      await user.click(executiveCheckbox);

      expect(executiveCheckbox).toBeChecked();
    });

    it('saves user changes successfully', async () => {
      const user = userEvent.setup();
      
      // Mock successful update response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdminUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockRegularUser, mockAdminUser]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockRegularUser, is_executive: true })
        });

      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Regular User'));

      await waitFor(() => {
        expect(screen.getByText('Edit User: Regular User')).toBeInTheDocument();
      });

      const executiveCheckbox = screen.getByText('Is Executive').previousElementSibling as HTMLInputElement;
      await user.click(executiveCheckbox);

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(screen.getByText('User updated successfully!')).toBeInTheDocument();
      });
    });

    it('handles update error', async () => {
      const user = userEvent.setup();
      
      // Mock failed update response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdminUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockRegularUser, mockAdminUser]
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to update user' })
        });

      await act(async () => {
        render(<AdminPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Regular User'));

      await waitFor(() => {
        expect(screen.getByText('Edit User: Regular User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update user')).toBeInTheDocument();
      });
    });

    it('cancels editing', async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Regular User'));

      await waitFor(() => {
        expect(screen.getByText('Edit User: Regular User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Edit User: Regular User')).not.toBeInTheDocument();
      });
    });
  });

  describe('Club Management', () => {
    beforeEach(async () => {
      // Mock successful user fetch with admin user
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdminUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockRegularUser, mockAdminUser]
        });
    });

    it('searches for clubs to add', async () => {
      const user = userEvent.setup();
      
      // Mock club search response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdminUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockRegularUser, mockAdminUser]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockClub]
        });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Regular User'));

      await waitFor(() => {
        expect(screen.getByText('Edit User: Regular User')).toBeInTheDocument();
      });

      const clubSearchInput = screen.getByPlaceholderText('Search clubs to add...');
      await user.type(clubSearchInput, 'Test Club');

      await waitFor(() => {
        expect(screen.getByText('Test Club (ID: club-id)')).toBeInTheDocument();
      });
    });

    it('adds club to managed clubs', async () => {
      const user = userEvent.setup();
      
      // Mock club search response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdminUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockRegularUser, mockAdminUser]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockClub]
        });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Regular User'));

      await waitFor(() => {
        expect(screen.getByText('Edit User: Regular User')).toBeInTheDocument();
      });

      const clubSearchInput = screen.getByPlaceholderText('Search clubs to add...');
      await user.type(clubSearchInput, 'Test Club');

      await waitFor(() => {
        expect(screen.getByText('Test Club (ID: club-id)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Test Club (ID: club-id)'));

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
      });
    });

    it('removes club from managed clubs', async () => {
      const user = userEvent.setup();
      
      // Mock club details response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdminUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockRegularUser, mockAdminUser]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockClub
        });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Regular User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Regular User'));

      await waitFor(() => {
        expect(screen.getByText('Edit User: Regular User')).toBeInTheDocument();
      });

      // Add a club first
      const clubSearchInput = screen.getByPlaceholderText('Search clubs to add...');
      await user.type(clubSearchInput, 'Test Club');

      await waitFor(() => {
        expect(screen.getByText('Test Club (ID: club-id)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Test Club (ID: club-id)'));

      // Now remove it
      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Remove'));

      await waitFor(() => {
        expect(screen.queryByText('Test Club')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error when fetching users', async () => {
      // Mock failed users fetch
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdminUser
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to fetch users' })
        });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
      });
    });

    it('handles API error when fetching current user', async () => {
      // Mock failed current user fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to fetch user data' })
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch user data')).toBeInTheDocument();
      });
    });

    it('auto-dismisses error messages after 5 seconds', async () => {
      jest.useFakeTimers();
      
      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Test error' })
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Fast-forward time by 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.queryByText('Test error')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Pending Clubs Management', () => {
    it('renders pending clubs management component', async () => {
      // Mock successful user fetch with admin user
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdminUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockRegularUser, mockAdminUser]
        });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pending-clubs-management')).toBeInTheDocument();
        expect(screen.getByText('Pending Clubs Management')).toBeInTheDocument();
      });
    });
  });
});
