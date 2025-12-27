import {
  filterAndSortArticles,
  getSortOptionsForSource,
  normalizeArticles,
} from "../utils/articleUtils";

test("normalizes Dev.to articles into the internal shape", () => {
  const devToData = [
    {
      id: 42,
      title: "A dev.to post",
      url: "https://dev.to/example/post",
      comments_count: 7,
      tag_list: ["react", "testing"],
      created_at: "2024-05-01T10:00:00Z",
      cover_image: "https://images.dev/cover.png",
      user: {
        name: "Dev Author",
        profile_image: "https://images.dev/avatar.png",
      },
    },
  ];

  const result = normalizeArticles(devToData);

  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({
    id: 42,
    title: "A dev.to post",
    url: "https://dev.to/example/post",
    comment_count: 7,
    tags: ["react", "testing"],
    author: { name: "Dev Author", avatar: "https://images.dev/avatar.png" },
    date: "2024-05-01T10:00:00Z",
    thumbnail: {
      location: "",
      images: {
        small: "https://images.dev/cover.png",
      },
    },
  });
});

test("normalizes typed items with per-type adapters", () => {
  const devToItem = {
    id: 88,
    title: "Typed dev.to post",
    url: "https://dev.to/example/typed",
    comments_count: 4,
    tag_list: ["react"],
    created_at: "2024-06-01T10:00:00Z",
    cover_image: "https://images.dev/typed-cover.png",
    user: {
      name: "Typed Author",
      profile_image: "https://images.dev/typed-avatar.png",
    },
  };

  const typedPayload = [
    { type: "devto", data: devToItem },
    {
      type: "article",
      data: {
        id: 99,
        title: "Internal article",
        url: "https://example.com/internal",
        comment_count: 1,
        author: { name: "Internal Author" },
      },
    },
  ];

  const result = normalizeArticles(typedPayload);

  expect(result).toHaveLength(2);
  expect(result[0]).toMatchObject({
    title: "Typed dev.to post",
    source_type: "devto",
  });
  expect(result[1]).toMatchObject({
    title: "Internal article",
    source_type: "article",
  });
});

test("sorts by title A-Z and author A-Z", () => {
  const articles = [
    {
      id: 1,
      title: "Zeta",
      author: { name: "Bob" },
      comment_count: 1,
      date: "2024-01-02T10:00:00Z",
    },
    {
      id: 2,
      title: "alpha",
      author: { name: "alice" },
      comment_count: 5,
      date: "2024-01-01T10:00:00Z",
    },
    {
      id: 3,
      title: "Beta",
      author: { name: "Charlie" },
      comment_count: 5,
      date: "2024-01-03T10:00:00Z",
    },
  ];

  const byTitle = filterAndSortArticles(articles, {
    q: "",
    author: "all",
    sort: "title",
  });
  expect(byTitle.map((item) => item.id)).toEqual([2, 3, 1]);

  const byAuthor = filterAndSortArticles(articles, {
    q: "",
    author: "all",
    sort: "author",
  });
  expect(byAuthor.map((item) => item.id)).toEqual([2, 1, 3]);
});

test("sorts by popularity with newest tie-breaker", () => {
  const articles = [
    {
      id: 10,
      title: "Low comments",
      author: { name: "A" },
      comment_count: 1,
      date: "2024-01-02T10:00:00Z",
    },
    {
      id: 11,
      title: "High comments older",
      author: { name: "B" },
      comment_count: 5,
      date: "2024-01-01T10:00:00Z",
    },
    {
      id: 12,
      title: "High comments newer",
      author: { name: "C" },
      comment_count: 5,
      date: "2024-01-03T10:00:00Z",
    },
  ];

  const sorted = filterAndSortArticles(articles, {
    q: "",
    author: "all",
    sort: "popular",
  });
  expect(sorted.map((item) => item.id)).toEqual([12, 11, 10]);
});

test("returns per-source sort options", () => {
  const devtoSorts = getSortOptionsForSource("devto").map(
    (option) => option.value
  );
  expect(devtoSorts).toEqual(["newest", "popular", "oldest", "title"]);

  const configuredSorts = getSortOptionsForSource("configured").map(
    (option) => option.value
  );
  expect(configuredSorts).toEqual(["newest", "oldest", "title", "author"]);
});
