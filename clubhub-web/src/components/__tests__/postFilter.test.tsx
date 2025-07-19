import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PostFilterPage from '@/app/postFilter/page';
import {act } from 'react';

jest.mock('@/model/firebase', () => ({
  auth: {},
  default: {},
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null); // simulate no logged-in user
    return jest.fn(); // mock unsubscribe
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("PostFilter - sort_by and sort_order", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the sort-by select initially", () => {
    render(<PostFilterPage />);
    const sortBy = screen.getByTestId("sort-by");
    expect(sortBy).toBeInTheDocument();
  });

  it("shows sort-order select only after sort-by has a value", async () => {
    render(<PostFilterPage />);
    const sortBy = screen.getByTestId("sort-by");

    // Initially, sort-order should not be in the document
    expect(screen.queryByTestId("sort-order")).toBeNull();

    // Simulate selecting a value
    await act(async () => {
      fireEvent.change(sortBy, { target: { value: "likes" } });
    });

    // Now sort-order should appear
    expect(screen.getByTestId("sort-order")).toBeInTheDocument();
    expect(screen.getByTestId("sort-order")).toHaveValue("desc");
  });
});