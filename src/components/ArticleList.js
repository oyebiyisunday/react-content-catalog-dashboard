import React from "react";
import ArticleItem from "./ArticleItem";

export default function ArticleList({ articles, listId, isBusy }) {
  return (
    <ul id={listId} className="article-list" aria-busy={isBusy}>
      {articles.map((article, index) => (
        <li
          key={`${article.id ?? article.url ?? article.title ?? "article"}-${index}`}
          className="article-list-item"
        >
          <ArticleItem article={article} />
        </li>
      ))}
    </ul>
  );
}
