import { useQuery } from "@tanstack/react-query";
import { getApiHealth, getIngestHealth } from "@/api/health";
import { cn } from "@/lib/utils";

function StatusPill({
  label,
  ok,
  loading,
}: {
  label: string;
  ok: boolean;
  loading: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px]",
        loading && "border-ll-border bg-ll-muted text-ll-text-faint",
        !loading && ok && "border-[#00FF9C44] bg-[#0d2b1f] text-ll-accent",
        !loading && !ok && "border-[#e0555544] bg-[#2b0e0e] text-ll-error",
      )}
      title={loading ? "Checking…" : ok ? `${label} healthy` : `${label} unreachable`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          loading && "bg-ll-text-faint",
          !loading && ok && "bg-ll-accent",
          !loading && !ok && "bg-ll-error",
        )}
      />
      {label}
    </span>
  );
}

export function HealthStatusBadge() {
  const { data: apiOk, isLoading: apiLoading } = useQuery({
    queryKey: ["health", "api"],
    queryFn: getApiHealth,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { data: ingestOk, isLoading: ingestLoading } = useQuery({
    queryKey: ["health", "ingest"],
    queryFn: getIngestHealth,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  return (
    <div className="flex items-center gap-1.5">
      <StatusPill label="API" ok={!!apiOk} loading={apiLoading} />
      <StatusPill label="Ingest" ok={!!ingestOk} loading={ingestLoading} />
    </div>
  );
}
