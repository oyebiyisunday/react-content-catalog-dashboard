import React from "react";
import {
  FALLBACK_AVATAR,
  FALLBACK_THUMB,
  formatDate,
  getArticleDate,
  getArticleUrl,
  getAuthorAvatar,
  getAuthorName,
  getCommentCount,
  getThumbnailUrl,
} from "../utils/articleUtils";

const ArticleItem = React.memo(function ArticleItem({ article }) {
  const articleUrl = getArticleUrl(article);
  const builtThumb = getThumbnailUrl(article);
  const safeThumbnailUrl = builtThumb || FALLBACK_THUMB;

  const authorName = getAuthorName(article);
  const authorAvatar = getAuthorAvatar(article);
  const commentCount = getCommentCount(article);
  const articleDate = getArticleDate(article);
  const formattedDate = formatDate(articleDate);

  const titleId = article?.id ? `article-title-${article.id}` : undefined;
  const cardLabel = `Open article: ${article.title ?? "Untitled"}`;
  const tags = Array.isArray(article?.tags) ? article.tags : [];
  const primaryTag = tags[0] || "Featured";
  const extraTags = tags.slice(1, 4);
  const badgeLabel = article?.source_type === "devto" ? "Dev.to" : "Article";

  const openArticle = () => {
    window.open(articleUrl, "_blank", "noopener,noreferrer");
  };

  const handleCardClick = (event) => {
    if (event.defaultPrevented) return;
    if (event.target instanceof Element) {
      const interactive = event.target.closest("a, button");
      if (interactive) return;
    }
    openArticle();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openArticle();
    }
  };

  return (
    <article
      className="article-card"
      aria-labelledby={titleId}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleCardClick}
    >
      <div className="article-thumb-wrap">
        <a
          href={articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={cardLabel}
          className="article-thumb-link"
        >
          <img
            src={safeThumbnailUrl}
            alt={
              article.title ? `Thumbnail: ${article.title}` : "Article thumbnail"
            }
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_THUMB;
            }}
            className="article-thumb"
          />
        </a>
        <span className="article-badge">{badgeLabel}</span>
      </div>

      <div className="article-body">
        <div className="article-eyebrow">
          <span className="article-tag">{primaryTag}</span>
          <span className="article-date">
            <time dateTime={articleDate}>{formattedDate}</time>
          </span>
        </div>
        <a
          href={articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="article-title-link"
        >
          <h3 id={titleId} className="article-title">
            {article.title ?? "Untitled"}
          </h3>
        </a>

        <div className="article-author">
          <img
            src={authorAvatar}
            alt={authorName}
            className="article-author-avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_AVATAR;
            }}
          />
          <span>By {authorName}</span>
        </div>

        <div className="article-metrics">
          <span className="article-metric">
            Comments <strong>{commentCount}</strong>
          </span>
        </div>

        {extraTags.length > 0 && (
          <div className="article-tags">
            {extraTags.map((tag) => (
              <span key={tag} className="article-chip">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="article-actions">
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-primary button-compact"
          >
            View article
          </a>
        </div>
      </div>
    </article>
  );
});

export default ArticleItem;
