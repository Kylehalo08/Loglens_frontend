import { apiRequest, ApiClientError } from "./client";
import { apiErrorMessage } from "@/lib/apiErrors";
import type {
  AILogInput,
  AIParsedQuery,
  InvestigateResponse,
  LogEntry,
  LogSearchParams,
  NLQResponse,
  SummarizeResponse,
} from "@/types/api";

export const AI_LOG_CAP = 100;

async function aiRequest<T>(path: string, body: unknown): Promise<T> {
  try {
    return await apiRequest<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof ApiClientError) {
      throw new ApiClientError(
        apiErrorMessage(err.status, err.serverError ?? err.message, "ai"),
        err.status,
        err.serverError,
      );
    }
    throw err;
  }
}

export function logToAIInput(log: LogEntry): AILogInput {
  return {
    id: log.id,
    timestamp: log.timestamp,
    severity: log.severity,
    message: log.message,
    service_id: log.service_id,
  };
}

export function nlqQueryToSearchParams(
  query: AIParsedQuery,
  page = 1,
  limit = 50,
): LogSearchParams {
  return {
    service_id:
      query.service_ids.length === 1 ? query.service_ids[0] : undefined,
    severity: query.severity.length ? query.severity.join(",") : undefined,
    from: query.from ?? undefined,
    to: query.to ?? undefined,
    q: query.q || undefined,
    page,
    limit,
  };
}

export function aiNlq(
  orgId: string,
  question: string,
  page = 1,
  limit = 50,
) {
  return aiRequest<NLQResponse>(`/orgs/${orgId}/ai/nlq`, {
    question,
    page,
    limit,
  });
}

export function aiSummarize(
  orgId: string,
  logs: AILogInput[],
  window?: string,
) {
  return aiRequest<SummarizeResponse>(`/orgs/${orgId}/ai/summarize`, {
    window,
    logs,
  });
}

export function aiInvestigate(
  orgId: string,
  question: string,
  logs: AILogInput[],
) {
  return aiRequest<InvestigateResponse>(`/orgs/${orgId}/ai/investigate`, {
    question,
    logs,
  });
}

export function searchWindowLabel(params: LogSearchParams): string {
  if (params.from && params.to) {
    return `${new Date(params.from).toLocaleString()} – ${new Date(params.to).toLocaleString()}`;
  }
  if (params.from) {
    return `since ${new Date(params.from).toLocaleString()}`;
  }
  return "current search results";
}
