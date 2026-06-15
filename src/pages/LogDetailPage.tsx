import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLog } from "@/api/logs";
import { listServices } from "@/api/services";
import { LogDetailPanel } from "@/components/logs/LogComponents";
import { LoadingState, PageTopbar } from "@/components/ui";
import { copyToClipboard } from "@/lib/utils";

export function LogDetailPage() {
  const { orgId = "", logId = "" } = useParams();
  const navigate = useNavigate();

  const { data: log, isLoading, error } = useQuery({
    queryKey: ["log", orgId, logId],
    queryFn: () => getLog(orgId, logId),
    enabled: !!orgId && !!logId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => listServices(orgId),
  });

  const serviceName = log
    ? services.find((s) => s.id === log.service_id)?.name
    : undefined;

  const permalink = `${window.location.origin}/org/${orgId}/logs/${logId}`;

  if (isLoading) return <LoadingState />;
  if (error || !log) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-ll-error">Log not found</p>
        <Link
          to={`/org/${orgId}/search`}
          className="mt-3 inline-block text-xs text-ll-accent"
        >
          ← Back to search
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageTopbar
        title="Log detail"
        subtitle={`Permalink · ${logId.slice(0, 8)}…`}
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-ll-border px-2.5 py-1 text-[11px] text-ll-text-muted hover:text-ll-text"
              onClick={() => copyToClipboard(permalink)}
            >
              Copy link
            </button>
            <Link
              to={`/org/${orgId}/search`}
              className="text-xs text-ll-text-muted hover:text-ll-text"
            >
              ← Search
            </Link>
          </div>
        }
      />
      <LogDetailPanel
        log={log}
        serviceName={serviceName}
        permalink={permalink}
        onInvestigate={() =>
          navigate(`/org/${orgId}/investigate`, {
            state: { question: `Why did this happen? ${log.message}` },
          })
        }
      />
    </div>
  );
}
