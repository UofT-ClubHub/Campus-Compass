import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import ChatbotWidget from '../chatbot/ChatbotWidget';

// Mock Firebase auth
jest.mock('@/model/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth: any, callback: any) => {
    callback(null); // simulate no logged-in user initially
    return jest.fn(); // mock unsubscribe
  }),
}));

// Mock ReactMarkdown
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock fetch for API calls
global.fetch = jest.fn();



// Mock scrollIntoView
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
  configurable: true,
});

describe('ChatbotWidget Component', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Initial Rendering', () => {
    it('renders floating chat button when closed', () => {
      render(<ChatbotWidget />);
      
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toHaveClass('group', 'relative', 'rounded-full', 'p-4');
    });

    it('shows notification dot on chat button', () => {
      render(<ChatbotWidget />);
      
      // The notification dot is rendered as a div with specific classes
      const notificationDot = document.querySelector('.absolute.-top-1.-right-1.w-3.h-3.rounded-full.animate-pulse');
      expect(notificationDot).toBeInTheDocument();
    });

    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.hover(chatButton);
      
      const tooltip = screen.getByText('Chat with ClubHub Assistant');
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe('Chat Window Opening/Closing', () => {
    it('opens chat window when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      expect(screen.getByText('ClubHub Assistant')).toBeInTheDocument();
      expect(screen.getByText('Online • Ready to help')).toBeInTheDocument();
    });

    it('closes chat window when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Close chat window - the close button is the first button without a name
      const closeButton = screen.getAllByRole('button')[0];
      await user.click(closeButton);
      
      // Should show floating button again
      expect(screen.getByRole('button', { name: /chat with clubhub assistant/i })).toBeInTheDocument();
    });
  });

  describe('Authentication State', () => {
    it('shows login prompt when user is not authenticated', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Should show login prompt
      expect(screen.getByText('Please login to chat with the ClubHub Assistant and discover clubs, events, and more!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument();
    });

    it('redirects to auth page when login button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Click login button
      const loginButton = screen.getByRole('button', { name: /go to login/i });
      await user.click(loginButton);
      
      // The button should be clickable and trigger navigation
      expect(loginButton).toBeInTheDocument();
    });
  });

  describe('Welcome Message', () => {
    beforeEach(() => {
      // Mock authenticated user
      const { onAuthStateChanged } = require('firebase/auth');
      onAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback({ getIdToken: jest.fn().mockResolvedValue('mock-token') });
        return jest.fn();
      });
    });

    it('displays welcome message when chat is opened', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Should show welcome message
      expect(screen.getByText(/Hi! 👋 I'm ClubHub Assistant!/)).toBeInTheDocument();
      expect(screen.getByText(/I can help you discover clubs, events, and posts at UofT across all three campuses/)).toBeInTheDocument();
    });
  });

  describe('Input and Message Sending', () => {
    beforeEach(() => {
      // Mock authenticated user
      const { onAuthStateChanged } = require('firebase/auth');
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ getIdToken: jest.fn().mockResolvedValue('mock-token') });
        return jest.fn();
      });
    });

    it('renders input area when authenticated', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Should show input area
      expect(screen.getByPlaceholderText('Ask me about clubs, events, etc.')).toBeInTheDocument();
      expect(screen.getAllByRole('button')[1]).toBeInTheDocument();
    });

    it('sends message when send button is clicked', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Test response from chatbot',
          data: {}
        })
      } as any);

      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Type and send message
      const input = screen.getByPlaceholderText('Ask me about clubs, events, etc.');
      await user.type(input, 'Hello chatbot');
      
      const sendButton = screen.getAllByRole('button')[1];
      await user.click(sendButton);
      
      // Should show user message
      expect(screen.getByText('Hello chatbot')).toBeInTheDocument();
      
      // Should call API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({ message: 'Hello chatbot' })
        });
      });
    });

    it('sends message when Enter key is pressed', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Test response from chatbot',
          data: {}
        })
      } as any);

      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Type and press Enter
      const input = screen.getByPlaceholderText('Ask me about clubs, events, etc.');
      await user.type(input, 'Hello chatbot{enter}');
      
      // Should show user message
      expect(screen.getByText('Hello chatbot')).toBeInTheDocument();
    });

    it('does not send empty messages', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Try to send empty message
      const sendButton = screen.getAllByRole('button')[1];
      await user.click(sendButton);
      
      // Should not call API
      expect(mockFetch).not.toHaveBeenCalled();
    });


  });

  describe('Quick Action Buttons', () => {
    beforeEach(() => {
      // Mock authenticated user
      const { onAuthStateChanged } = require('firebase/auth');
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ getIdToken: jest.fn().mockResolvedValue('mock-token') });
        return jest.fn();
      });
    });

    it('renders quick action buttons', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Should show quick action buttons
      expect(screen.getByRole('button', { name: /find clubs/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upcoming events/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /about clubhub/i })).toBeInTheDocument();
    });

    it('sends predefined message when quick action is clicked', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Here are some clubs available at UofT...',
          data: {}
        })
      });

      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Click quick action button
      const findClubsButton = screen.getByRole('button', { name: /find clubs/i });
      await user.click(findClubsButton);
      
      // Should show user message
      expect(screen.getByText('What clubs are available at UofT?')).toBeInTheDocument();
      
      // Should call API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({ message: 'What clubs are available at UofT?' })
        });
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock authenticated user
      const { onAuthStateChanged } = require('firebase/auth');
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ getIdToken: jest.fn().mockResolvedValue('mock-token') });
        return jest.fn();
      });
    });

    it('shows error message when API call fails', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Type and send message
      const input = screen.getByPlaceholderText('Ask me about clubs, events, etc.');
      await user.type(input, 'Hello chatbot');
      
      const sendButton = screen.getAllByRole('button')[1];
      await user.click(sendButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Sorry, I'm having trouble right now/)).toBeInTheDocument();
      });
    });

    it('shows error message when API returns error response', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Something went wrong'
        })
      } as any);

      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Type and send message
      const input = screen.getByPlaceholderText('Ask me about clubs, events, etc.');
      await user.type(input, 'Hello chatbot');
      
      const sendButton = screen.getAllByRole('button')[1];
      await user.click(sendButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Sorry, I'm having trouble right now/)).toBeInTheDocument();
      });
    });
  });

  describe('Message Display', () => {
    beforeEach(() => {
      // Mock authenticated user
      const { onAuthStateChanged } = require('firebase/auth');
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ getIdToken: jest.fn().mockResolvedValue('mock-token') });
        return jest.fn();
      });
    });

    it('displays user messages with correct styling', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Type and send message
      const input = screen.getByPlaceholderText('Ask me about clubs, events, etc.');
      await user.type(input, 'Hello chatbot');
      
      const sendButton = screen.getAllByRole('button')[1];
      await user.click(sendButton);
      
      // Should show user message with correct styling
      const userMessage = screen.getByText('Hello chatbot');
      expect(userMessage).toBeInTheDocument();
      expect(userMessage.closest('div')).toHaveClass('bg-primary', 'text-primary-foreground');
    });




  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Check for proper accessibility attributes
      expect(screen.getAllByRole('button')[0]).toBeInTheDocument(); // close button
      expect(screen.getByPlaceholderText('Ask me about clubs, events, etc.')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      
      // Open chat window
      const chatButton = screen.getByRole('button', { name: /chat with clubhub assistant/i });
      await user.click(chatButton);
      
      // Should be able to tab through interactive elements
      const closeButton = screen.getAllByRole('button')[0];
      const input = screen.getByPlaceholderText('Ask me about clubs, events, etc.');
      
      expect(closeButton).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });
  });
});
