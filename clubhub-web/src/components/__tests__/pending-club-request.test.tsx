import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PendingClubRequestPage from '../../app/pending-club-request/page';

// Mock Firebase auth
jest.mock('@/model/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock react-firebase-hooks
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock File API
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  
  constructor(bits: any[], name: string, options?: any) {
    this.name = name;
    this.size = bits.length;
    this.type = options?.type || 'image/jpeg';
  }
} as any;

describe('PendingClubRequestPage', () => {
  const mockUser = {
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
  };

  const mockUseAuthState = require('react-firebase-hooks/auth').useAuthState;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthState.mockReturnValue([mockUser, false, null]);
  });

  describe('Rendering', () => {
    it('renders the navigation buttons', () => {
      render(<PendingClubRequestPage />);
      expect(screen.getByText('New Request')).toBeInTheDocument();
      expect(screen.getByText('My Requests')).toBeInTheDocument();
    });

    it('renders all form fields in New Request section', () => {
      render(<PendingClubRequestPage />);
      
      expect(screen.getByLabelText('Club Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Campus *')).toBeInTheDocument();
      expect(screen.getByLabelText('Club Description *')).toBeInTheDocument();
      expect(screen.getByLabelText('Club Image (optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('Club Instagram')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Request' })).toBeInTheDocument();
    });

    it('renders campus options', () => {
      render(<PendingClubRequestPage />);
      
      expect(screen.getByText('Select a campus...')).toBeInTheDocument();
      expect(screen.getByText('UTSG')).toBeInTheDocument();
      expect(screen.getByText('UTSC')).toBeInTheDocument();
      expect(screen.getByText('UTM')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('updates club name when typed', async () => {
      const user = userEvent.setup();
      render(<PendingClubRequestPage />);
      
      const clubNameInput = screen.getByLabelText('Club Name *');
      await user.type(clubNameInput, 'Test Club');
      
      expect(clubNameInput).toHaveValue('Test Club');
    });

    it('updates campus when selected', async () => {
      const user = userEvent.setup();
      render(<PendingClubRequestPage />);
      
      const campusSelect = screen.getByLabelText('Campus *');
      await user.selectOptions(campusSelect, 'UTSC');
      
      expect(campusSelect).toHaveValue('UTSC');
    });

    it('updates club description when typed', async () => {
      const user = userEvent.setup();
      render(<PendingClubRequestPage />);
      
      const descriptionTextarea = screen.getByLabelText('Club Description *');
      await user.type(descriptionTextarea, 'Test description');
      
      expect(descriptionTextarea).toHaveValue('Test description');
    });

    it('updates Instagram handle when typed', async () => {
      const user = userEvent.setup();
      render(<PendingClubRequestPage />);
      
      const instagramInput = screen.getByLabelText('Club Instagram');
      await user.type(instagramInput, '@testclub');
      
      expect(instagramInput).toHaveValue('@testclub');
    });

    it('shows character count for description', async () => {
      const user = userEvent.setup();
      render(<PendingClubRequestPage />);
      
      const descriptionTextarea = screen.getByLabelText('Club Description *');
      await user.type(descriptionTextarea, 'Test');
      
      expect(screen.getByText('4/500 characters')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('disables submit button when required fields are empty', () => {
      render(<PendingClubRequestPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit Request' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<PendingClubRequestPage />);
      
      // Fill required fields
      await user.type(screen.getByLabelText('Club Name *'), 'Test Club');
      await user.selectOptions(screen.getByLabelText('Campus *'), 'UTSC');
      await user.type(screen.getByLabelText('Club Description *'), 'Test description');
      
      const submitButton = screen.getByRole('button', { name: 'Submit Request' });
      expect(submitButton).not.toBeDisabled();
    });

    it('enables submit button with trimmed whitespace', async () => {
      const user = userEvent.setup();
      render(<PendingClubRequestPage />);
      
      // Fill required fields with whitespace
      await user.type(screen.getByLabelText('Club Name *'), '   Test Club   ');
      await user.selectOptions(screen.getByLabelText('Campus *'), 'UTSC');
      await user.type(screen.getByLabelText('Club Description *'), '   Test description   ');
      
      const submitButton = screen.getByRole('button', { name: 'Submit Request' });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('File Upload', () => {
    it('handles file selection', async () => {
      const user = userEvent.setup();
      render(<PendingClubRequestPage />);
      
      const fileInput = screen.getByLabelText('Club Image (optional)');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);
      
      expect(fileInput.files?.[0]).toBe(file);
    });
  });

  describe('API Integration', () => {
    it('shows error when user is not logged in', async () => {
      mockUseAuthState.mockReturnValue([null, false, null]);
      
      const user = userEvent.setup();
      render(<PendingClubRequestPage />);
      
      // Fill form and submit
      await user.type(screen.getByLabelText('Club Name *'), 'Test Club');
      await user.selectOptions(screen.getByLabelText('Campus *'), 'UTSC');
      await user.type(screen.getByLabelText('Club Description *'), 'Test description');
      
      await user.click(screen.getByRole('button', { name: 'Submit Request' }));
      
      expect(screen.getByText('You must be logged in to request a club')).toBeInTheDocument();
    });

    it('submits form successfully', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ downloadURL: 'https://example.com/image.jpg' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });
      
      render(<PendingClubRequestPage />);
      
      // Fill form
      await user.type(screen.getByLabelText('Club Name *'), 'Test Club');
      await user.selectOptions(screen.getByLabelText('Campus *'), 'UTSC');
      await user.type(screen.getByLabelText('Club Description *'), 'Test description');
      await user.type(screen.getByLabelText('Club Instagram'), '@testclub');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: 'Submit Request' }));
      
      await waitFor(() => {
        expect(screen.getByText('Club request submitted successfully! Please wait for admin approval.')).toBeInTheDocument();
      });
    });

    it('submits form with image upload', async () => {
      const user = userEvent.setup();
      
      // Mock successful API responses for both upload and pending-clubs
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ downloadURL: 'https://example.com/image.jpg' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });
      
      render(<PendingClubRequestPage />);
      
      // Fill form
      await user.type(screen.getByLabelText('Club Name *'), 'Test Club');
      await user.selectOptions(screen.getByLabelText('Campus *'), 'UTSC');
      await user.type(screen.getByLabelText('Club Description *'), 'Test description');
      
      // Upload a file
      const fileInput = screen.getByLabelText('Club Image (optional)') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Submit form
      await user.click(screen.getByRole('button', { name: 'Submit Request' }));
      
      await waitFor(() => {
        expect(screen.getByText('Club request submitted successfully! Please wait for admin approval.')).toBeInTheDocument();
      });
    });

    it('handles upload API error', async () => {
        const user = userEvent.setup();
        
        // Mock failed upload API response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          json: async () => ({ error: 'Upload failed' })
        });
        
        render(<PendingClubRequestPage />);
        
        // Fill form
        await user.type(screen.getByLabelText('Club Name *'), 'Test Club');
        await user.selectOptions(screen.getByLabelText('Campus *'), 'UTSC');
        await user.type(screen.getByLabelText('Club Description *'), 'Test description');
        
        // Upload a file
        const fileInput = screen.getByLabelText('Club Image (optional)') as HTMLInputElement;
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        await user.upload(fileInput, file);
        
        // Submit form
        await user.click(screen.getByRole('button', { name: 'Submit Request' }));
        
        await waitFor(() => {
          expect(screen.getByText('Upload failed')).toBeInTheDocument();
        });
      });
  
      it('handles API error with finally block', async () => {
        const user = userEvent.setup();
        
        // Mock failed API response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          json: async () => ({ error: 'Failed to submit club request' })
        });
        
        render(<PendingClubRequestPage />);
        
        // Fill form
        await user.type(screen.getByLabelText('Club Name *'), 'Test Club');
        await user.selectOptions(screen.getByLabelText('Campus *'), 'UTSC');
        await user.type(screen.getByLabelText('Club Description *'), 'Test description');
        
        // Submit form
        await user.click(screen.getByRole('button', { name: 'Submit Request' }));
        
        await waitFor(() => {
          expect(screen.getByText('Failed to submit club request')).toBeInTheDocument();
          // Verify that the button is re-enabled after error (finally block)
          expect(screen.getByRole('button', { name: 'Submit Request' })).not.toBeDisabled();
        });
      });
  
      it('shows loading state during submission', async () => {
        const user = userEvent.setup();
        
        // Mock slow API response
        (global.fetch as jest.Mock).mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true })
          }), 200))
        );
        
        render(<PendingClubRequestPage />);
        
        // Fill form
        await user.type(screen.getByLabelText('Club Name *'), 'Test Club');
        await user.selectOptions(screen.getByLabelText('Campus *'), 'UTSC');
        await user.type(screen.getByLabelText('Club Description *'), 'Test description');
        
        // Submit form
        await user.click(screen.getByRole('button', { name: 'Submit Request' }));
        
        // Check that the button text changes to "Submitting..."
        await waitFor(() => {
          expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
        });
      });
    });
  
    describe('Form Reset', () => {
      it('clears form after successful submission', async () => {
        const user = userEvent.setup();
        
        // Mock successful API response
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ downloadURL: 'https://example.com/image.jpg' })
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true })
          });
        
        render(<PendingClubRequestPage />);
        
        // Fill form
        await user.type(screen.getByLabelText('Club Name *'), 'Test Club');
        await user.selectOptions(screen.getByLabelText('Campus *'), 'UTSC');
        await user.type(screen.getByLabelText('Club Description *'), 'Test description');
        await user.type(screen.getByLabelText('Club Instagram'), '@testclub');
        
        // Submit form
        await user.click(screen.getByRole('button', { name: 'Submit Request' }));
        
        await waitFor(() => {
          expect(screen.getByLabelText('Club Name *')).toHaveValue('');
          expect(screen.getByLabelText('Campus *')).toHaveValue('');
          expect(screen.getByLabelText('Club Description *')).toHaveValue('');
          expect(screen.getByLabelText('Club Instagram')).toHaveValue('');
        });
      });
    });

    describe('My Requests Section', () => {
      it('switches to My Requests view when button is clicked', async () => {
        const user = userEvent.setup();
        render(<PendingClubRequestPage />);
        
        const myRequestsButton = screen.getByText('My Requests');
        await user.click(myRequestsButton);
        
        // Form should not be visible
        expect(screen.queryByLabelText('Club Name *')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Submit Request' })).not.toBeInTheDocument();
      });

      it('shows loading state when fetching pending clubs', async () => {
        const user = userEvent.setup();
        render(<PendingClubRequestPage />);
        
        const myRequestsButton = screen.getByText('My Requests');
        await user.click(myRequestsButton);
        
        // Should show loading state initially
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      it('displays pending clubs when data is loaded', async () => {
        const mockPendingClubs = [
          {
            id: '1',
            club_name: 'Test Club 1',
            club_campus: 'UTSG',
            club_description: 'Test description 1',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            club_name: 'Test Club 2',
            club_campus: 'UTSC',
            club_description: 'Test description 2',
            status: 'pending',
            created_at: '2024-01-02T00:00:00Z'
          }
        ];

        // Mock the fetch for pending clubs
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockPendingClubs
        });

        const user = userEvent.setup();
        render(<PendingClubRequestPage />);
        
        const myRequestsButton = screen.getByText('My Requests');
        await user.click(myRequestsButton);
        
        // Wait for the data to load
        await waitFor(() => {
          expect(screen.getByText('Test Club 1')).toBeInTheDocument();
          expect(screen.getByText('Test Club 2')).toBeInTheDocument();
        });
      });

      it('shows empty state when no pending clubs exist', async () => {
        // Mock empty response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => []
        });

        const user = userEvent.setup();
        render(<PendingClubRequestPage />);
        
        const myRequestsButton = screen.getByText('My Requests');
        await user.click(myRequestsButton);
        
        await waitFor(() => {
          expect(screen.getByText('No club requests found.')).toBeInTheDocument();
        });
      });

      it('handles error when fetching pending clubs fails', async () => {
        // Mock error response
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

        const user = userEvent.setup();
        render(<PendingClubRequestPage />);
        
        const myRequestsButton = screen.getByText('My Requests');
        await user.click(myRequestsButton);
        
        await waitFor(() => {
          expect(screen.getByText('No club requests found.')).toBeInTheDocument();
        });
      });

      it('displays club details correctly', async () => {
        const mockPendingClub = {
          id: '1',
          club_name: 'Computer Science Club',
          club_campus: 'UTSG',
          club_description: 'A club for computer science enthusiasts',
          club_instagram: '@csclub',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z'
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => [mockPendingClub]
        });

        const user = userEvent.setup();
        render(<PendingClubRequestPage />);
        
        const myRequestsButton = screen.getByText('My Requests');
        await user.click(myRequestsButton);
        
        await waitFor(() => {
          expect(screen.getByText('Computer Science Club')).toBeInTheDocument();
          expect(screen.getByText('UTSG')).toBeInTheDocument();
          expect(screen.getByText('Pending')).toBeInTheDocument();
        });
      });

      it('switches back to New Request view when button is clicked', async () => {
        const user = userEvent.setup();
        render(<PendingClubRequestPage />);
        
        // First switch to My Requests
        const myRequestsButton = screen.getByText('My Requests');
        await user.click(myRequestsButton);
        
        // Then switch back to New Request
        const newRequestButton = screen.getByText('New Request');
        await user.click(newRequestButton);
        
        // Form should be visible again
        expect(screen.getByLabelText('Club Name *')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit Request' })).toBeInTheDocument();
      });
    });
  });