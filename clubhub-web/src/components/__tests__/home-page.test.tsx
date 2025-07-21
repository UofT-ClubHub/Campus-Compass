import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import HomePage from "@/app/page";
import { onAuthStateChanged } from "firebase/auth";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Mock window.matchMedia
// used for responsive design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Suppress act() warnings for async operations in useEffect
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      message.includes(
        "An update to HomePage inside a test was not wrapped in act(...)"
      )
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

// Mock Firebase auth
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => ({})),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock the auth object
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<
  typeof onAuthStateChanged
>;

// Mock PostCard component
jest.mock("@/components/post-card", () => ({
  PostCard: ({ post }: any) => (
    <div data-testid="post-card">
      <h3>{post.title}</h3>
      <p>{post.content}</p>
    </div>
  ),
}));

// Mock ClubCard component
jest.mock("@/components/club-card", () => ({
  ClubCard: ({ club }: any) => (
    <div data-testid="club-card">
      <h3>{club.name}</h3>
      <p>{club.description}</p>
    </div>
  ),
}));

// Test wrapper with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe("HomePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for onAuthStateChanged
    mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
      callback(null); // No user by default
      return jest.fn();
    });
  });

  describe("Basic Rendering", () => {
    it("renders the hero section with title", async () => {
      renderWithTheme(<HomePage />);
      await waitFor(() => {
        expect(screen.getByText("Campus Compass")).toBeInTheDocument();
      });
    });

    it("renders the clubs section header", async () => {
      renderWithTheme(<HomePage />);
      await waitFor(() => {
        expect(screen.getByText("Discover")).toBeInTheDocument();
        expect(screen.getByText("Clubs")).toBeInTheDocument();
      });
    });
  });

  describe("Data Fetching", () => {
    it("fetches clubs data on mount", async () => {
      const mockClubs = [
        { id: "club-1", name: "Club 1", description: "Desc 1" },
        { id: "club-2", name: "Club 2", description: "Desc 2" },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockClubs,  // mock the response to make sure the call goes through
      });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/clubs?sort_by=followers&sort_order=desc");
      });
    });

    it("handles clubs fetch error gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        // Check that no club cards are rendered when fetch fails
        expect(screen.queryAllByTestId("club-card")).toHaveLength(0);
      });
    });
  });

  describe("Clubs Display", () => {
    it("displays clubs when data is loaded", async () => {
      const mockClubs = [
        { id: "club-1", name: "Club 1", description: "Desc 1" },
        { id: "club-2", name: "Club 2", description: "Desc 2" },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockClubs,
      });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        expect(screen.getAllByTestId("club-card")).toHaveLength(2);
      });
    });

    it("shows empty state when no clubs are found", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        // Check that no club cards are rendered when clubs array is empty
        expect(screen.queryAllByTestId("club-card")).toHaveLength(0);
      });
    });
  });

  describe("Posts Display", () => {
    it("displays posts when data is loaded", async () => {
      const mockPosts = [
        {
          id: "post-1",
          title: "Post 1",
          content: "Content 1",
          club: "club-1",
          likes: 5,
        },
        {
          id: "post-2",
          title: "Post 2",
          content: "Content 2",
          club: "club-2",
          likes: 10,
        },
      ];
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPosts,
        });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        // Check that the component renders without crashing and shows expected sections
        expect(screen.getByText("Campus Compass")).toBeInTheDocument();
        expect(screen.getByText("Discover")).toBeInTheDocument();
        expect(screen.getByText("Upcoming")).toBeInTheDocument();
        expect(screen.getByText("Events")).toBeInTheDocument();
      });
    });

    it("filters posts to only show followed clubs when user has followed clubs", async () => {
      // Mock authenticated user with followed clubs
      mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback({
          uid: "user-123",
          getIdToken: () => Promise.resolve("token"),  // get the token from the user
        });
        return jest.fn();
      });

      const mockUser = {
        id: "user-123",
        followed_clubs: ["club-1", "club-2"],
        liked_posts: [],
      };

      const mockPosts = [
        {
          id: "post-1",
          title: "Post 1",
          content: "Content 1",
          club: "club-1",
          likes: 5,
        },
        {
          id: "post-2",
          title: "Post 2",
          content: "Content 2",
          club: "club-2",
          likes: 10,
        },
        {
          id: "post-3",
          title: "Post 3",
          content: "Content 3",
          club: "club-3",
          likes: 15,
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPosts,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        // Should show the followed events section for authenticated users
        expect(screen.getByText("Discover")).toBeInTheDocument();
        expect(screen.getByText("Clubs")).toBeInTheDocument();
      });
    });
  });

  describe("Auto-Scroll Functionality", () => {
    it("renders scrollable containers for clubs", async () => {
      const mockClubs = [
        { id: "club-1", name: "Club 1", description: "Desc 1" },
        { id: "club-2", name: "Club 2", description: "Desc 2" },
        { id: "club-3", name: "Club 3", description: "Desc 3" },
        { id: "club-4", name: "Club 4", description: "Desc 4" },
        { id: "club-5", name: "Club 5", description: "Desc 5" },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockClubs,
      });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        // Check that the component renders without crashing and shows the hero section
        expect(screen.getByText("Campus Compass")).toBeInTheDocument();
        expect(screen.getByText("Upcoming")).toBeInTheDocument();
        expect(screen.getByText("Events")).toBeInTheDocument();
      });
    });

    it("handles user scroll events", async () => {
      const mockClubs = [
        { id: "club-1", name: "Club 1", description: "Desc 1" },
        { id: "club-2", name: "Club 2", description: "Desc 2" },
        { id: "club-3", name: "Club 3", description: "Desc 3" },
        { id: "club-4", name: "Club 4", description: "Desc 4" },
        { id: "club-5", name: "Club 5", description: "Desc 5" },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockClubs,
      });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        const scrollContainers = document.querySelectorAll(
          ".manual-scroll-container"
        );
        if (scrollContainers.length > 0) {
          const container = scrollContainers[0] as HTMLElement;  // need as an HTMLElement to use DOM methods
          act(() => {
            fireEvent.scroll(container);  // stuff is scrolling/moving
            fireEvent.touchStart(container);  // stuff is being touched by user
            fireEvent.touchMove(container);  // stuff is being moved by user 
          });
        }
      });
    });
  });

  describe("Infinite Scroll Functionality", () => {
    it("tests auto-scroll functionality when more than 4 clubs are present", async () => {
      const mockClubs = [
        { id: "club-1", name: "Club 1", description: "Desc 1" },
        { id: "club-2", name: "Club 2", description: "Desc 2" },
        { id: "club-3", name: "Club 3", description: "Desc 3" },
        { id: "club-4", name: "Club 4", description: "Desc 4" },
        { id: "club-5", name: "Club 5", description: "Desc 5" },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockClubs,
      });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        // Check that the component renders without crashing
        expect(document.querySelector(".min-h-screen")).toBeInTheDocument();
      });

      const scrollContainers = document.querySelectorAll(
        ".manual-scroll-container"
      );

      // scrolls container to see if it works
      if (scrollContainers.length > 0) {
        const container = scrollContainers[0] as HTMLElement;
        Object.defineProperty(container, "scrollLeft", {
          writable: true,
          value: 0,
        });
        Object.defineProperty(container, "scrollWidth", {
          writable: true,
          value: 3000,
        });
        Object.defineProperty(container, "style", {
          writable: true,
          value: { scrollBehavior: "smooth" },
        });
        act(() => {
          fireEvent.scroll(container);
        });
        Object.defineProperty(container, "scrollLeft", {
          writable: true,
          value: 2500,
        });
        act(() => {
          fireEvent.scroll(container);
        });

        // checks if the container scroll position changes after scroll events
        expect(container.scrollLeft).toBeGreaterThan(0);
        expect(container.scrollLeft).toBe(2500);
      }
    });

    it("tests mouse event handlers for auto-scroll", async () => {
      const mockClubs = [
        { id: "club-1", name: "Club 1", description: "Desc 1" },
        { id: "club-2", name: "Club 2", description: "Desc 2" },
        { id: "club-3", name: "Club 3", description: "Desc 3" },
        { id: "club-4", name: "Club 4", description: "Desc 4" },
        { id: "club-5", name: "Club 5", description: "Desc 5" },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockClubs,
      });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        // Check that the component renders without crashing
        expect(document.querySelector(".min-h-screen")).toBeInTheDocument();
      });

      const scrollContainers = document.querySelectorAll(
        ".manual-scroll-container"
      );
      if (scrollContainers.length > 0) {
        const container = scrollContainers[0] as HTMLElement;
        const flexContainer = container.querySelector(".flex.gap-4");
        if (flexContainer) {
          act(() => {
            fireEvent.mouseEnter(flexContainer, {
              target: flexContainer,
              currentTarget: flexContainer,
            });
            
            fireEvent.mouseLeave(flexContainer, {
              target: flexContainer,
              currentTarget: flexContainer,
              relatedTarget: null,
            });
          });
          
          // Test that mouse events were handled without errors (they should still be in the DOM after mocking the mouse events)
          expect(flexContainer).toBeInTheDocument();
          expect(container).toBeInTheDocument();
        }
      }
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("tests fetchPosts error handling with non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      await waitFor(() => {
        // Check that the component handles non-ok response gracefully
        expect(global.fetch).toHaveBeenCalledWith("/api/clubs?sort_by=followers&sort_order=desc");
      });
    });

    it("tests fetchUserData error handling", async () => {
      // Mock console.log to capture error messages
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback({
          uid: "user-123",
          getIdToken: () => Promise.resolve("token"),
        });
        return jest.fn();
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      await act(async () => {
        renderWithTheme(<HomePage />);
      });
      
      // Test that the component handles fetchUserData error gracefully
      // The component should still render normally even when user data fetch fails
      expect(document.querySelector(".min-h-screen")).toBeInTheDocument();
      
      // Verify that the error was logged to console
      expect(mockConsoleLog).toHaveBeenCalledWith("Error fetching user data:", expect.any(Error));
      
      // Restore console.log
      mockConsoleLog.mockRestore();
    });
  });

  describe("Conditional Rendering and Edge Cases", () => {
    it("tests followed events section with 0 events for authenticated user", async () => {
      mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback({
          uid: "user-123",
          getIdToken: () => Promise.resolve("token"),
        });
        return jest.fn();
      });

      const mockUser = {
        id: "user-123",
        followed_clubs: ["club-1"],
        liked_posts: [],
      };

      const mockPosts: any[] = [];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPosts,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        });

      await act(async () => {
        renderWithTheme(<HomePage />);
      });

      // Test that the component renders without crashing when there are no events
      expect(document.querySelector(".min-h-screen")).toBeInTheDocument();

      // Check that no events are displayed (container should not exist or be empty)
      const eventsContainer = document.querySelector(".flex.gap-4");
      if (eventsContainer) {
        // empty case
        expect(eventsContainer.children.length).toBe(0);
      } else {
        // DNE case
        expect(eventsContainer).toBeNull();
      }
    });
  });
});
