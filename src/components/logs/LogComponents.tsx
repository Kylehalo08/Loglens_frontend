import type { LogEntry } from "@/types/api";
import { SeverityBadge } from "@/components/ui";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function LogLine({
  log,
  serviceName,
  selected,
  onClick,
  highlight,
}: {
  log: LogEntry;
  serviceName?: string;
  selected?: boolean;
  onClick?: () => void;
  highlight?: string;
}) {
  const msg = highlight
    ? highlightMessage(log.message, highlight)
    : log.message;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={cn(
        "grid grid-cols-[130px_100px_60px_1fr_28px] items-start gap-2 border-b border-[#141a1e] px-4 py-2.5 text-left",
        onClick && "cursor-pointer hover:bg-ll-elevated",
        selected && "border-l-2 border-l-ll-accent bg-[#0d1a14]",
      )}
    >
      <span className="font-mono text-[11px] text-ll-text-faint">
        {formatTime(log.timestamp)}
      </span>
      <span className="truncate font-mono text-[11px] text-[#5a8090]">
        {serviceName ?? log.service_id.slice(0, 8)}
      </span>
      <SeverityBadge severity={log.severity} />
      <span className="truncate font-mono text-[11px] text-[#7a9aaa]">{msg}</span>
      {onClick && (
        <span className="self-center text-sm text-ll-text-faint">›</span>
      )}
    </div>
  );
}

function highlightMessage(message: string, term: string) {
  if (!term) return message;
  const idx = message.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return message;
  return (
    <>
      {message.slice(0, idx)}
      <span className="rounded bg-[#0d2b1f] px-0.5 text-ll-accent">
        {message.slice(idx, idx + term.length)}
      </span>
      {message.slice(idx + term.length)}
    </>
  );
}

export function LogDetailPanel({
  log,
  serviceName,
  permalink,
  onInvestigate,
}: {
  log: LogEntry;
  serviceName?: string;
  permalink?: string;
  onInvestigate?: () => void;
}) {
  return (
    <div className="border-t border-ll-border bg-ll-elevated p-4">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wider text-ll-text-dim">
        <span>Log detail</span>
        <span className="font-mono text-[11px] normal-case text-ll-text-faint">
          id: {log.id.slice(0, 8)}…
        </span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        {[
          ["Timestamp", new Date(log.timestamp).toISOString()],
          ["Service", serviceName ?? log.service_id],
          ["Severity", log.severity],
          ["Ingested", new Date(log.ingested_at).toISOString()],
        ].map(([label, val]) => (
          <div key={label} className="rounded-md bg-ll-muted p-2.5">
            <div className="mb-0.5 text-[10px] uppercase tracking-wider text-ll-text-faint">
              {label}
            </div>
            <div
              className={cn(
                "font-mono text-xs text-ll-text",
                label === "Severity" && log.severity === "ERROR" && "text-ll-error",
              )}
            >
              {val}
            </div>
          </div>
        ))}
      </div>
      <div className="mb-2.5 rounded-md bg-ll-muted p-2.5 font-mono text-xs leading-relaxed text-[#a0b8c4]">
        {log.message}
      </div>
      {Object.keys(log.metadata).length > 0 && (
        <pre className="mb-2.5 overflow-x-auto rounded-md bg-ll-muted p-2.5 font-mono text-[11px] text-[#7a9aaa]">
          {JSON.stringify(log.metadata, null, 2)}
        </pre>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md border border-ll-border px-2.5 py-1 text-[11px] text-ll-text-muted"
          onClick={() => navigator.clipboard.writeText(log.message)}
        >
          Copy
        </button>
        {permalink && (
          <button
            type="button"
            className="rounded-md border border-ll-border px-2.5 py-1 text-[11px] text-ll-text-muted"
            onClick={() => navigator.clipboard.writeText(permalink)}
          >
            Permalink
          </button>
        )}
        {onInvestigate && (
          <button
            type="button"
            className="rounded-md border border-[#00FF9C44] bg-[#0d2b1f] px-2.5 py-1 text-[11px] text-ll-accent"
            onClick={onInvestigate}
          >
            Investigate with AI
          </button>
        )}
      </div>
    </div>
  );
}

export function LogFeedLine({
  log,
  serviceName,
}: {
  log: LogEntry;
  serviceName?: string;
}) {
  const levelClass: Record<string, string> = {
    INFO: "text-ll-info",
    WARN: "text-ll-warn",
    ERROR: "text-ll-error",
    DEBUG: "text-ll-text-dim",
    FATAL: "text-ll-error",
  };

  return (
    <div className="flex items-baseline gap-2.5 border-b border-[#141a1e] py-1 font-mono text-[11px]">
      <span className="shrink-0 text-ll-text-faint">{formatTime(log.timestamp)}</span>
      <span className="w-[90px] shrink-0 text-[#5a8090]">{serviceName ?? "—"}</span>
      <span className={cn("w-10 shrink-0", levelClass[log.severity])}>
        {log.severity}
      </span>
      <span className="flex-1 truncate text-[#7a9aaa]">{log.message}</span>
    </div>
  );
}
