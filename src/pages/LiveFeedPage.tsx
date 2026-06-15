import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listServices } from "@/api/services";
import { LogFeedLine } from "@/components/logs/LogComponents";
import { FilterChip, Select } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { getWsBase } from "@/lib/utils";
import type { LogEntry } from "@/types/api";

const MAX_LINES = 200;

export function LiveFeedPage() {
  const { orgId = "" } = useParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => listServices(orgId),
  });

  useEffect(() => {
    if (services.length && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  const serviceMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.name])),
    [services],
  );

  useEffect(() => {
    if (!orgId || !selectedServiceId || !accessToken) return;

    setLogs([]);
    setWsError(null);

    // Browser WebSocket cannot set Authorization header — use dev proxy with subprotocol workaround
    // or poll fallback. Vite proxy forwards ws with custom header via upgrade hook isn't standard.
    // Attempt direct WS; show polling fallback on failure.
    const wsUrl = `${getWsBase()}/orgs/${orgId}/services/${selectedServiceId}/logs/stream`;

    let ws: WebSocket | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl, []);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          setConnected(true);
          setWsError(null);
        };

        ws.onmessage = (ev) => {
          try {
            const entry = JSON.parse(ev.data) as LogEntry;
            setLogs((prev) => [entry, ...prev].slice(0, MAX_LINES));
          } catch {
            /* ignore malformed */
          }
        };

        ws.onerror = () => {
          setConnected(false);
          setWsError(
            "WebSocket unavailable in browser (auth header limitation). Using polling fallback.",
          );
          startPolling();
        };

        ws.onclose = () => {
          setConnected(false);
          if (!cancelled && !pollTimer) startPolling();
        };
      } catch {
        setWsError("WebSocket connection failed. Using polling fallback.");
        startPolling();
      }
    };

    const startPolling = () => {
      if (pollTimer) return;
      const poll = async () => {
        const { searchLogs } = await import("@/api/logs");
        const result = await searchLogs(orgId, {
          service_id: selectedServiceId,
          limit: 20,
        });
        if (!cancelled) setLogs(result.logs);
      };
      poll();
      pollTimer = setInterval(poll, 5000);
    };

    connectWs();

    return () => {
      cancelled = true;
      ws?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [orgId, selectedServiceId, accessToken]);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-ll-border px-4 py-3">
        <div>
          <div className="text-sm font-medium text-ll-text">Live feed</div>
          <div className="text-[11px] text-ll-text-dim">
            Real-time logs for a service
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <FilterChip active={connected}>
            {connected ? "● connected" : "○ polling"}
          </FilterChip>
        </div>
      </div>

      {wsError && (
        <div className="mx-4 mt-3 rounded-md border border-[#f0a83244] bg-[#2b2010] px-3 py-2 text-[11px] text-ll-warn">
          {wsError}
        </div>
      )}

      <div className="p-4">
        <div className="rounded-lg border border-ll-border bg-ll-elevated p-3 font-mono text-[11px] min-h-[400px] max-h-[calc(100vh-200px)] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="py-16 text-center text-ll-text-faint">
              Waiting for logs…
            </div>
          ) : (
            logs.map((log) => (
              <LogFeedLine
                key={`${log.id}-${log.ingested_at}`}
                log={log}
                serviceName={serviceMap[log.service_id]}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
