import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { listServices } from "@/api/services";
import { searchLogs } from "@/api/logs";
import { LogFeedLine } from "@/components/logs/LogComponents";
import { DemoLimitsNotice, ErrorBanner, LoadingState } from "@/components/ui";
import { getErrorMessage } from "@/lib/apiErrors";
import { last24hRange } from "@/lib/utils";
import type { Service } from "@/types/api";

interface ServiceStats {
  service: Service;
  total: number;
  errors: number;
}

export function DashboardPage() {
  const { orgId = "" } = useParams();
  const range = last24hRange();

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => listServices(orgId),
  });

  const { data: totalLogs, error: totalError } = useQuery({
    queryKey: ["dashboard-total", orgId],
    queryFn: () => searchLogs(orgId, { ...range, limit: 1 }),
  });

  const { data: errorLogs } = useQuery({
    queryKey: ["dashboard-errors", orgId],
    queryFn: () =>
      searchLogs(orgId, { ...range, severity: "ERROR", limit: 1 }),
  });

  const serviceStatsQueries = useQuery({
    queryKey: ["dashboard-service-stats", orgId, services.map((s) => s.id)],
    queryFn: async (): Promise<ServiceStats[]> => {
      const stats = await Promise.all(
        services.map(async (svc) => {
          const [all, errs] = await Promise.all([
            searchLogs(orgId, {
              service_id: svc.id,
              ...range,
              limit: 1,
            }),
            searchLogs(orgId, {
              service_id: svc.id,
              severity: "ERROR",
              ...range,
              limit: 1,
            }),
          ]);
          return {
            service: svc,
            total: all.pagination.total,
            errors: errs.pagination.total,
          };
        }),
      );
      return stats;
    },
    enabled: services.length > 0,
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["dashboard-recent", orgId],
    queryFn: () => searchLogs(orgId, { limit: 8 }),
    refetchInterval: 10000,
  });

  const serviceMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.name])),
    [services],
  );

  if (servicesLoading) return <LoadingState />;

  const total = totalLogs?.pagination.total ?? 0;
  const errors = errorLogs?.pagination.total ?? 0;
  const stats = serviceStatsQueries.data ?? [];

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="text-sm font-medium text-ll-text">Overview</div>
        <DemoLimitsNotice className="max-w-md text-right" />
      </div>

      {totalError && (
        <div className="mb-4 rounded-ll border border-[#e0555533] bg-[#2b0e0e] px-3 py-2">
          <ErrorBanner message={getErrorMessage(totalError, "Failed to load dashboard")} />
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total logs (24h)", value: total.toLocaleString(), sub: "last 24 hours" },
          {
            label: "Errors (24h)",
            value: errors.toLocaleString(),
            sub: total > 0 ? `${((errors / total) * 100).toFixed(1)}% of total` : "—",
            red: true,
          },
          {
            label: "Active services",
            value: String(services.length),
            sub: "registered in org",
            green: true,
          },
          {
            label: "Retention",
            value: "6h",
            sub: "demo log retention",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-ll-border bg-ll-elevated px-4 py-3.5"
          >
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-ll-text-dim">
              {card.label}
            </div>
            <div
              className={`font-mono text-[22px] font-medium ${
                card.red ? "text-ll-error" : card.green ? "text-ll-accent" : "text-ll-text"
              }`}
            >
              {card.value}
            </div>
            <div className="mt-1 text-[11px] text-ll-text-faint">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="mb-2.5 text-xs uppercase tracking-wider text-ll-text-dim">
        Services
      </div>
      <div className="mb-5 overflow-hidden rounded-lg border border-ll-border bg-ll-elevated">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_80px] gap-2 border-b border-ll-border px-4 py-2.5 text-[11px] uppercase tracking-wider text-ll-text-faint">
          <span>Service</span>
          <span>Logs (24h)</span>
          <span>Errors</span>
          <span>Error rate</span>
          <span>Status</span>
        </div>
        {stats.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-ll-text-dim">
            No services yet. Create one from the Services page.
          </div>
        ) : (
          stats.map(({ service, total: svcTotal, errors: svcErrors }, i) => {
            const rate = svcTotal > 0 ? (svcErrors / svcTotal) * 100 : 0;
            const dotColors = ["bg-ll-accent", "bg-ll-accent", "bg-ll-warn", "bg-ll-error"];
            const status =
              rate > 2 ? "warn" : svcTotal === 0 ? "idle" : "healthy";
            return (
              <div
                key={service.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_80px] items-center gap-2 border-b border-[#1a2228] px-4 py-2.5 text-xs last:border-0"
              >
                <span className="flex items-center gap-1.5 font-medium text-ll-text">
                  <span className={`h-1.5 w-1.5 rounded-full ${dotColors[i % 4]}`} />
                  {service.name}
                </span>
                <span className="font-mono text-[#7a9aaa]">
                  {svcTotal.toLocaleString()}
                </span>
                <span className="font-mono text-ll-error">
                  {svcErrors.toLocaleString()}
                </span>
                <span
                  className={`font-mono ${rate > 1 ? "text-ll-error" : "text-[#00c97e]"}`}
                >
                  {rate.toFixed(2)}%
                </span>
                <span
                  className={`w-fit rounded px-1.5 py-0.5 font-mono text-[10px] ${
                    status === "warn"
                      ? "border border-[#f0a83233] bg-[#2b2010] text-ll-warn"
                      : status === "idle"
                        ? "border border-ll-border bg-ll-muted text-ll-text-faint"
                        : "border border-[#00FF9C33] bg-[#0d2b1f] text-ll-accent"
                  }`}
                >
                  {status}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="mb-2.5 text-xs uppercase tracking-wider text-ll-text-dim">
        Live feed
      </div>
      <div className="max-h-40 overflow-hidden rounded-lg border border-ll-border bg-ll-elevated p-3">
        {recentLogs?.logs.length ? (
          recentLogs.logs.map((log) => (
            <LogFeedLine
              key={log.id}
              log={log}
              serviceName={serviceMap[log.service_id]}
            />
          ))
        ) : (
          <div className="py-6 text-center text-xs text-ll-text-faint">
            No logs yet — ingest via SDK or API key
          </div>
        )}
      </div>
    </div>
  );
}
