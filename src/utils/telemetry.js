export function reportEvent(name, payload) {
  if (
    typeof window !== "undefined" &&
    window.__APP_MONITOR__ &&
    typeof window.__APP_MONITOR__.reportEvent === "function"
  ) {
    window.__APP_MONITOR__.reportEvent(name, payload);
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[telemetry] ${name}`, payload);
  }
}

export function reportSchemaMismatch(payload) {
  reportEvent("schema_mismatch", payload);
}

export function reportFetchError(payload) {
  reportEvent("fetch_error", payload);
}
