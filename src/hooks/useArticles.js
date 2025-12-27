import { useQuery } from "@tanstack/react-query";
import { normalizeArticles } from "../utils/articleUtils";
import { validateArticles } from "../utils/schemaValidator";
import { reportFetchError } from "../utils/telemetry";

export const DATA_URL =
  process.env.REACT_APP_ARTICLES_URL ||
  "https://dev.to/api/articles?per_page=30";

async function fetchArticles(dataUrl) {
  try {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const normalized = normalizeArticles(data);
    const { validArticles } = validateArticles(normalized, {
      source: dataUrl,
    });
    return validArticles;
  } catch (error) {
    reportFetchError({
      source: dataUrl,
      message: error?.message || "Unknown fetch error",
    });
    throw error;
  }
}

export function useArticlesQuery(dataUrl = DATA_URL) {
  return useQuery({
    queryKey: ["articles", dataUrl],
    queryFn: () => fetchArticles(dataUrl),
    staleTime: 1000 * 60,
    cacheTime: 1000 * 60 * 5,
    retry: 2,
    refetchOnWindowFocus: true,
  });
}
