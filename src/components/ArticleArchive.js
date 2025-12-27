import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArticleList from "./ArticleList";
import ArticleSkeleton from "./ArticleSkeleton";
import FeaturedShelf from "./FeaturedShelf";
import Pagination from "./Pagination";
import SideFilterPanel from "./SideFilterPanel";
import { useArticlesQuery } from "../hooks/useArticles";
import useOnlineStatus from "../hooks/useOnlineStatus";
import useUrlState from "../hooks/useUrlState";
import {
  filterAndSortArticles,
  getTopTags,
  getUniqueAuthors,
  getSortOptionsForSource,
  SORT_OPTIONS,
} from "../utils/articleUtils";
import {
  DATA_SOURCES,
  DATA_SOURCE_STORAGE_KEY,
  DEFAULT_SOURCE_ID,
  getDataSourceById,
} from "../utils/dataSources";

const PAGE_SIZE = 12;
const LIST_ID = "results-list";
const BASE_FILTERS = { q: "", author: "all", sort: "newest", page: 1 };
const ALLOWED_SOURCES = DATA_SOURCES.map((source) => source.id);
const ALLOWED_SORTS = SORT_OPTIONS.map((option) => option.value);

function formatUpdatedAt(timestamp) {
  if (!timestamp) return "Not updated yet";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Not updated yet";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ArticleArchive() {
  const defaultFilters = useMemo(() => {
    if (typeof window === "undefined") {
      return { ...BASE_FILTERS, source: DEFAULT_SOURCE_ID };
    }
    const stored = window.localStorage.getItem(DATA_SOURCE_STORAGE_KEY);
    const safeStored = ALLOWED_SOURCES.includes(stored)
      ? stored
      : DEFAULT_SOURCE_ID;
    return { ...BASE_FILTERS, source: safeStored };
  }, []);

  const [filters, setFilters] = useUrlState(defaultFilters, {
    allowedSorts: ALLOWED_SORTS,
    allowedSources: ALLOWED_SOURCES,
  });
  const { q, author, sort, page, source } = filters;
  const sortOptionsForSource = useMemo(
    () => getSortOptionsForSource(source),
    [source]
  );
  const normalizedQuery = q.trim().toLowerCase();
  const sortLabel = useMemo(() => {
    return (
      SORT_OPTIONS.find((option) => option.value === sort)?.label ||
      SORT_OPTIONS[0].label
    );
  }, [sort]);
  const activeFilters = useMemo(() => {
    const items = [];
    if (q) {
      items.push({ key: "q", label: `Search: "${q}"` });
    }
    if (author && author !== "all") {
      items.push({ key: "author", label: `Author: ${author}` });
    }
    if (sort && sort !== BASE_FILTERS.sort) {
      items.push({ key: "sort", label: `Sort: ${sortLabel}` });
    }
    return items;
  }, [author, q, sort, sortLabel]);
  const hasActiveFilters = activeFilters.length > 0;

  const activeSource =
    getDataSourceById(source) || getDataSourceById(DEFAULT_SOURCE_ID);
  const sourceLabel = activeSource?.label || "Unknown source";

  const {
    data: articles = [],
    isLoading,
    isError,
    isFetching,
    isStale,
    dataUpdatedAt,
    refetch,
  } = useArticlesQuery(activeSource?.url);

  const [searchValue, setSearchValue] = useState(q);
  const isOnline = useOnlineStatus();
  const resultsHeadingRef = useRef(null);
  const shouldFocusResultsRef = useRef(false);

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  useEffect(() => {
    const trimmed = searchValue.trim();
    const timer = setTimeout(() => {
      if (trimmed !== q) {
        setFilters({ q: trimmed, page: 1 }, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, searchValue, setFilters]);

  const authors = useMemo(() => getUniqueAuthors(articles), [articles]);
  const topTags = useMemo(
    () => getTopTags(articles, 8).filter((tag) => tag.toLowerCase() !== "ai"),
    [articles]
  );
  const matchedAuthor = useMemo(() => {
    if (!author || author === "all") return "all";
    const lowered = author.toLowerCase();
    return authors.find((name) => name.toLowerCase() === lowered) || "";
  }, [author, authors]);

  const filtered = useMemo(
    () => filterAndSortArticles(articles, { q, author, sort }),
    [articles, q, author, sort]
  );

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageStart = totalCount ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  const pagedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filtered]);

  useEffect(() => {
    if (page !== currentPage) {
      setFilters({ page: currentPage }, { replace: true });
    }
  }, [currentPage, page, setFilters]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DATA_SOURCE_STORAGE_KEY, source);
    }
  }, [source]);

  useEffect(() => {
    if (author === "all" || authors.length === 0) return;
    if (!matchedAuthor) {
      setFilters({ author: "all", page: 1 }, { replace: true });
      return;
    }
    if (matchedAuthor !== author) {
      setFilters({ author: matchedAuthor, page: 1 }, { replace: true });
    }
  }, [author, authors.length, matchedAuthor, setFilters]);

  useEffect(() => {
    if (sortOptionsForSource.length === 0) return;
    const allowedValues = sortOptionsForSource.map((option) => option.value);
    if (!allowedValues.includes(sort)) {
      setFilters(
        { sort: sortOptionsForSource[0].value, page: 1 },
        { replace: true }
      );
    }
  }, [setFilters, sort, sortOptionsForSource]);

  useEffect(() => {
    if (shouldFocusResultsRef.current && resultsHeadingRef.current) {
      resultsHeadingRef.current.focus();
      shouldFocusResultsRef.current = false;
    }
  }, [author, currentPage, q, sort, source, totalCount]);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const trimmed = searchValue.trim();
      shouldFocusResultsRef.current = true;
      if (trimmed !== q || page !== 1) {
        setFilters({ q: trimmed, page: 1 });
      }
    },
    [page, q, searchValue, setFilters]
  );

  const handleAuthorChange = useCallback(
    (event) => {
      shouldFocusResultsRef.current = true;
      setFilters({ author: event.target.value, page: 1 });
    },
    [setFilters]
  );

  const handleSortChange = useCallback(
    (event) => {
      shouldFocusResultsRef.current = true;
      setFilters({ sort: event.target.value, page: 1 });
    },
    [setFilters]
  );

  const handleSourceChange = useCallback(
    (event) => {
      shouldFocusResultsRef.current = true;
      setFilters({ source: event.target.value, page: 1 });
    },
    [setFilters]
  );

  const handleReset = useCallback(() => {
    shouldFocusResultsRef.current = true;
    setSearchValue("");
    setFilters({ ...BASE_FILTERS });
  }, [setFilters]);

  const handleTagSelect = useCallback(
    (tag) => {
      shouldFocusResultsRef.current = true;
      setSearchValue(tag);
      setFilters({ q: tag, page: 1 });
    },
    [setFilters]
  );

  const handlePageChange = useCallback(
    (nextPage) => {
      const clamped = Math.min(Math.max(nextPage, 1), totalPages);
      if (clamped === page) return;
      shouldFocusResultsRef.current = true;
      setFilters({ page: clamped });
    },
    [page, setFilters, totalPages]
  );

  const hasData = articles.length > 0;
  const showInitialLoading = isLoading && !hasData;
  const showErrorState = isError && !hasData;
  const updatedLabel = formatUpdatedAt(dataUpdatedAt);
  const featuredArticles = useMemo(() => filtered.slice(0, 3), [filtered]);
  const resultsLabel = q ? `Results for "${q}"` : "Catalog results";

  return (
    <section className="archive">
      <header className="catalog-topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <span className="brand-mark">CE</span>
            <div className="brand-copy">
              <p className="brand-title">Catalog Explorer</p>
              <p className="brand-subtitle">Content catalog</p>
            </div>
          </div>
          <form
            className="topbar-search"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            <label htmlFor="search-input" className="sr-only">
              Search
            </label>
            <input
              id="search-input"
              name="search"
              type="search"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Search titles, authors, tags"
              aria-describedby="search-help"
              aria-controls={LIST_ID}
            />
            <span id="search-help" className="sr-only">
              Type a keyword and press Apply to update results.
            </span>
            <button type="submit" className="topbar-search-button">
              Apply
            </button>
          </form>
          <div className="topbar-actions">
            <button type="button" className="topbar-action">
              Account
            </button>
          </div>
        </div>
      </header>

      <main className="page-content">
        <div className="catalog-shell">
          <SideFilterPanel
            source={source}
            sources={DATA_SOURCES}
            author={author}
            authors={authors}
            sort={sort}
            sortOptions={sortOptionsForSource}
            onSourceChange={handleSourceChange}
            onAuthorChange={handleAuthorChange}
            onSortChange={handleSortChange}
            onReset={handleReset}
            listId={LIST_ID}
          />
          <div className="catalog-main">
            {showErrorState ? (
              <div className="error-state" role="alert">
                <h2>Unable to load articles</h2>
                <p>Check your connection or try again.</p>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={refetch}
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {topTags.length > 0 && (
                  <div className="category-row" aria-label="Popular categories">
                    <span className="category-label">Categories</span>
                    <div
                      className="category-pills"
                      aria-label="Category filters"
                    >
                      {topTags.map((tag) => {
                        const isActive = normalizedQuery === tag.toLowerCase();
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`tag-pill tag-pill--compact${
                              isActive ? " is-active" : ""
                            }`}
                            onClick={() => handleTagSelect(tag)}
                            aria-pressed={isActive}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="filter-summary" role="status" aria-live="polite">
                  <span className="filter-summary__label">Filter summary</span>
                  <div className="filter-summary__chips">
                    {hasActiveFilters ? (
                      activeFilters.map((item) => (
                        <span key={item.key} className="filter-chip">
                          {item.label}
                        </span>
                      ))
                    ) : (
                      <span className="filter-summary__empty">
                        No filters applied
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="filter-summary__clear"
                    onClick={handleReset}
                    disabled={!hasActiveFilters}
                  >
                    Clear all
                  </button>
                </div>
                {!showInitialLoading && featuredArticles.length > 0 && (
                  <FeaturedShelf articles={featuredArticles} />
                )}
                <div className="status-bar">
                  <div className="status-left">
                    <h2
                      id="results-heading"
                      className="results-heading"
                      tabIndex="-1"
                      ref={resultsHeadingRef}
                    >
                      {resultsLabel}
                    </h2>
                    <p id="results-count" className="results-count" role="status">
                      {showInitialLoading
                        ? "Loading articles..."
                        : totalCount === 0
                        ? "No matches found"
                        : `Showing ${pageStart}-${pageEnd} of ${totalCount}`}
                    </p>
                  </div>
                  <div className="status-right">
                    <span className="status-updated">
                      Updated: {updatedLabel}
                    </span>
                    <div className="status-tags" aria-live="polite">
                      {!isOnline && (
                        <span className="status-pill status-pill--offline">
                          Offline
                        </span>
                      )}
                      {isFetching && (
                        <span className="status-pill status-pill--fetching">
                          Refreshing
                        </span>
                      )}
                      {!isFetching && isStale && (
                        <span className="status-pill status-pill--stale">
                          Stale
                        </span>
                      )}
                      {isError && (
                        <span className="status-pill status-pill--error">
                          Last refresh failed
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        shouldFocusResultsRef.current = true;
                        refetch();
                      }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {showInitialLoading ? (
                  <ArticleSkeleton count={PAGE_SIZE} />
                ) : totalCount === 0 ? (
                  <div className="empty-state" role="status">
                    <p>No results match your filters.</p>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={handleReset}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <>
                    <ArticleList
                      articles={pagedArticles}
                      listId={LIST_ID}
                      isBusy={isFetching}
                    />
                    <Pagination
                      page={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <footer className="catalog-footer">
          <span>Source: {sourceLabel}</span>
          <span>Last updated: {updatedLabel}</span>
          <span>Built by Sunday Oyebiyi</span>
        </footer>
      </main>
    </section>
  );
}
