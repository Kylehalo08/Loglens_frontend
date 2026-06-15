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
  IconSparkles,
} from "@tabler/icons-react";
import { aiInvestigate } from "@/api/ai";
import { listServices } from "@/api/services";
import { useQuery } from "@tanstack/react-query";
import { Button, Input, LoadingState } from "@/components/ui";
import { formatTime } from "@/lib/utils";
import type { AIInvestigationResult } from "@/types/api";

export function InvestigatePage() {
  const { orgId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuestion =
    (location.state as { question?: string } | null)?.question ?? "";

  const [question, setQuestion] = useState(
    initialQuestion || "Why are payment requests failing?",
  );
  const [serviceId, setServiceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIInvestigationResult | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => listServices(orgId),
  });

  const runInvestigation = async () => {
    setLoading(true);
    try {
      const res = await aiInvestigate(
        orgId,
        question,
        serviceId || undefined,
      );
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const serviceName = services.find((s) => s.id === serviceId)?.name;

  return (
    <div>
      <div className="border-b border-ll-border px-4 py-3">
        <div className="text-sm font-medium text-ll-text">AI investigate</div>
        <div className="text-[11px] text-ll-text-dim">
          Ask a question about your logs in plain English
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
            placeholder="Why are payment requests failing since 14:00?"
          />
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <select
            className="rounded border border-ll-border bg-ll-elevated px-2 py-1 text-[11px] text-[#5a7080]"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
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
        {result && (
          <div className="flex flex-wrap gap-1.5">
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
          </div>
        )}
      </div>

      {loading && <LoadingState label="Analyzing logs…" />}

      {result && !loading && (
        <>
          <div className="flex items-center gap-2 border-b border-[#00FF9C22] bg-[#0d2b1f] px-3.5 py-2">
            <IconSparkles size={14} className="text-ll-accent" />
            <span className="font-mono text-[11px] text-[#00c97e]">
              Analysis complete — confidence: {result.confidence}
            </span>
          </div>

          <div className="flex flex-col gap-3.5 p-4">
            <div className="overflow-hidden rounded-lg border border-ll-border bg-ll-elevated">
              <div className="flex items-center gap-2 border-b border-ll-border px-3.5 py-2.5">
                <IconFlame size={16} className="text-ll-error" />
                <span className="text-xs font-medium text-ll-text">Root cause</span>
                <span className="ml-auto rounded border border-[#e0555533] bg-[#2b0e0e] px-1.5 py-0.5 font-mono text-[10px] text-ll-error">
                  {result.confidence} confidence
                </span>
              </div>
              <p className="px-3.5 py-3 text-[13px] leading-relaxed text-[#a0b8c4]">
                {result.root_cause}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-ll-border bg-ll-elevated">
              <div className="flex items-center gap-2 border-b border-ll-border px-3.5 py-2.5">
                <IconListSearch size={16} className="text-ll-warn" />
                <span className="text-xs font-medium text-ll-text">
                  Supporting evidence
                </span>
                <span className="ml-auto rounded border border-[#f0a83233] bg-[#2b1e08] px-1.5 py-0.5 font-mono text-[10px] text-ll-warn">
                  {result.evidence.length} signals
                </span>
              </div>
              <div className="flex flex-col gap-2 p-3.5">
                {result.evidence.map((ev, i) => (
                  <div
                    key={ev.title}
                    className="flex gap-2.5 rounded-md bg-ll-muted px-2.5 py-2"
                  >
                    <span className="shrink-0 font-mono text-[10px] text-ll-text-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="text-xs text-ll-text">{ev.title}</div>
                      <div className="font-mono text-[11px] text-ll-text-dim">
                        {ev.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-ll-border bg-ll-elevated">
              <div className="flex items-center gap-2 border-b border-ll-border px-3.5 py-2.5">
                <IconLink size={16} className="text-ll-accent" />
                <span className="text-xs font-medium text-ll-text">
                  Related log entries
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-3.5">
                {result.related_logs.map((log) => (
                  <button
                    key={log.id}
                    type="button"
                    className="flex items-center gap-2.5 rounded-md bg-ll-muted px-2.5 py-1.5 text-left hover:bg-[#1a2228]"
                    onClick={() => navigate(`/org/${orgId}/search`)}
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
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-ll-border px-4 py-3">
            <Button variant="ghost" onClick={runInvestigation}>
              <IconRefresh size={14} /> Re-run
            </Button>
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="py-16 text-center text-xs text-ll-text-dim">
          Enter a question and click Investigate. AI uses mock analysis until backend is ready.
        </div>
      )}
    </div>
  );
}
