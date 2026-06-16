import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconAlertCircle,
  IconApps,
  IconCalendar,
  IconSparkles,
} from "@tabler/icons-react";
import {
  AI_LOG_CAP,
  aiNlq,
  aiSummarize,
  logToAIInput,
  nlqQueryToSearchParams,
  searchWindowLabel,
} from "@/api/ai";
import { searchLogs } from "@/api/logs";
import { listServices } from "@/api/services";
import { LogLine } from "@/components/logs/LogComponents";
import {
  Button,
  DemoLimitsNotice,
  ErrorBanner,
  FilterChip,
  LoadingState,
} from "@/components/ui";
import { AI_LIMITS_COPY, getErrorMessage } from "@/lib/apiErrors";
import { todayRange } from "@/lib/utils";
import type { AIParsedQuery, LogSearchParams, Severity, SummarizeResponse } from "@/types/api";

const SEVERITIES: Severity[] = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

export function SearchPage() {
  const { orgId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [parsedNlq, setParsedNlq] = useState<AIParsedQuery | null>(null);
  const [nlqProvider, setNlqProvider] = useState<string | null>(null);
  const [params, setParams] = useState<LogSearchParams>({ page: 1, limit: 50 });
  const [summary, setSummary] = useState<SummarizeResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => listServices(orgId),
  });

  const serviceMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.name])),
    [services],
  );

  const { data, isLoading, error: searchError } = useQuery({
    queryKey: ["logs-search", orgId, params],
    queryFn: () => searchLogs(orgId, params),
  });

  const activeSeverities = params.severity?.split(",") ?? [];

  const toggleSeverity = (sev: Severity) => {
    setParsedNlq(null);
    setNlqProvider(null);
    const current = new Set(activeSeverities);
    if (current.has(sev)) current.delete(sev);
    else current.add(sev);
    setParams((p) => ({
      ...p,
      severity: current.size ? [...current].join(",") : undefined,
      page: 1,
    }));
  };

  const toggleService = (id: string) => {
    setParsedNlq(null);
    setNlqProvider(null);
    setParams((p) => ({
      ...p,
      service_id: p.service_id === id ? undefined : id,
      page: 1,
    }));
  };

  const setToday = () => {
    setParsedNlq(null);
    setNlqProvider(null);
    const { from, to } = todayRange();
    setParams((p) => ({ ...p, from, to, page: 1 }));
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiError("");
    setSummary(null);
    setAiLoading(true);
    try {
      const response = await aiNlq(
        orgId,
        aiQuery.trim(),
        params.page ?? 1,
        params.limit ?? 50,
      );
      const newParams = nlqQueryToSearchParams(
        response.ai.query,
        response.result.pagination.page,
        response.result.pagination.limit,
      );
      setParsedNlq(response.ai.query);
      setNlqProvider(`${response.ai.provider} · ${response.ai.model}`);
      setParams(newParams);
      queryClient.setQueryData(["logs-search", orgId, newParams], response.result);
    } catch (err) {
      setAiError(getErrorMessage(err, "AI query failed"));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSummarize = async () => {
    const logsToSend = (data?.logs ?? []).slice(0, AI_LOG_CAP).map(logToAIInput);
    if (!logsToSend.length) {
      setAiError("Load some logs first, then summarize.");
      return;
    }
    if (summaryLoading) return;

    setAiError("");
    setSummaryLoading(true);
    try {
      const result = await aiSummarize(
        orgId,
        logsToSend,
        searchWindowLabel(params),
      );
      setSummary(result);
    } catch (err) {
      setAiError(getErrorMessage(err, "Summarize failed"));
    } finally {
      setSummaryLoading(false);
    }
  };

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="flex items-center justify-between border-b border-ll-border px-4 py-3">
        <span className="text-sm font-medium text-ll-text">Search logs</span>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[11px] text-ll-text-faint">
            {pagination?.total.toLocaleString() ?? 0} results
          </span>
          <DemoLimitsNotice className="text-right" />
        </div>
      </div>

      {searchError && (
        <div className="mx-4 mt-3 rounded-ll border border-[#e0555533] bg-[#2b0e0e] px-3 py-2">
          <ErrorBanner message={getErrorMessage(searchError, "Search failed")} />
        </div>
      )}

      <div className="mx-4 mt-3.5 flex items-center gap-2 rounded-lg border border-[#00FF9C44] bg-ll-elevated px-3 py-2.5">
        <IconSparkles size={16} className="shrink-0 text-ll-accent" />
        <input
          className="flex-1 bg-transparent text-sm text-ll-text outline-none placeholder:text-ll-text-faint"
          placeholder="Show error logs from last 1 hour"
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAiQuery()}
          disabled={aiLoading}
        />
        <Button
          variant="ghost"
          className="shrink-0 py-1"
          onClick={handleSummarize}
          disabled={summaryLoading || aiLoading || !logs.length}
        >
          {summaryLoading ? "Summarizing…" : "Summarize"}
        </Button>
        <Button
          variant="accent"
          className="shrink-0 py-1"
          onClick={handleAiQuery}
          disabled={aiLoading || !aiQuery.trim()}
        >
          {aiLoading ? "Thinking…" : "AI query"}
        </Button>
      </div>

      <p className="mx-4 mt-1.5 text-[10px] text-ll-text-faint">{AI_LIMITS_COPY}</p>

      {aiError && (
        <div className="mx-4 mt-2 rounded-ll border border-[#e0555533] bg-[#2b0e0e] px-3 py-2">
          <ErrorBanner message={aiError} />
        </div>
      )}

      {parsedNlq && (
        <div className="mx-4 mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-ll-text-dim">
            AI parsed
          </span>
          {nlqProvider && (
            <span className="rounded border border-ll-border bg-ll-muted px-2 py-0.5 font-mono text-[10px] text-ll-text-faint">
              {nlqProvider}
            </span>
          )}
          {parsedNlq.severity.map((sev) => (
            <FilterChip key={sev} active>
              <IconAlertCircle size={13} />
              {sev}
            </FilterChip>
          ))}
          {parsedNlq.service_ids.map((id) => (
            <FilterChip key={id} active>
              <IconApps size={13} />
              {serviceMap[id] ?? id.slice(0, 8)}
            </FilterChip>
          ))}
          {parsedNlq.q && (
            <FilterChip active>keyword: {parsedNlq.q}</FilterChip>
          )}
          {parsedNlq.from && (
            <FilterChip active>
              <IconCalendar size={13} />
              from {new Date(parsedNlq.from).toLocaleString()}
            </FilterChip>
          )}
        </div>
      )}

      {summary && (
        <div className="mx-4 mb-2 mt-3 rounded-lg border border-ll-border bg-ll-elevated p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-ll-text-dim">
              AI summary
            </span>
            <span className="font-mono text-[10px] text-ll-text-faint">
              confidence {(summary.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[#a0b8c4]">{summary.summary}</p>
          {summary.highlights.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-[11px] text-ll-text-dim">
              {summary.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {summary.top_errors.length > 0 && (
            <div className="mt-2 border-t border-ll-border pt-2">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-ll-text-dim">
                Top errors
              </div>
              {summary.top_errors.map((item) => (
                <div
                  key={item.message}
                  className="flex justify-between gap-2 font-mono text-[11px] text-ll-text-muted"
                >
                  <span className="truncate">{item.message}</span>
                  <span className="shrink-0 text-ll-error">×{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-ll-border">
        {services.map((svc) => (
          <FilterChip
            key={svc.id}
            active={params.service_id === svc.id}
            onClick={() => toggleService(svc.id)}
          >
            <IconApps size={13} />
            {svc.name}
          </FilterChip>
        ))}
        {SEVERITIES.map((sev) => (
          <FilterChip
            key={sev}
            active={activeSeverities.includes(sev)}
            onClick={() => toggleSeverity(sev)}
          >
            <IconAlertCircle size={13} />
            {sev}
          </FilterChip>
        ))}
        <FilterChip active={!!params.from} onClick={setToday}>
          <IconCalendar size={13} />
          Today
        </FilterChip>
      </div>

      <div className="grid grid-cols-[130px_100px_60px_1fr_28px] gap-2 border-b border-ll-border px-4 py-2 text-[10px] uppercase tracking-wider text-ll-text-faint">
        <span>Timestamp</span>
        <span>Service</span>
        <span>Level</span>
        <span>Message</span>
        <span />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-xs text-ll-text-dim">No logs found</div>
      ) : (
        logs.map((log) => (
          <LogLine
            key={log.id}
            log={log}
            serviceName={serviceMap[log.service_id]}
            selected={false}
            highlight={params.q}
            onClick={() => navigate(`/org/${orgId}/logs/${log.id}`)}
          />
        ))
      )}

      {pagination && pagination.total_pages > 0 && (
        <div className="flex items-center justify-between border-t border-ll-border px-4 py-2.5 font-mono text-[11px] text-ll-text-faint">
          <span>
            showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              className="disabled:opacity-40"
              onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
            >
              ← prev
            </button>
            <span>
              page {pagination.page} / {pagination.total_pages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.total_pages}
              className="disabled:opacity-40"
              onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
            >
              next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
