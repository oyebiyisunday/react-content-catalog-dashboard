import React from "react";

function buildPageItems(currentPage, totalPages) {
  const pages = [];
  const visible = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  let lastWasEllipsis = false;
  for (let page = 1; page <= totalPages; page += 1) {
    if (visible.has(page)) {
      pages.push(page);
      lastWasEllipsis = false;
      continue;
    }
    if (!lastWasEllipsis) {
      pages.push("ellipsis");
      lastWasEllipsis = true;
    }
  }
  return pages;
}

export default function Pagination({ page, totalPages, onPageChange }) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);
  const pageItems = buildPageItems(safePage, safeTotalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="button button-secondary"
        onClick={() => onPageChange(safePage - 1)}
        disabled={safePage <= 1}
        aria-disabled={safePage <= 1}
      >
        Previous
      </button>

      <div className="pagination-pages" aria-live="polite">
        {pageItems.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            );
          }
          const pageNumber = item;
          const isCurrent = pageNumber === safePage;
          return (
            <button
              key={`page-${pageNumber}`}
              type="button"
              className={`pagination-page${isCurrent ? " is-current" : ""}`}
              onClick={() => onPageChange(pageNumber)}
              aria-current={isCurrent ? "page" : undefined}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="button button-secondary"
        onClick={() => onPageChange(safePage + 1)}
        disabled={safePage >= safeTotalPages}
        aria-disabled={safePage >= safeTotalPages}
      >
        Next
      </button>
    </nav>
  );
}
