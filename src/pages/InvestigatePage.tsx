import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  IconAlertCircle,
  IconApps,
  IconArrowRight,
  IconClock,
  IconFlame,
  IconLink,
  IconListSearch,
  IconMessageQuestion,
  IconRefresh,
  IconRoute,
  IconSparkles,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import {
  AI_LOG_CAP,
  aiInvestigate,
  logToAIInput,
} from "@/api/ai";
import { searchLogs } from "@/api/logs";
import { listServices } from "@/api/services";
import { useAuthStore } from "@/stores/authStore";
import { Button, ErrorBanner, Input, LoadingState } from "@/components/ui";
import { AI_LIMITS_COPY } from "@/lib/apiErrors";
import { getErrorMessage } from "@/lib/apiErrors";
import { isDeveloperPlus } from "@/lib/roles";
import { formatTime } from "@/lib/utils";
import type { InvestigateResponse, LogEntry } from "@/types/api";

export function InvestigatePage() {
  const { orgId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentOrg = useAuthStore((s) => s.currentOrg);
  const canInvestigate = isDeveloperPlus(currentOrg?.role);

  const initialQuestion =
    (location.state as { question?: string } | null)?.question ?? "";

  const [question, setQuestion] = useState(
    initialQuestion || "Why is the database connection failing?",
  );
  const [serviceId, setServiceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InvestigateResponse | null>(null);
  const [sourceLogs, setSourceLogs] = useState<LogEntry[]>([]);

  const { data: services = [] } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => listServices(orgId),
  });

  const runInvestigation = async () => {
    if (!canInvestigate || loading) return;
    setError("");
    setLoading(true);
    try {
      const from = new Date();
      from.setHours(from.getHours() - 4);

      const searchResult = await searchLogs(orgId, {
        service_id: serviceId || undefined,
        severity: "ERROR,WARN",
        from: from.toISOString(),
        to: new Date().toISOString(),
        limit: AI_LOG_CAP,
      });

      const logs = searchResult.logs.map(logToAIInput);
      if (!logs.length) {
        setError(
          "No ERROR or WARN logs in the last 4 hours. Widen the time range or ingest more logs.",
        );
        return;
      }

      setSourceLogs(searchResult.logs);
      const res = await aiInvestigate(orgId, question.trim(), logs);
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err, "Investigation failed"));
    } finally {
      setLoading(false);
    }
  };

  const serviceName = services.find((s) => s.id === serviceId)?.name;
  const relatedLogs = result
    ? sourceLogs.filter((log) => result.related_log_ids.includes(log.id))
    : [];

  if (!canInvestigate) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-md rounded-lg border border-ll-border bg-ll-elevated p-6 text-center">
          <IconAlertCircle size={24} className="mx-auto mb-3 text-ll-warn" />
          <div className="text-sm font-medium text-ll-text">Developer access required</div>
          <p className="mt-2 text-xs leading-relaxed text-ll-text-dim">
            AI investigate is available to developers, admins, and owners. Viewers
            can still search logs and use NLQ summarize on the Search page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-ll-border px-4 py-3">
        <div className="text-sm font-medium text-ll-text">AI investigate</div>
        <div className="text-[11px] text-ll-text-dim">
          Root-cause analysis on recent ERROR and WARN logs
        </div>
      </div>

      <div className="border-b border-ll-border p-4">
        <div className="mb-2.5 flex items-center gap-2.5 rounded-lg border border-ll-border bg-ll-elevated px-3.5 py-2.5">
          <IconMessageQuestion size={18} className="shrink-0 text-ll-accent" />
          <Input
            className="border-0 bg-transparent p-0"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runInvestigation()}
            placeholder="Why is the database connection failing?"
            disabled={loading}
          />
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <select
            className="rounded border border-ll-border bg-ll-elevated px-2 py-1 text-[11px] text-[#5a7080]"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            disabled={loading}
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button variant="accent" onClick={runInvestigation} disabled={loading}>
            <IconSparkles size={14} />
            {loading ? "Analyzing…" : "Investigate"}
          </Button>
        </div>
        <p className="text-[10px] text-ll-text-faint">{AI_LIMITS_COPY}</p>

        {error && (
          <div className="mt-3 rounded-ll border border-[#e0555533] bg-[#2b0e0e] px-3 py-2">
            <ErrorBanner message={error} />
          </div>
        )}

        {result && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {serviceName && (
              <span className="flex items-center gap-1 rounded border border-ll-border bg-ll-elevated px-2 py-1 text-[11px] text-[#5a7080]">
                <IconApps size={12} /> {serviceName}
              </span>
            )}
            <span className="flex items-center gap-1 rounded border border-ll-border bg-ll-elevated px-2 py-1 text-[11px] text-[#5a7080]">
              <IconClock size={12} /> last 4 hours
            </span>
            <span className="flex items-center gap-1 rounded border border-ll-border bg-ll-elevated px-2 py-1 text-[11px] text-[#5a7080]">
              <IconAlertCircle size={12} /> ERROR + WARN
            </span>
            <span className="flex items-center gap-1 rounded border border-ll-border bg-ll-elevated px-2 py-1 text-[11px] text-[#5a7080]">
              up to {AI_LOG_CAP} logs sent
            </span>
          </div>
        )}
      </div>

      {loading && <LoadingState label="Analyzing logs… (may take up to 15s)" />}

      {result && !loading && (
        <>
          <div className="flex items-center gap-2 border-b border-[#00FF9C22] bg-[#0d2b1f] px-3.5 py-2">
            <IconSparkles size={14} className="text-ll-accent" />
            <span className="font-mono text-[11px] text-[#00c97e]">
              Analysis complete — confidence {(result.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex flex-col gap-3.5 p-4">
            <div className="overflow-hidden rounded-lg border border-ll-border bg-ll-elevated">
              <div className="flex items-center gap-2 border-b border-ll-border px-3.5 py-2.5">
                <IconFlame size={16} className="text-ll-error" />
                <span className="text-xs font-medium text-ll-text">Hypothesis</span>
              </div>
              <p className="px-3.5 py-3 text-[13px] leading-relaxed text-[#a0b8c4]">
                {result.hypothesis}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-ll-border bg-ll-elevated">
              <div className="flex items-center gap-2 border-b border-ll-border px-3.5 py-2.5">
                <IconListSearch size={16} className="text-ll-warn" />
                <span className="text-xs font-medium text-ll-text">Evidence</span>
                <span className="ml-auto rounded border border-[#f0a83233] bg-[#2b1e08] px-1.5 py-0.5 font-mono text-[10px] text-ll-warn">
                  {result.evidence.length} items
                </span>
              </div>
              <ul className="list-inside list-disc px-3.5 py-3 text-xs leading-relaxed text-[#a0b8c4]">
                {result.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-lg border border-ll-border bg-ll-elevated">
              <div className="flex items-center gap-2 border-b border-ll-border px-3.5 py-2.5">
                <IconRoute size={16} className="text-ll-info" />
                <span className="text-xs font-medium text-ll-text">Next steps</span>
              </div>
              <ol className="list-inside list-decimal px-3.5 py-3 text-xs leading-relaxed text-[#a0b8c4]">
                {result.next_steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="overflow-hidden rounded-lg border border-ll-border bg-ll-elevated">
              <div className="flex items-center gap-2 border-b border-ll-border px-3.5 py-2.5">
                <IconLink size={16} className="text-ll-accent" />
                <span className="text-xs font-medium text-ll-text">
                  Related log entries
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-3.5">
                {relatedLogs.length === 0 ? (
                  <p className="text-xs text-ll-text-dim">No matching logs in the analyzed set.</p>
                ) : (
                  relatedLogs.map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      className="flex items-center gap-2.5 rounded-md bg-ll-muted px-2.5 py-1.5 text-left hover:bg-[#1a2228]"
                      onClick={() => navigate(`/org/${orgId}/logs/${log.id}`)}
                    >
                      <span className="shrink-0 font-mono text-[10px] text-ll-text-faint">
                        {formatTime(log.timestamp)}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1 font-mono text-[10px] ${
                          log.severity === "ERROR"
                            ? "bg-[#2b0e0e] text-ll-error"
                            : "bg-[#2b1e08] text-ll-warn"
                        }`}
                      >
                        {log.severity}
                      </span>
                      <span className="flex-1 truncate font-mono text-[11px] text-[#7a9aaa]">
                        {log.message}
                      </span>
                      <IconArrowRight size={14} className="shrink-0 text-ll-text-faint" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-ll-border px-4 py-3">
            <Button variant="ghost" onClick={runInvestigation} disabled={loading}>
              <IconRefresh size={14} /> Re-run
            </Button>
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <div className="py-16 text-center text-xs text-ll-text-dim">
          Enter a question and click Investigate. Sends up to {AI_LOG_CAP} recent
          ERROR/WARN logs to the AI backend.
        </div>
      )}
    </div>
  );
}
