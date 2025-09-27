import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PendingClubsManagement from '../pending-clubs-management';

// Mock Firebase auth
jest.mock('@/model/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock react-firebase-hooks/auth
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock timers for useEffect cleanup
jest.useFakeTimers();

describe('PendingClubsManagement Component', () => {
  const mockUser = {
    uid: 'user-123',
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
  };

  const mockPendingClubs = [
    {
      id: 'club-1',
      club_name: 'Test Club 1',
      club_description: 'Test description 1',
      club_campus: 'UTSG',
      user: 'user-1',
      created_at: { _seconds: 1640995200 }, // Jan 1, 2022
    },
    {
      id: 'club-2',
      club_name: 'Test Club 2',
      club_description: 'Test description 2',
      club_campus: 'UTSC',
      user: 'user-2',
      created_at: { _seconds: 1640995200 },
    },
  ];

  const mockUserDetails = {
    'user-1': {
      id: 'user-1',
      name: 'Test User 1',
      email: 'testuser1@example.com',
    },
    'user-2': {
      id: 'user-2',
      name: 'Test User 2',
      email: 'testuser2@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('shows loading state and then displays pending clubs with user details', async () => {
    const { useAuthState } = require('react-firebase-hooks/auth');
    useAuthState.mockReturnValue([mockUser, false, null]);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPendingClubs,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserDetails['user-1'],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserDetails['user-2'],
      });

    await act(async () => {
      render(<PendingClubsManagement />);
    });

    // Check loading state
    expect(screen.getByText('Pending Club Requests')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Club 1')).toBeInTheDocument();
      expect(screen.getByText('Test Club 2')).toBeInTheDocument();
      expect(screen.getByText('Test User 1 (testuser1@example.com)')).toBeInTheDocument();
      expect(screen.getByText('Test User 2 (testuser2@example.com)')).toBeInTheDocument();
    });

    // Verify API calls
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pending-clubs?',
      expect.objectContaining({
        headers: { 'Authorization': 'Bearer mock-token' },
      })
    );
  });

  it('handles fetch errors', async () => {
    const { useAuthState } = require('react-firebase-hooks/auth');
    useAuthState.mockReturnValue([mockUser, false, null]);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to fetch pending clubs' }),
    });

    await act(async () => {
      render(<PendingClubsManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch pending clubs')).toBeInTheDocument();
    });
  });

  it('shows empty state when no pending clubs', async () => {
    const { useAuthState } = require('react-firebase-hooks/auth');
    useAuthState.mockReturnValue([mockUser, false, null]);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<PendingClubsManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('No pending club requests found.')).toBeInTheDocument();
    });
  });

  it('handles user fetch failure', async () => {
    const { useAuthState } = require('react-firebase-hooks/auth');
    useAuthState.mockReturnValue([mockUser, false, null]);

    // mock fetch calls and return user not found error for both user-1 and user-2
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPendingClubs,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User not found' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User not found' }),
      });

    await act(async () => {
      render(<PendingClubsManagement />);
    });

    // Clubs still load so test to see if they show up and loading messages are shown
    await waitFor(() => {
      expect(screen.getByText('Test Club 1')).toBeInTheDocument();
      expect(screen.getAllByText('Loading user details...')).toHaveLength(2);
    });
  });

  it('displays approve and reject buttons for pending clubs', async () => {
    const { useAuthState } = require('react-firebase-hooks/auth');
    useAuthState.mockReturnValue([mockUser, false, null]);

    // Mock successful data loading
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [mockPendingClubs[0]] }) // initial clubs
      .mockResolvedValueOnce({ ok: true, json: async () => mockUserDetails['user-1'] }); // initial user

    await act(async () => {
      render(<PendingClubsManagement />);
    });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Club 1')).toBeInTheDocument();
    });

    // Verify approve and reject buttons are present
    expect(screen.getByTestId('approve-button')).toBeInTheDocument();
    expect(screen.getByTestId('reject-button')).toBeInTheDocument();
    
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('renders campus filter options', async () => {
    const { useAuthState } = require('react-firebase-hooks/auth');
    useAuthState.mockReturnValue([mockUser, false, null]);

    // Mock successful data loading
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // no clubs

    await act(async () => {
      render(<PendingClubsManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Club Requests')).toBeInTheDocument();
    });

    expect(screen.getByText('All Campuses')).toBeInTheDocument();
    expect(screen.getByText('UTSG')).toBeInTheDocument();
    expect(screen.getByText('UTSC')).toBeInTheDocument();
    expect(screen.getByText('UTM')).toBeInTheDocument();
  });

  it('auto-hides error messages after 5 seconds', async () => {
    const { useAuthState } = require('react-firebase-hooks/auth');
    useAuthState.mockReturnValue([mockUser, false, null]);

    // Mock fetch error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Test error' }),
    });

    await act(async () => {
      render(<PendingClubsManagement />);
    });

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  it('handles approve action', async () => {
    const { useAuthState } = require('react-firebase-hooks/auth');
    useAuthState.mockReturnValue([mockUser, false, null]);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [mockPendingClubs[0]] }) // initial clubs
      .mockResolvedValueOnce({ ok: true, json: async () => mockUserDetails['user-1'] }) // initial user
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: 'Club approved and created successfully!' }) }) // approve action
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // refresh clubs
      .mockResolvedValueOnce({ ok: true, json: async () => mockUserDetails['user-1'] }); // refresh user

    await act(async () => {
      render(<PendingClubsManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Club 1')).toBeInTheDocument();
    });

    const approveButton = screen.getByTestId('approve-button');
    await act(async () => {
      fireEvent.click(approveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Club approved and created successfully!')).toBeInTheDocument();
    });
  });
});