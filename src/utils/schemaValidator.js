import Ajv from "ajv";
import articlesSchema from "../schemas/articles.schema.json";
import { reportSchemaMismatch } from "./telemetry";

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
const articleSchema = articlesSchema?.$defs?.article;
const validateArticle = articleSchema ? ajv.compile(articleSchema) : null;

export function validateArticles(articles, context = {}) {
  if (!validateArticle) {
    return { validArticles: articles, errors: [] };
  }

  const validArticles = [];
  const errors = [];

  articles.forEach((article, index) => {
    const isValid = validateArticle(article);
    if (isValid) {
      validArticles.push(article);
    } else {
      errors.push({
        index,
        errors: validateArticle.errors ? [...validateArticle.errors] : [],
      });
    }
  });

  if (errors.length > 0) {
    reportSchemaMismatch({
      source: context.source,
      errorsCount: errors.length,
      sampleErrors: errors.slice(0, 3),
    });
  }

  return { validArticles, errors };
}
