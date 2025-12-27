import { useCallback, useEffect, useMemo, useState } from "react";

function parseSearchParams(
  search,
  defaults,
  allowedSorts,
  allowedSources,
  allowedRanges,
  allowedMinComments
) {
  const params = new URLSearchParams(search);
  const rawQuery = params.get("q");
  const rawAuthor = params.get("author");
  const rawSort = params.get("sort");
  const rawSource = params.get("source");
  const rawPage = params.get("page");
  const rawRange = params.get("range");
  const rawMinComments = params.get("minComments");
  const rawTags = params.get("tags");

  const pageValue = Number.parseInt(rawPage, 10);
  const safePage = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : defaults.page;

  let safeRange = rawRange ?? defaults.range;
  if (safeRange !== "all") {
    const days = Number.parseInt(safeRange, 10);
    if (!Number.isFinite(days) || days <= 0) {
      safeRange = defaults.range;
    } else {
      safeRange = String(days);
    }
  }

  const minValue = Number.parseInt(rawMinComments, 10);
  let safeMinComments = Number.isFinite(minValue)
    ? minValue
    : defaults.minComments;
  if (!Number.isFinite(safeMinComments) || safeMinComments < 0) {
    safeMinComments = defaults.minComments;
  }

  if (
    Array.isArray(allowedRanges) &&
    allowedRanges.length > 0 &&
    !allowedRanges.includes(safeRange)
  ) {
    safeRange = defaults.range;
  }

  if (
    Array.isArray(allowedMinComments) &&
    allowedMinComments.length > 0 &&
    !allowedMinComments.includes(safeMinComments)
  ) {
    safeMinComments = defaults.minComments;
  }

  const safeTags = rawTags
    ? rawTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : Array.isArray(defaults.tags)
    ? [...defaults.tags]
    : [];

  let safeSort = rawSort || defaults.sort;
  if (allowedSorts.length > 0 && !allowedSorts.includes(safeSort)) {
    safeSort = defaults.sort;
  }

  let safeSource = rawSource || defaults.source;
  if (allowedSources.length > 0 && !allowedSources.includes(safeSource)) {
    safeSource = defaults.source;
  }

  return {
    q: rawQuery ?? defaults.q,
    author: rawAuthor ?? defaults.author,
    sort: safeSort,
    source: safeSource,
    page: safePage,
    range: safeRange,
    minComments: safeMinComments,
    tags: Array.isArray(safeTags) ? safeTags : [],
  };
}

function buildSearchParams(state, defaults) {
  const params = new URLSearchParams();
  if (state.q && state.q !== defaults.q) params.set("q", state.q);
  if (state.author && state.author !== defaults.author) {
    params.set("author", state.author);
  }
  if (state.sort && state.sort !== defaults.sort) params.set("sort", state.sort);
  if (state.source && state.source !== defaults.source) {
    params.set("source", state.source);
  }
  if (state.page && state.page !== defaults.page) {
    params.set("page", String(state.page));
  }
  if (state.range && state.range !== defaults.range) {
    params.set("range", state.range);
  }
  if (
    Number.isFinite(state.minComments) &&
    state.minComments !== defaults.minComments
  ) {
    params.set("minComments", String(state.minComments));
  }
  if (Array.isArray(state.tags) && state.tags.length > 0) {
    params.set("tags", state.tags.join(","));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export default function useUrlState(defaults, options = {}) {
  const allowedSorts = useMemo(
    () => options.allowedSorts ?? [],
    [options.allowedSorts]
  );
  const allowedSources = useMemo(
    () => options.allowedSources ?? [],
    [options.allowedSources]
  );
  const allowedRanges = useMemo(
    () => options.allowedRanges ?? [],
    [options.allowedRanges]
  );
  const allowedMinComments = useMemo(
    () => options.allowedMinComments ?? [],
    [options.allowedMinComments]
  );

  const readState = useCallback(() => {
    return parseSearchParams(
      window.location.search,
      defaults,
      allowedSorts,
      allowedSources,
      allowedRanges,
      allowedMinComments
    );
  }, [allowedSorts, allowedSources, allowedRanges, allowedMinComments, defaults]);

  const [state, setState] = useState(() => readState());

  useEffect(() => {
    const onPopState = () => {
      setState(readState());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [readState]);

  const updateState = useCallback(
    (updates, { replace = false } = {}) => {
      setState((prev) => {
        const next = { ...prev, ...updates };
        const search = buildSearchParams(next, defaults);
        const nextUrl = `${window.location.pathname}${search}`;
        if (replace) {
          window.history.replaceState(null, "", nextUrl);
        } else {
          window.history.pushState(null, "", nextUrl);
        }
        return next;
      });
    },
    [defaults]
  );

  return [state, updateState];
}
