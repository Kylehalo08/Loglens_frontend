import { apiRequest } from "./client";
import type { LogEntry, LogSearchParams, SearchResult } from "@/types/api";

function buildSearchQuery(params: LogSearchParams): string {
  const q = new URLSearchParams();
  if (params.service_id) q.set("service_id", params.service_id);
  if (params.severity) q.set("severity", params.severity);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.q) q.set("q", params.q);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export function searchLogs(orgId: string, params: LogSearchParams = {}) {
  return apiRequest<SearchResult>(
    `/orgs/${orgId}/logs/search${buildSearchQuery(params)}`,
  );
}

export function getLog(orgId: string, logId: string) {
  return apiRequest<LogEntry>(`/orgs/${orgId}/logs/${logId}`);
}

export function getServiceLog(orgId: string, serviceId: string, logId: string) {
  return apiRequest<LogEntry>(
    `/orgs/${orgId}/services/${serviceId}/logs/${logId}`,
  );
}
