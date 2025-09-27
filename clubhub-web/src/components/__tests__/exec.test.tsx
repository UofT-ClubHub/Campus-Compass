import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import ExecPage from '../../app/exec/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/model/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      getIdToken: jest.fn(),
    },
  },
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('@/components/expandable-post-card', () => ({
  ExpandablePostCard: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="expandable-post-card">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Global fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Global prompt mock
const mockPrompt = jest.fn();
global.prompt = mockPrompt;

// Console.log mock to suppress error logs in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('ExecPage - handleDeleteClub', () => {
  const mockPush = jest.fn();
  const mockGetIdToken = jest.fn();

  const mockUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    is_executive: true,
    is_admin: false,
    managed_clubs: ['club-1', 'club-2'],
  };

  const mockClubs = [
    {
      id: 'club-1',
      name: 'Test Club 1',
      description: 'A test club',
      campus: 'UTSC',
      image: 'test-image.jpg',
      instagram: '@testclub',
      followers: 100,
      executives: ['test-user-id'],
      links: ['https://example.com'],
    },
    {
      id: 'club-2',
      name: 'Test Club 2',
      description: 'Another test club',
      campus: 'UTSG',
      image: '',
      instagram: '',
      followers: 50,
      executives: ['test-user-id'],
      links: [],
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup auth mock
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback({ uid: 'test-user-id', getIdToken: mockGetIdToken });
      return jest.fn(); // unsubscribe function
    });

    // Setup default token
    mockGetIdToken.mockResolvedValue('mock-id-token');

    // Setup default fetch responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClubs[0]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClubs[1]),
      });
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('should cancel deletion when user does not type DELETE', async () => {
    // Mock user canceling the prompt
    mockPrompt.mockReturnValue('cancel');

    render(<ExecPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test Club 1')).toBeInTheDocument();
    });

    const initialFetchCallCount = mockFetch.mock.calls.length;

    // Find and click the delete button for the first club
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Verify prompt was called with correct message
    expect(mockPrompt).toHaveBeenCalledWith(
      'Are you sure you want to delete "Test Club 1"? Type "DELETE" to confirm:'
    );

    // Verify no additional API call was made (since deletion was cancelled)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockFetch).toHaveBeenCalledTimes(initialFetchCallCount);
  });

  it('should successfully delete club when user confirms', async () => {
    // Mock user confirming deletion
    mockPrompt.mockReturnValue('DELETE');
    
    // Mock successful deletion response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClubs[0]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClubs[1]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Club deleted successfully' }),
      });

    render(<ExecPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test Club 1')).toBeInTheDocument();
    });

    // Find and click the delete button for the first club
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Wait for deletion to complete
    await waitFor(() => {
      expect(screen.getByText('"Test Club 1" has been deleted successfully.')).toBeInTheDocument();
    });

    // Verify the delete API call was made
    expect(mockFetch).toHaveBeenCalledWith('/api/clubs?id=club-1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-id-token',
      },
    });

    // Verify success message is displayed
    expect(screen.getByText('"Test Club 1" has been deleted successfully.')).toBeInTheDocument();
  });

  it('should handle deletion failure from API', async () => {
    // Mock user confirming deletion
    mockPrompt.mockReturnValue('DELETE');
    
    render(<ExecPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test Club 1')).toBeInTheDocument();
    });

    // Clear the console log mock to track only the delete operation
    mockConsoleLog.mockClear();

    // Mock the next fetch call (which will be the delete) to fail
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to delete club' }),
      })
    );

    // Find and click the delete button for the first club
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Wait for the error handling to complete
    await waitFor(() => {
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Error deleting club:',
        expect.any(Error)
      );
    }, { timeout: 3000 });
    
    // Verify the error was logged correctly (line 334)
    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
  });



  it('should clear all open forms when deleting the club they belong to', async () => {
    // Mock user confirming deletion
    mockPrompt.mockReturnValue('DELETE');
    
    // Mock successful deletion response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClubs[0]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClubs[1]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Club deleted successfully' }),
      });

    render(<ExecPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test Club 1')).toBeInTheDocument();
    });

    // Open multiple forms for the club we're going to delete to test all if conditions
    // Open "Add Exec" form
    const addExecButtons = screen.getAllByText('Add Exec');
    fireEvent.click(addExecButtons[0]);
    
    // Open "Edit" form 
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Open "Post" form
    const postButtons = screen.getAllByText('Post');
    fireEvent.click(postButtons[0]);

    // Verify forms are open
    await waitFor(() => {
      expect(screen.getByText('Add New Executive')).toBeInTheDocument();
      expect(screen.getByText('Edit Club Information')).toBeInTheDocument();
      expect(screen.getByTestId('expandable-post-card')).toBeInTheDocument();
    });

    // Now delete the club - this should trigger all three if statements for form clearing
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Wait for deletion to complete
    await waitFor(() => {
      expect(screen.getByText('"Test Club 1" has been deleted successfully.')).toBeInTheDocument();
    });

    // Verify all forms are no longer visible (club is removed)
    expect(screen.queryByText('Add New Executive')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit Club Information')).not.toBeInTheDocument();
    expect(screen.queryByTestId('expandable-post-card')).not.toBeInTheDocument();
  });

  it('should show loading state during deletion', async () => {
    // Mock user confirming deletion
    mockPrompt.mockReturnValue('DELETE');
    
    // Create a promise that we can control
    let resolveDelete: (value: any) => void;
    const deletePromise = new Promise((resolve) => {
      resolveDelete = resolve;
    });
    
    // Mock delayed deletion response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClubs[0]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClubs[1]),
      })
      .mockReturnValueOnce(deletePromise);

    render(<ExecPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test Club 1')).toBeInTheDocument();
    });

    // Find and click the delete button for the first club
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Verify loading state is shown
    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    // Resolve the promise to complete deletion
    resolveDelete!({
      ok: true,
      json: () => Promise.resolve({ message: 'Club deleted successfully' }),
    });

    // Wait for deletion to complete
    await waitFor(() => {
      expect(screen.getByText('"Test Club 1" has been deleted successfully.')).toBeInTheDocument();
    });

    // Verify loading state is gone
    expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
  });
});