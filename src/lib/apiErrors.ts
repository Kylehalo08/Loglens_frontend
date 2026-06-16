export const DEMO_LIMITS_COPY =
  "Free demo: up to 5,000 logs per day per organization (~500/hour), 6-hour log retention, fair-use API rate limits.";

/** Map HTTP status + server error to user-facing copy. */
export function apiErrorMessage(status: number, serverError?: string): string {
  const err = serverError?.trim();

  if (status === 429) {
    if (err?.toLowerCase().includes("log ingest")) {
      return "Daily log limit reached for this organization. Try again tomorrow or contact support.";
    }
    return "Too many requests. Please wait a minute and try again.";
  }
  if (status === 401) return err || "Session expired. Please sign in again.";
  if (status === 403) return err || "You don't have permission to do that.";
  if (status === 404) return err || "Not found.";
  if (status === 409) return err || "Conflict — check your input and try again.";
  if (status === 503) return err || "Service temporarily unavailable. Please try again later.";

  return err || `Request failed (${status})`;
}

export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error) return err.message;
  return fallback;
}
