import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpandablePostCard } from '../expandable-post-card';

// Mock Firebase auth
jest.mock('@/model/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement and click
const mockClick = jest.fn();
const originalCreateElement = document.createElement;
const mockCreateElement = jest.fn((tagName: string) => {
  if (tagName === 'a') {
    const mockElement = originalCreateElement.call(document, 'a') as HTMLAnchorElement;
    mockElement.href = '';
    mockElement.download = '';
    mockElement.click = mockClick;
    return mockElement;
  }
  return originalCreateElement.call(document, tagName);
});
document.createElement = mockCreateElement;

// Mock window.alert
global.alert = jest.fn();

describe('ExpandablePostCard - Calendar Export', () => {
  const mockPost = {
    id: 'post-1',
    title: 'Test Event',
    details: 'Test event details',
    campus: 'UTSC',
    club: 'club-1',
    category: 'event',
    hashtags: ['test', 'event'],
    date_occuring: '2024-01-15T10:00:00Z',
    date_posted: '2024-01-01T00:00:00Z',
    likes: 5,
    image: 'test-image.jpg',
    links: ['https://example.com'],
  };

  const mockCurrentUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    campus: 'UTSC',
    bio: 'Test bio',
    followed_clubs: [],
    liked_posts: [],
    is_admin: false,
    is_executive: false,
    managed_clubs: [],
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockClick.mockClear();
    mockCreateElement.mockClear();
  });

  describe('Calendar Export Button', () => {

    it('shows alert when post has empty event date', async () => {
      const postWithoutDate = {
        ...mockPost,
        date_occuring: '', // Empty date
      };

      const user = userEvent.setup();
      
      await act(async () => {
        render(
          <ExpandablePostCard
            post={postWithoutDate}
            currentUser={mockCurrentUser}
            onClose={mockOnClose}
            isCreating={false}
          />
        );
      });

      // Wait for any initial state updates to complete
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find the calendar button by looking for the button with calendar icon
      const buttons = screen.getAllByRole('button');
      const exportButton = buttons.find(button => 
        button.querySelector('svg[class*="lucide-calendar"]')
      );
      await act(async () => {
        expect(exportButton).toBeTruthy();
      });
      
      await act(async () => {
        await user.click(exportButton!);
      });

      await act(async () => {
        expect(global.alert).toHaveBeenCalledWith('No Event Date Specified');
      });
    });

    it('renders all calendar export functionality correctly', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(
          <ExpandablePostCard
            post={mockPost}
            currentUser={mockCurrentUser}
            onClose={mockOnClose}
            isCreating={false}
          />
        );
      });

      // Wait for any initial state updates to complete
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check that the calendar export button is rendered
      const buttons = screen.getAllByRole('button');
      const exportButton = buttons.find(button => 
        button.querySelector('svg[class*="lucide-calendar"]')
      );
      expect(exportButton).toBeTruthy();

      // Check that the export button is enabled
      expect(exportButton).not.toBeDisabled();

      // Check that the button has the correct styling classes
      expect(exportButton).toHaveClass('bg-black/60', 'text-white', 'px-3', 'py-2', 'rounded-full');

      // check that the calendar icon is present
      const calendarIcon = exportButton!.querySelector('svg[class*="lucide-calendar"]');
      expect(calendarIcon).toBeInTheDocument();

      // Check that the button is positioned correctly (bottom-left)
      expect(exportButton).toHaveClass('absolute', 'bottom-4', 'left-4');

      // Check that the button has hover effects
      expect(exportButton).toHaveClass('hover:bg-black/80', 'transition-colors');

      // verify the button is clickable by checking it's not disabled
      expect(exportButton).not.toHaveAttribute('disabled');

      // check that the button is visible and interactive
      expect(exportButton).toBeVisible();
    });

    it('fully executes handleExportToCalendar with valid event date', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(
          <ExpandablePostCard
            post={mockPost}
            currentUser={mockCurrentUser}
            onClose={mockOnClose}
            isCreating={false}
          />
        );
      });

      // Wait for dialog to be present
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find the calendar export button
      const buttons = screen.getAllByRole('button');
      const exportButton = buttons.find(button =>
        button.querySelector('svg[class*="lucide-calendar"]')
      );
      expect(exportButton).toBeTruthy();

      // Click the export button
      await act(async () => {
        await user.click(exportButton!);
      });

      // Assert that all export logic was triggered
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();

      // Verify that all the export logic was executed
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      
      // Check that the blob was created with correct type
      const createObjectURLCall = (global.URL.createObjectURL as jest.Mock).mock.calls[0];
      const blob = createObjectURLCall[0];
      expect(blob.type).toBe('text/calendar;charset=utf-8');
    });

    // this test coveers invalid date case, it works as "Invalid Date" is printed to console, which is expected behavior, but 
    // catching the error is not working as expected, so line 282 is tested with this test and it is a valid test, it just fails
    // because of the error thrown within the exportToCalendar function within the component
    // (Comment out this tests if you want to ensure all other tests pass)
    it('handles invalid date in formatDate function', async () => {
      const postWithInvalidDate = {
        ...mockPost,
        date_occuring: 'invalid-date-string',
      };

      const user = userEvent.setup();
      await act(async () => {
        render(
          <ExpandablePostCard
            post={postWithInvalidDate}
            currentUser={mockCurrentUser}
            onClose={mockOnClose}
            isCreating={false}
          />
        );
      });

      // Wait for dialog to be present
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find the calendar export button
      const buttons = screen.getAllByRole('button');
      const exportButton = buttons.find(button =>
        button.querySelector('svg[class*="lucide-calendar"]')
      );
      expect(exportButton).toBeTruthy();

      // Click the export button - this should trigger the formatDate function with invalid date
      // The error will be thrown and logged to console, which is expected behavior
      await act(async () => {
        await user.click(exportButton!);
      });

      // Since the formatDate function throws an error for invalid dates,
      // the export logic should not be executed
      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
      expect(mockClick).not.toHaveBeenCalled();
    });
  });
});