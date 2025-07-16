jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
}));

global.fetch = jest.fn((url) => {
    const idMatch = url.toString().match(/\/([^\/]+)$/);
    const userId = idMatch ? idMatch[1] : "exec123";

    const responseBody = JSON.stringify({
      id: userId,
      name: `Executive ${userId}`,
    });

    return Promise.resolve(
      new Response(responseBody, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

import "@testing-library/jest-dom";

import React, { act } from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { ExpandableClubCard } from "../expandable-club-card";

// Wrap component with router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui);
};

const mockClub = {
  id: "club123",
  name: "Chess Club",
  campus: "North Campus",
  followers: 10,
  image: "/test-image.jpg",
  description: "All about chess.",
  executives: ["user1", "user2", "user3", "user4", "user5", "user6"],
  instagram: "@chessclub",
  links: ["https://chessclub.com"],
};

const mockUser = {
  managed_clubs: ["club123"],
  followed_clubs: ["club123"],
};

const notFollowingUser = {
    managed_clubs: [],
    followed_clubs: [], // Doesn't follow any clubs
  };

const mockExecutives = [
    { id: "exec123", name: "Alice" },
    { id: "exec124", name: "Bob" }, // ✅ now it's unique
  ];

describe("ExpandableClubCard", () => {
  const onClose = jest.fn();
  const onManagePosts = jest.fn();
  const onFollowerCountUpdate = jest.fn();
  const onPostUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Firebase
    const mockUserObj = {
      getIdToken: jest.fn(() => Promise.resolve("token123")),
    };

    (require("@/model/firebase") as any).default = {
      auth: () => ({
        currentUser: mockUserObj,
      }),
    };
  });

  it("renders all club data", async () => {
    await act(async () => {
      renderWithRouter(
        <ExpandableClubCard
          club={mockClub}
          currentUser={mockUser}
          onClose={onClose}
          onManagePosts={onManagePosts}
          onFollowerCountUpdate={onFollowerCountUpdate}
          onPostUpdate={onPostUpdate}
        />
      );
    });

    // Check static content
    expect(screen.getByText("Chess Club")).toBeInTheDocument();
    expect(screen.getByText("North Campus")).toBeInTheDocument();
    expect(screen.getByText("10 followers")).toBeInTheDocument();
    expect(screen.getByText("All about chess.")).toBeInTheDocument();

    // Executives section
    await waitFor(() => {
      expect(screen.getByText("Executives (6)")).toBeInTheDocument();
      expect(screen.getByText("+1 more")).toBeInTheDocument();
    });

    // Instagram
    expect(screen.getByText("@chessclub")).toBeInTheDocument();

    // Link
    expect(screen.getByText("https://chessclub.com")).toBeInTheDocument();

    // Buttons
    expect(screen.getByText("Manage")).toBeInTheDocument();
    expect(screen.getByText("Unfollow")).toBeInTheDocument();
  });

  it("calls onClose when clicking backdrop", async () => {
    await act(async () => {
      renderWithRouter(<ExpandableClubCard club={mockClub} currentUser={mockUser} onClose={onClose} />);
    });
    const backdrop = screen.getByTestId("backdrop");
fireEvent.click(backdrop);
expect(onClose).toHaveBeenCalled();
  });

  it("handles follow button click", async () => {
    const updatedUser = {
      managed_clubs: [],
      followed_clubs: [],
    };

    await act(async () => {
      renderWithRouter(
        <ExpandableClubCard
          club={mockClub}
          currentUser={updatedUser}
          onClose={onClose}
          onFollowerCountUpdate={onFollowerCountUpdate}
        />
      );
    });

    const followButton = screen.getByText("Follow");
    await act(async () => {
      fireEvent.click(followButton);
    });

    await waitFor(() => {
      expect(onFollowerCountUpdate).toHaveBeenCalled();
    });
  });

  it("shows alert if user not logged in when following", async () => {
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
    (require("@/model/firebase") as any).default = {
      auth: () => ({ currentUser: null }),
    };

    await act(async () => {
      renderWithRouter(
        <ExpandableClubCard
          club={mockClub}
          currentUser={null}
          onClose={onClose}
          onFollowerCountUpdate={onFollowerCountUpdate}
        />
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const followButton = screen.getByText("Follow");
    await act(async () => {
      fireEvent.click(followButton);
    });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Please log in to follow clubs");
    });

    alertMock.mockRestore();
  });

  it("handles instagram button click", async () => {
    window.open = jest.fn();
    await act(async () => {
      renderWithRouter(<ExpandableClubCard club={mockClub} currentUser={mockUser} onClose={onClose} />);
    });
    fireEvent.click(screen.getByText("@chessclub"));
    expect(window.open).toHaveBeenCalledWith(
      "https://www.instagram.com/chessclub",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("handles link click", async () => {
    window.open = jest.fn();
    await act(async () => {
      renderWithRouter(<ExpandableClubCard club={mockClub} currentUser={mockUser} onClose={onClose} />);
    });
    fireEvent.click(screen.getByText("https://chessclub.com"));
    expect(window.open).toHaveBeenCalledWith(
      "https://chessclub.com",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("disables follow button when loading or no user", async () => {
    const { rerender } = await act(async () =>
      renderWithRouter(
        <ExpandableClubCard
          club={mockClub}
          currentUser={notFollowingUser}
          onClose={onClose}
        />
      )
    );

    // run for every element on the page
    const btn = screen.getByText((content, el) =>
      el?.tagName === "BUTTON" && content.trim() === "Follow"
    );
    expect(btn).not.toBeDisabled(); // button should initially be enabled

    await act(async () => {
      rerender(
        <ExpandableClubCard
          club={mockClub}
          currentUser={null}
          onClose={onClose}
        />
      );
    });

    expect(screen.getByText("Follow")).toBeDisabled();
  });
});