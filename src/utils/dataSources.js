export const DEVTO_URL = "https://dev.to/api/articles?per_page=30";
const ENV_URL = process.env.REACT_APP_ARTICLES_URL;
const CONFIGURED_SOURCE_ID = "configured";

const hasConfiguredSource = Boolean(ENV_URL) && ENV_URL !== DEVTO_URL;

const baseSources = [
  {
    id: "devto",
    label: "Dev.to (public)",
    url: DEVTO_URL,
  },
];

export const DATA_SOURCES = hasConfiguredSource
  ? [
      {
        id: CONFIGURED_SOURCE_ID,
        label: "Configured API",
        url: ENV_URL,
      },
      ...baseSources,
    ]
  : baseSources;

const envBaseSource = baseSources.find((source) => source.url === ENV_URL);

export const DEFAULT_SOURCE_ID = hasConfiguredSource
  ? CONFIGURED_SOURCE_ID
  : envBaseSource?.id || "devto";
export const DATA_SOURCE_STORAGE_KEY = "catalogDataSource";

export function getDataSourceById(id) {
  return DATA_SOURCES.find((source) => source.id === id) || null;
}
