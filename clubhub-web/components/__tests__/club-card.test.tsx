import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClubCard } from '../club-card';
import type { Club } from '@/model/types';
import React from 'react';
import { act } from 'react';

jest.mock('../expandable-club-card', () => {
    const React = require('react');
    return {
      ExpandableClubCard: ({ onClose, onFollowerCountUpdate }: any) => {
        // Immediately simulate follower count update
        if (onFollowerCountUpdate) onFollowerCountUpdate(100);
  
        return React.createElement(
          'div',
          { 'data-testid': 'expandable-club-card' },
          React.createElement('button', { onClick: onClose }, 'Close')
        );
      },
    };
  });

// ✅ Mock fetch call
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve([
        {
          id: '1',
          name: 'Mock Executive',
          email: 'exec@example.com',
          campus: 'Main Campus',
          bio: 'Test Bio',
          followed_clubs: [],
          liked_posts: [],
          is_admin: false,
          is_executive: true,
          managed_clubs: [],
        },
      ]),
  })
) as jest.Mock;

const mockClub: Club = {
  id: 'club-1',
  name: 'Chess Club',
  description: 'A club for chess lovers.',
  image: '/test.jpg',
  campus: 'Main Campus',
  followers: 42,
  instagram: 'https://instagram.com/chessclub',
  links: ['https://chessclub.com'],
  executives: ['exec-1'],
};

describe('ClubCard', () => {
  it('renders club name and description', async () => {
    await act(async () => {
      render(<ClubCard club={mockClub} />);
    });

    expect(screen.getByText('Chess Club')).toBeInTheDocument();
    expect(screen.getByText('A club for chess lovers.')).toBeInTheDocument();
  });

  it('renders fallback image when image is missing', async () => {
    const clubWithoutImage = { ...mockClub, image: '' };

    await act(async () => {
      render(<ClubCard club={clubWithoutImage} />);
    });

    const image = screen.getByRole('img') as HTMLImageElement;
    expect(image.src).toContain('placeholder.svg');
  });

//   it('fetches and displays executives', async () => {
//     await act(async () => {
//       render(<ClubCard club={mockClub} />);
//     });
  
//     await waitFor(() => {
//       expect(screen.getByText('Executives')).toBeInTheDocument();
//       expect(screen.getByText((text) => text.includes('Mock Executive'))).toBeInTheDocument();
//     }, { timeout: 1500 });
//   });

  it('opens and closes ExpandableClubCard when clicked', async () => {
    await act(async () => {
      render(<ClubCard club={mockClub} />);
    });

    // Simulate opening
    fireEvent.click(screen.getByRole('img'));
    expect(await screen.findByTestId('expandable-club-card')).toBeInTheDocument();

    // Simulate closing
    fireEvent.click(screen.getByText('Close'));
    await waitFor(() => {
      expect(screen.queryByTestId('expandable-club-card')).not.toBeInTheDocument();
    });
  });

  it('logs an error when fetching executives fails', async () => {
    const errorSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  
    // Force fetch to reject
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));
  
    await act(async () => {
      render(<ClubCard club={mockClub} />);
    });
  
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to fetch executives:',
      expect.any(Error)
    );
  
    errorSpy.mockRestore();
  });

  it('updates follower count when handleFollowerCountUpdate is called', async () => {
    render(<ClubCard club={mockClub} />);
    fireEvent.click(screen.getByText('Chess Club'));
  
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('triggers non-ok branch in executive fetch', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(null),
    });
    global.fetch = fetchMock;
  
    await act(async () => {
      render(<ClubCard club={mockClub} />);
    });
  
    expect(fetchMock).toHaveBeenCalledWith('/api/users?id=exec-1');
  });

  it('does not fetch executives when executives array is empty', async () => {
    const clubWithoutExecutives = { ...mockClub, executives: [] };
  
    const fetchMock = jest.fn(); // Should never be called
    global.fetch = fetchMock;
  
    await act(async () => {
      render(<ClubCard club={clubWithoutExecutives} />);
    });
  
    expect(fetchMock).not.toHaveBeenCalled(); // Ensures the if block was skipped
  });
});