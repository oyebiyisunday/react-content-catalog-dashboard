import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ArticleArchive from "../components/ArticleArchive";
import { useArticlesQuery } from "../hooks/useArticles";

jest.mock("../hooks/useArticles");

const mockArticles = [
  {
    id: 1,
    title: "Goalie meltdown highlights",
    comment_count: 10,
    author: { name: "Jordie" },
    date: "2021-01-19T15:30:00Z",
    tags: ["react", "testing"],
  },
  {
    id: 2,
    title: "Coffee bets and picks",
    comment_count: 2,
    author: { name: "Portnoy" },
    date: "2021-02-01T10:15:00Z",
    tags: ["webdev"],
  },
];

function mockQuery(overrides = {}) {
  return {
    data: mockArticles,
    isLoading: false,
    isError: false,
    isFetching: false,
    isStale: false,
    dataUpdatedAt: 1700000000000,
    refetch: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  useArticlesQuery.mockReturnValue(mockQuery());
  window.history.pushState({}, "", "/");
});

afterEach(() => {
  useArticlesQuery.mockReset();
});

test("filters results by search term", () => {
  render(<ArticleArchive />);

  fireEvent.change(screen.getByLabelText(/search/i), {
    target: { value: "goalie" },
  });
  fireEvent.click(screen.getByRole("button", { name: /apply/i }));

  const resultsList = screen.getByRole("list");
  expect(within(resultsList).getAllByRole("article")).toHaveLength(1);
});

test("filters results by author", () => {
  render(<ArticleArchive />);

  fireEvent.change(screen.getByRole("combobox", { name: /author/i }), {
    target: { value: "Portnoy" },
  });

  const resultsList = screen.getByRole("list");
  expect(within(resultsList).getAllByRole("article")).toHaveLength(1);
});

test("filters results by date range from sidebar", () => {
  const nowSpy = jest
    .spyOn(Date, "now")
    .mockReturnValue(new Date("2021-02-02T00:00:00Z").getTime());

  render(<ArticleArchive />);

  fireEvent.change(screen.getByRole("combobox", { name: /date range/i }), {
    target: { value: "7" },
  });

  const resultsList = screen.getByRole("list");
  expect(within(resultsList).getAllByRole("article")).toHaveLength(1);

  nowSpy.mockRestore();
});

test("filters results by minimum comments from sidebar", () => {
  render(<ArticleArchive />);

  fireEvent.change(screen.getByRole("combobox", { name: /minimum comments/i }), {
    target: { value: "5" },
  });

  const resultsList = screen.getByRole("list");
  expect(within(resultsList).getAllByRole("article")).toHaveLength(1);
});

test("filters results by tag from sidebar", () => {
  render(<ArticleArchive />);

  fireEvent.click(screen.getByRole("checkbox", { name: /react/i }));

  const resultsList = screen.getByRole("list");
  expect(within(resultsList).getAllByRole("article")).toHaveLength(1);
});

test("clamps invalid range and min comments from URL params", () => {
  window.history.pushState({}, "", "/?range=15&minComments=3");

  render(<ArticleArchive />);

  expect(screen.getByRole("combobox", { name: /date range/i }).value).toBe("all");
  expect(screen.getByRole("combobox", { name: /minimum comments/i }).value).toBe(
    "0"
  );
});

test("resets sort when not allowed for the selected source", async () => {
  window.history.pushState({}, "", "/?source=devto&sort=author");

  render(<ArticleArchive />);

  await waitFor(() => {
    expect(screen.getByRole("combobox", { name: /^sort$/i }).value).toBe(
      "newest"
    );
  });
});

test("shows an error state when the query fails", () => {
  useArticlesQuery.mockReturnValue(
    mockQuery({ data: [], isError: true, error: new Error("Fail") })
  );

  render(<ArticleArchive />);

  expect(screen.getByRole("alert")).toHaveTextContent(/unable to load/i);
});

test("shows loading skeletons while fetching initial data", () => {
  useArticlesQuery.mockReturnValue(mockQuery({ data: [], isLoading: true }));

  const { container } = render(<ArticleArchive />);

  const list = screen.getByRole("list");
  expect(list).toHaveAttribute("aria-busy", "true");
  expect(container.querySelectorAll(".skeleton-card").length).toBeGreaterThan(
    0
  );
});

test("shows empty state when no results match", () => {
  useArticlesQuery.mockReturnValue(mockQuery({ data: [] }));

  render(<ArticleArchive />);

  expect(screen.getByText(/no results match your filters/i)).toBeInTheDocument();
});
