import { reportEvent } from "./telemetry";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most comments" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title A-Z" },
  { value: "author", label: "Author A-Z" },
];

export const SOURCE_SORTS = {
  devto: ["newest", "popular", "oldest", "title"],
  configured: ["newest", "oldest", "title", "author"],
};

export function getSortOptionsForSource(sourceId) {
  const allowed = SOURCE_SORTS[sourceId];
  if (!allowed) return SORT_OPTIONS;
  return SORT_OPTIONS.filter((option) => allowed.includes(option.value));
}

export const FALLBACK_THUMB = "/assets/thumb-placeholder.svg";
export const FALLBACK_AVATAR = "/assets/avatar-placeholder.svg";
const CLEAN_THUMB_SIZE = "800/520";
const CLEAN_THUMB_BASE = "https://picsum.photos/seed";

function normalizeArticle(data) {
  if (!data || typeof data !== "object") return null;
  return data;
}

function joinImageUrl(location, path) {
  if (!path) return null;
  if (!location) return path;
  if (location.endsWith("/") && path.startsWith("/")) {
    return `${location}${path.slice(1)}`;
  }
  if (!location.endsWith("/") && !path.startsWith("/")) {
    return `${location}/${path}`;
  }
  return `${location}${path}`;
}

function getArrayFromData(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.articles)) return data.articles;
  if (Array.isArray(data?.hits)) return data.hits;
  return [];
}

function isDevToArticle(article) {
  return Boolean(
    article &&
      (article.user ||
        article.tag_list ||
        article.comments_count !== undefined ||
        article.cover_image ||
        article.social_image)
  );
}

function normalizeDevToTags(article) {
  if (Array.isArray(article?.tag_list)) return article.tag_list;
  if (typeof article?.tag_list === "string") {
    return article.tag_list
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (Array.isArray(article?.tags)) return article.tags;
  return [];
}

function normalizeDevToArticle(article) {
  const coverImage = article.cover_image || article.social_image || "";
  return {
    id: article.id,
    title: article.title,
    url: article.url,
    comment_count: Number(
      article.comments_count ??
        article.public_reactions_count ??
        article.positive_reactions_count ??
        0
    ),
    tags: normalizeDevToTags(article),
    author: {
      name: article.user?.name || article.user?.username || "Unknown author",
      avatar: article.user?.profile_image_90 || article.user?.profile_image,
    },
    thumbnail: coverImage
      ? {
          location: "",
          images: {
            small: coverImage,
          },
        }
      : null,
    date: article.published_at || article.created_at || article.edited_at || "",
    source_type: "devto",
  };
}

const TYPE_ADAPTERS = {
  article: normalizeArticle,
  devto: normalizeDevToArticle,
};

function normalizeTypedItem(item) {
  if (!item || typeof item !== "object") return null;
  const rawType = typeof item.type === "string" ? item.type : "";
  const type = rawType.trim().toLowerCase();
  if (!type || !Object.prototype.hasOwnProperty.call(item, "data")) {
    reportEvent("invalid_typed_item", { sampleType: rawType });
    return null;
  }
  const adapter = TYPE_ADAPTERS[type];
  if (!adapter) {
    reportEvent("unknown_article_type", { type });
    return null;
  }
  const normalized = adapter(item.data);
  if (!normalized) {
    reportEvent("invalid_typed_item", { type });
    return null;
  }
  return normalized.source_type ? normalized : { ...normalized, source_type: type };
}

export function normalizeArticles(data) {
  const items = getArrayFromData(data);
  return items
    .map((item) => {
      if (item && typeof item === "object" && "type" in item && "data" in item) {
        return normalizeTypedItem(item);
      }
      if (isDevToArticle(item)) return normalizeDevToArticle(item);
      return normalizeArticle(item);
    })
    .filter(Boolean);
}

export function getArticleUrl(article) {
  return (
    article?.url ||
    article?.link ||
    article?.permalink ||
    article?.urls?.canonical ||
    "#"
  );
}

export function getThumbnailUrl(article) {
  if (article?.source_type === "devto") {
    return buildCleanThumbnail(article);
  }
  if (article?.image?.thumbnail?.small) {
    return joinImageUrl(
      article.image?.location || "",
      article.image.thumbnail.small
    );
  }
  if (article?.thumbnail?.images?.small) {
    return joinImageUrl(
      article.thumbnail?.location || "",
      article.thumbnail.images.small
    );
  }
  return null;
}

function buildCleanThumbnail(article) {
  const seed = slugifySeed(article?.title || article?.id || "article");
  return `${CLEAN_THUMB_BASE}/barstool-${seed}/${CLEAN_THUMB_SIZE}`;
}

function slugifySeed(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "article";
}

export function getAuthorName(article) {
  return article?.author?.name || "Unknown author";
}

export function getAuthorAvatar(article) {
  return article?.author?.avatar || FALLBACK_AVATAR;
}

export function getCommentCount(article) {
  return Number(article?.comment_count ?? 0);
}

export function getArticleDate(article) {
  return article?.date || article?.updated_at || "";
}

export function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function getUniqueAuthors(articles) {
  const authorSet = new Set();
  articles.forEach((article) => {
    if (article?.author?.name) {
      authorSet.add(article.author.name);
    }
  });
  return Array.from(authorSet).sort((a, b) => a.localeCompare(b));
}

export function getTopTags(articles, limit = 8) {
  const counts = new Map();
  articles.forEach((article) => {
    const tags = Array.isArray(article?.tags) ? article.tags : [];
    tags.forEach((tag) => {
      if (!tag) return;
      const key = String(tag);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit)
    .map(([tag]) => tag);
}

function matchesQuery(article, query) {
  if (!query) return true;
  const lowered = query.toLowerCase();
  const title = article?.title || "";
  const author = article?.author?.name || "";
  const tags = Array.isArray(article?.tags) ? article.tags : [];
  return (
    title.toLowerCase().includes(lowered) ||
    author.toLowerCase().includes(lowered) ||
    tags.some((tag) => String(tag).toLowerCase().includes(lowered))
  );
}

function matchesTags(article, tags) {
  if (!Array.isArray(tags) || tags.length === 0) return true;
  const loweredTags = tags.map((tag) => String(tag).toLowerCase());
  const articleTags = Array.isArray(article?.tags) ? article.tags : [];
  return articleTags.some((tag) =>
    loweredTags.includes(String(tag).toLowerCase())
  );
}

function matchesMinComments(article, minComments) {
  if (!Number.isFinite(minComments) || minComments <= 0) return true;
  return getCommentCount(article) >= minComments;
}

function matchesDateRange(article, range) {
  if (!range || range === "all") return true;
  const days = Number.parseInt(range, 10);
  if (!Number.isFinite(days) || days <= 0) return true;
  const dateValue = new Date(getArticleDate(article));
  if (Number.isNaN(dateValue.getTime())) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return dateValue.getTime() >= cutoff;
}

function matchesAuthor(article, author) {
  if (!author || author === "all") return true;
  return (article?.author?.name || "").toLowerCase() === author.toLowerCase();
}

export function filterAndSortArticles(
  articles,
  { q, author, sort, tags, minComments, range }
) {
  const filtered = articles.filter((article) => {
    if (!article) return false;
    return (
      matchesQuery(article, q) &&
      matchesAuthor(article, author) &&
      matchesTags(article, tags) &&
      matchesMinComments(article, minComments) &&
      matchesDateRange(article, range)
    );
  });

  const compare = (a, b) => {
    if (sort === "title") {
      const titleA = String(a?.title || "").toLowerCase();
      const titleB = String(b?.title || "").toLowerCase();
      return titleA.localeCompare(titleB);
    }
    if (sort === "author") {
      const authorA = String(a?.author?.name || "").toLowerCase();
      const authorB = String(b?.author?.name || "").toLowerCase();
      return authorA.localeCompare(authorB);
    }
    const dateA = new Date(getArticleDate(a)).getTime() || 0;
    const dateB = new Date(getArticleDate(b)).getTime() || 0;
    if (sort === "popular") {
      const delta = getCommentCount(b) - getCommentCount(a);
      return delta !== 0 ? delta : dateB - dateA;
    }
    if (sort === "oldest") {
      return dateA - dateB;
    }
    return dateB - dateA;
  };

  return filtered.slice().sort(compare);
}
