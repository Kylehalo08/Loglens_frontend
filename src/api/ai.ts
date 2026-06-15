import type {
  AIInvestigationResult,
  AIQueryResult,
  AISummaryResult,
  LogSearchParams,
  Severity,
} from "@/types/api";
import { searchLogs } from "./logs";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseNaturalLanguage(query: string): LogSearchParams {
  const lower = query.toLowerCase();
  const params: LogSearchParams = {};

  if (lower.includes("error") || lower.includes("fail")) {
    params.severity = "ERROR";
  } else if (lower.includes("warn")) {
    params.severity = "WARN";
  }

  if (lower.includes("today")) {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    params.from = from.toISOString();
    params.to = new Date().toISOString();
  }

  const paymentMatch = lower.match(/payment|checkout|refund/);
  if (paymentMatch) params.q = paymentMatch[0];

  const words = query
    .replace(/show|from|today|failures|errors|logs/gi, "")
    .trim();
  if (words.length > 2 && !params.q) params.q = words;

  return params;
}

export async function aiNaturalLanguageQuery(
  orgId: string,
  query: string,
  serviceId?: string,
): Promise<{ interpretation: AIQueryResult; searchParams: LogSearchParams }> {
  await delay(800);
  const interpreted = parseNaturalLanguage(query);
  if (serviceId) interpreted.service_id = serviceId;

  const result = await searchLogs(orgId, { ...interpreted, limit: 100 });
  return {
    interpretation: {
      query,
      interpreted_filters: {
        service_ids: serviceId ? [serviceId] : undefined,
        severity: interpreted.severity?.split(",") as Severity[] | undefined,
        from: interpreted.from,
        to: interpreted.to,
        q: interpreted.q,
      },
      logs_analyzed: result.pagination.total,
    },
    searchParams: interpreted,
  };
}

export async function aiSummarize(
  orgId: string,
  params: LogSearchParams,
): Promise<AISummaryResult> {
  await delay(1200);
  const result = await searchLogs(orgId, { ...params, limit: 200 });
  const errors = result.logs.filter((l) => l.severity === "ERROR").length;
  const warns = result.logs.filter((l) => l.severity === "WARN").length;

  return {
    log_count: result.pagination.total,
    summary: `Analyzed ${result.pagination.total} logs in the selected window. Found ${errors} errors and ${warns} warnings. ${
      errors > 0
        ? "The dominant pattern appears to be upstream gateway timeouts and retry storms amplifying failure volume."
        : "No significant error spikes detected in this window."
    }`,
  };
}

export async function aiInvestigate(
  orgId: string,
  question: string,
  serviceId?: string,
): Promise<AIInvestigationResult> {
  await delay(1500);
  const params: LogSearchParams = {
    severity: "ERROR,WARN",
    limit: 100,
  };
  if (serviceId) params.service_id = serviceId;

  const from = new Date();
  from.setHours(from.getHours() - 4);
  params.from = from.toISOString();
  params.to = new Date().toISOString();

  const result = await searchLogs(orgId, params);
  const logs = result.logs;

  return {
    root_cause: `Based on analysis of "${question}": ${
      logs.length > 0
        ? "The upstream gateway is returning 5xx errors on a significant share of requests, causing cascading retries that exhaust the connection pool. Root trigger appears external to application code."
        : "Insufficient error logs in the selected window to determine a definitive root cause. Try widening the time range or checking ingestion."
    }`,
    confidence: logs.length > 5 ? "high" : logs.length > 0 ? "medium" : "low",
    evidence: [
      {
        title: "Error volume in window",
        detail: `${result.pagination.total} matching logs — ${logs.filter((l) => l.severity === "ERROR").length} errors`,
      },
      {
        title: "Retry patterns",
        detail: logs.some((l) => l.message.includes("retry"))
          ? "Retry attempts detected on failed transactions"
          : "No explicit retry patterns in sampled logs",
      },
      {
        title: "Service isolation",
        detail: serviceId
          ? "Analysis scoped to selected service"
          : "Cross-service comparison recommended",
      },
    ],
    related_logs: logs.slice(0, 6),
  };
}

export function isAiMockEnabled(): boolean {
  return import.meta.env.VITE_AI_MOCK !== "false";
}
