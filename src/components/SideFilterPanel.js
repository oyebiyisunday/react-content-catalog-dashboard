import React from "react";

export default function SideFilterPanel({
  id,
  source,
  sources,
  author,
  authors,
  sort,
  sortOptions,
  onSourceChange,
  onAuthorChange,
  onSortChange,
  onReset,
  range = "all",
  onRangeChange,
  minComments = 0,
  onMinCommentsChange,
  tags = [],
  tagOptions = [],
  onTagToggle,
  rangeOptions = [],
  minCommentOptions = [],
  listId,
  isOpen = true,
}) {
  return (
    <aside
      id={id}
      className="side-panel"
      aria-label="Filters"
      hidden={!isOpen}
    >
      <div className="side-panel__header">
        <h3 className="side-panel__title">Filters</h3>
        <button type="button" className="side-panel__reset" onClick={onReset}>
          Reset
        </button>
      </div>

      <div className="side-panel__groups">
        <details className="side-panel__group" open>
          <summary id="filter-sort">Sort</summary>
          <div className="side-panel__content" role="group" aria-labelledby="filter-sort">
            <label htmlFor="sidebar-sort-select" className="sr-only">
              Sort
            </label>
            <select
              id="sidebar-sort-select"
              value={sort}
              onChange={onSortChange}
              aria-controls={listId}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </details>

        <details className="side-panel__group" open>
          <summary id="filter-range">Date range</summary>
          <div
            className="side-panel__content"
            role="group"
            aria-labelledby="filter-range"
          >
            <label htmlFor="sidebar-range-select" className="sr-only">
              Date range
            </label>
            <select
              id="sidebar-range-select"
              value={range}
              onChange={onRangeChange}
              aria-controls={listId}
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </details>

        <details className="side-panel__group" open>
          <summary id="filter-author">Author</summary>
          <div
            className="side-panel__content"
            role="group"
            aria-labelledby="filter-author"
          >
            <label htmlFor="sidebar-author-select" className="sr-only">
              Author
            </label>
            <select
              id="sidebar-author-select"
              value={author}
              onChange={onAuthorChange}
              aria-controls={listId}
            >
              <option value="all">All authors</option>
              {authors.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </details>

        <details className="side-panel__group" open>
          <summary id="filter-comments">Popularity</summary>
          <div
            className="side-panel__content"
            role="group"
            aria-labelledby="filter-comments"
          >
            <label htmlFor="sidebar-comments-select" className="sr-only">
              Minimum comments
            </label>
            <select
              id="sidebar-comments-select"
              value={minComments}
              onChange={onMinCommentsChange}
              aria-controls={listId}
            >
              {minCommentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </details>

        <details className="side-panel__group" open>
          <summary id="filter-source">Data source</summary>
          <div
            className="side-panel__content"
            role="group"
            aria-labelledby="filter-source"
          >
            <label htmlFor="sidebar-source-select" className="sr-only">
              Data source
            </label>
            <select
              id="sidebar-source-select"
              value={source}
              onChange={onSourceChange}
              aria-controls={listId}
            >
              {sources.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </details>

        <details className="side-panel__group" open>
          <summary id="filter-tags">Tags</summary>
          <div
            className="side-panel__content side-panel__taglist"
            role="group"
            aria-labelledby="filter-tags"
          >
            {tagOptions.length === 0 ? (
              <span className="side-panel__empty">No tags yet</span>
            ) : (
              tagOptions.map((tag) => {
                const lowered = String(tag).toLowerCase();
                const isChecked = tags.some(
                  (item) => String(item).toLowerCase() === lowered
                );
                return (
                  <label key={tag} className="side-panel__check">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onTagToggle?.(tag)}
                      aria-controls={listId}
                    />
                    <span>{tag}</span>
                  </label>
                );
              })
            )}
          </div>
        </details>
      </div>
    </aside>
  );
}
