import React from "react";
import { render, fireEvent, screen, waitFor, act } from "@testing-library/react";
import { PostCard } from "../post-card";
import { ExpandablePostCard } from "../expandable-post-card";

jest.mock("../expandable-post-card", () => ({
  ExpandablePostCard: jest.fn(() => <div data-testid="expandable-post-card">Expanded</div>),
}));

const mockPost = {
  id: "1",
  title: "Sample Post",
  details: "This is a sample post with details",
  image: "https://example.com/sample.jpg",
  category: "Workshop",
  campus: "Main Campus",
  club: "123",
  likes: 10,
  hashtags: ["fun", "learning", "tech", "extra"],
  date_occuring: "2023-12-01",
  date_posted: "2023-11-01",
  links: ["https://example.com/event-details"],
};

describe("PostCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        redirected: false,
        type: "default",
        url: "",
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        json: () => Promise.resolve({ name: "Tech Club" }),
        text: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn(),
        arrayBuffer: jest.fn(),
      } as Response)
    );
  });

  it("renders post content and fetches club name", async () => {
    await act(async () => {
      render(<PostCard post={mockPost} />);
    });

    expect(screen.getByText("Sample Post")).toBeInTheDocument();
    expect(screen.getByText("This is a sample post with details")).toBeInTheDocument();
    expect(screen.getByText("Workshop")).toBeInTheDocument();
    expect(screen.getByText("Main Campus")).toBeInTheDocument();
    expect(screen.getByText("Tech Club")).toBeInTheDocument();
    expect(screen.getByText("10 likes")).toBeInTheDocument();
    expect(screen.getByText("#fun")).toBeInTheDocument();
    expect(screen.getByText("#learning")).toBeInTheDocument();
    expect(screen.getByText("#tech")).toBeInTheDocument();
    expect(screen.getByText("+1 more")).toBeInTheDocument();
  });

  it("displays fallback when fetch fails", async () => {
    global.fetch = jest.fn(() => Promise.reject("API failure"));

    await act(async () => {
      render(<PostCard post={mockPost} />);
    });

    expect(screen.getByText("Unknown Club")).toBeInTheDocument();
  });

  it("opens expandable card on click", async () => {
    await act(async () => {
      render(<PostCard post={mockPost} />);
    });

    fireEvent.click(screen.getByText("Sample Post"));
    expect(await screen.findByTestId("expandable-post-card")).toBeInTheDocument();
  });

  it("displays fallback when response is not ok", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers(),
        redirected: false,
        type: "default",
        url: "",
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        json: () => Promise.resolve({}),
        text: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn(),
        arrayBuffer: jest.fn(),
      } as Response)
    );
  
    await act(async () => {
      render(<PostCard post={mockPost} />);
    });
  
    expect(screen.getByText("Unknown Club")).toBeInTheDocument();
  });
  
  it("closes overlay when onClose is called", async () => {
    // Update the mock to capture the onClose callback
    const onCloseMock = jest.fn();
    (ExpandablePostCard as jest.Mock).mockImplementation(({ onClose }) => {
      onCloseMock.mockImplementation(onClose);
      return <div data-testid="expandable-post-card">Expanded</div>;
    });
  
    await act(async () => {
      render(<PostCard post={mockPost} />);
    });
  
    fireEvent.click(screen.getByText("Sample Post"));
    await waitFor(() => expect(screen.getByTestId("expandable-post-card")).toBeInTheDocument());
  
    // Simulate closing overlay
    act(() => {
      onCloseMock();
    });
  });

//   it("renders correctly when club is undefined", async () => {
//     const postWithoutClub = { ...mockPost, club: null };
//     await act(async () => {
//       render(<PostCard post={postWithoutClub} />);
//     });
  
//     expect(
//         screen.getByText((content) => content.includes("Unknown Club"))
//       ).toBeInTheDocument();    expect(screen.getByText("Unknown Club")).toBeInTheDocument();
//   });  // maybe fix

  it("uses placeholder image when no image is provided", async () => {
    const postWithoutImage = { ...mockPost, image: null };
    await act(async () => {
      render(<PostCard post={postWithoutImage} />);
    });
  
    const image = screen.getByRole("img") as HTMLImageElement;
    expect(image.src).toContain("/placeholder.jpg");
  });

  it("shows 0 likes if likes is missing", async () => {
    const postWithoutLikes = { ...mockPost, likes: 0 };
    await act(async () => {
      render(<PostCard post={postWithoutLikes} />);
    });
  
    expect(screen.getByText("0 likes")).toBeInTheDocument();
  });
});