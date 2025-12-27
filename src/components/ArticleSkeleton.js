import React from "react";

export default function ArticleSkeleton({ count = 6 }) {
  return (
    <ul className="article-list" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <li key={`skeleton-${index}`} className="article-list-item">
          <div className="article-card skeleton-card">
            <div className="skeleton-thumb" />
            <div className="skeleton-body">
              <div className="skeleton-line skeleton-line--tag" />
              <div className="skeleton-line skeleton-line--title" />
              <div className="skeleton-line skeleton-line--title-short" />
              <div className="skeleton-author">
                <div className="skeleton-avatar" />
                <div className="skeleton-line skeleton-line--name" />
              </div>
              <div className="skeleton-line skeleton-line--meta" />
              <div className="skeleton-tags">
                <div className="skeleton-chip" />
                <div className="skeleton-chip" />
              </div>
              <div className="skeleton-button" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
