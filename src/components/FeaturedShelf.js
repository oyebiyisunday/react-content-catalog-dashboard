import React from "react";
import {
  FALLBACK_THUMB,
  getArticleUrl,
  getAuthorName,
  getThumbnailUrl,
} from "../utils/articleUtils";

export default function FeaturedShelf({ articles }) {
  if (!articles.length) return null;

  return (
    <section className="featured">
      <div className="featured-header">
        <h3>Featured picks</h3>
        <p>Curated highlights from the catalog.</p>
      </div>
      <div className="featured-grid">
        {articles.map((article) => {
          const articleUrl = getArticleUrl(article);
          const thumbnail = getThumbnailUrl(article) || FALLBACK_THUMB;
          const authorName = getAuthorName(article);
          return (
            <article key={article.id ?? articleUrl} className="featured-card">
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="featured-thumb-link"
              >
                <img
                  src={thumbnail}
                  alt={
                    article.title ? `Thumbnail: ${article.title}` : "Article"
                  }
                  className="featured-thumb"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_THUMB;
                  }}
                />
              </a>
              <div className="featured-body">
                <p className="featured-author">By {authorName}</p>
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="featured-title-link"
                >
                  <h4 className="featured-title">
                    {article.title ?? "Untitled"}
                  </h4>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
