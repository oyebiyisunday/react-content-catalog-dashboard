import { validateArticles } from "../utils/schemaValidator";
import { reportSchemaMismatch } from "../utils/telemetry";

jest.mock("../utils/telemetry", () => ({
  reportSchemaMismatch: jest.fn(),
}));

const validArticle = {
  id: 1,
  title: "Valid article",
  url: "https://example.com/valid",
  comment_count: 3,
  author: { name: "Author" },
  tags: ["tag"],
  date: "2024-01-01T00:00:00Z",
};

test("returns all articles when schema is valid", () => {
  const result = validateArticles([validArticle], { source: "test" });

  expect(result.validArticles).toHaveLength(1);
  expect(result.errors).toHaveLength(0);
  expect(reportSchemaMismatch).not.toHaveBeenCalled();
});

test("filters invalid articles and reports schema mismatch", () => {
  const invalidArticle = { id: 2, url: "https://example.com/bad" };

  const result = validateArticles([validArticle, invalidArticle], {
    source: "test",
  });

  expect(result.validArticles).toHaveLength(1);
  expect(result.errors).toHaveLength(1);
  expect(reportSchemaMismatch).toHaveBeenCalledTimes(1);
});
