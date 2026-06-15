import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  IconAlertCircle,
  IconApps,
  IconCalendar,
  IconSparkles,
} from "@tabler/icons-react";
import { aiNaturalLanguageQuery, aiSummarize } from "@/api/ai";
import { searchLogs } from "@/api/logs";
import { listServices } from "@/api/services";
import { LogLine } from "@/components/logs/LogComponents";
import { Button, FilterChip, LoadingState } from "@/components/ui";
import { todayRange } from "@/lib/utils";
import type { LogSearchParams, Severity } from "@/types/api";

const SEVERITIES: Severity[] = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

export function SearchPage() {
  const { orgId = "" } = useParams();
  const navigate = useNavigate();

  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [params, setParams] = useState<LogSearchParams>({ page: 1, limit: 50 });
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => listServices(orgId),
  });

  const serviceMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.name])),
    [services],
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["logs-search", orgId, params],
    queryFn: () => searchLogs(orgId, params),
  });

  const activeSeverities = params.severity?.split(",") ?? [];

  const toggleSeverity = (sev: Severity) => {
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
    setParams((p) => ({
      ...p,
      service_id: p.service_id === id ? undefined : id,
      page: 1,
    }));
  };

  const setToday = () => {
    const { from, to } = todayRange();
    setParams((p) => ({ ...p, from, to, page: 1 }));
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const { searchParams } = await aiNaturalLanguageQuery(orgId, aiQuery);
      setParams((p) => ({ ...p, ...searchParams, page: 1 }));
      refetch();
    } finally {
      setAiLoading(false);
    }
  };

  const handleSummarize = async () => {
    setSummaryLoading(true);
    try {
      const result = await aiSummarize(orgId, params);
      setSummary(result.summary);
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
        <span className="font-mono text-[11px] text-ll-text-faint">
          {pagination?.total.toLocaleString() ?? 0} results
        </span>
      </div>

      <div className="mx-4 mt-3.5 flex items-center gap-2 rounded-lg border border-[#00FF9C44] bg-ll-elevated px-3 py-2.5">
        <IconSparkles size={16} className="shrink-0 text-ll-accent" />
        <input
          className="flex-1 bg-transparent text-sm text-ll-text outline-none placeholder:text-ll-text-faint"
          placeholder="Show payment failures from today"
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAiQuery()}
        />
        <Button
          variant="ghost"
          className="shrink-0 py-1"
          onClick={handleSummarize}
          disabled={summaryLoading || !(data?.logs.length)}
        >
          {summaryLoading ? "…" : "Summarize"}
        </Button>
        <Button
          variant="accent"
          className="shrink-0 py-1"
          onClick={handleAiQuery}
          disabled={aiLoading}
        >
          {aiLoading ? "…" : "AI query"}
        </Button>
      </div>

      {summary && (
        <div className="mx-4 mb-2 rounded-lg border border-ll-border bg-ll-elevated p-3 text-xs leading-relaxed text-[#a0b8c4]">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-ll-text-dim">
            AI summary
          </div>
          {summary}
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
