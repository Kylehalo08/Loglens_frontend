import { IconLock } from "@tabler/icons-react";
import { listAuditEntries } from "@/api/audit";
import { FilterChip, PageTopbar } from "@/components/ui";
import { avatarColor } from "@/lib/utils";
import type { AuditAction } from "@/types/api";

const actionStyles: Record<AuditAction, string> = {
  login: "bg-[#081828] text-ll-info border border-[#378ADD33]",
  "login.fail": "bg-[#081828] text-ll-info border border-[#378ADD33]",
  "key.create": "bg-[#2b1e08] text-ll-warn border border-[#f0a83233]",
  "key.revoke": "bg-[#2b0e0e] text-ll-error border border-[#e0555533]",
  "member.invite": "bg-[#0d2b1f] text-[#00c97e] border border-[#00c97e33]",
  "member.remove": "bg-[#2b1010] text-[#c04040] border border-[#c0404033]",
  "service.create": "bg-[#1a1028] text-[#9070e0] border border-[#9070e033]",
  "service.delete": "bg-[#2b0e0e] text-ll-error border border-[#e0555533]",
};

export function AuditLogPage() {
  const entries = listAuditEntries();

  return (
    <div>
      <PageTopbar
        title="Audit log"
        subtitle="Append-only · tamper-evident · retained 90 days"
        right={
          <span className="flex items-center gap-1 rounded border border-ll-border bg-ll-muted px-2 py-0.5 font-mono text-[10px] text-ll-text-faint">
            <IconLock size={12} /> read-only
          </span>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-ll-border px-4 py-2.5">
        <FilterChip active>Last 7 days</FilterChip>
        <FilterChip>All actors</FilterChip>
        <FilterChip>All actions</FilterChip>
      </div>

      <div className="mb-0 grid grid-cols-[130px_120px_110px_1fr_90px] gap-2 border-b border-ll-border px-4 py-2 text-[10px] uppercase tracking-wider text-ll-text-faint">
        <span>Timestamp</span>
        <span>Actor</span>
        <span>Action</span>
        <span>Detail</span>
        <span>IP</span>
      </div>

      {entries.map((entry) => (
        <div
          key={entry.id}
          className="grid grid-cols-[130px_120px_110px_1fr_90px] items-center gap-2 border-b border-[#141a1e] px-4 py-2.5"
        >
          <span className="font-mono text-[11px] text-ll-text-faint">
            {new Date(entry.timestamp).toLocaleString()}
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium ${avatarColor(entry.actor_email)}`}
            >
              {entry.actor_initials}
            </div>
            <span className="truncate text-xs text-[#7a9aaa]">
              {entry.actor_email.split("@")[0]}
            </span>
          </div>
          <span
            className={`w-fit rounded px-1.5 py-0.5 font-mono text-[10px] ${actionStyles[entry.action]}`}
          >
            {entry.action}
          </span>
          <span className="truncate font-mono text-[11px] text-[#5a7080]">
            {entry.detail}
          </span>
          <span className="font-mono text-[11px] text-[#2a3a44]">{entry.ip}</span>
        </div>
      ))}

      <div className="flex items-center gap-2 border-t border-ll-border px-4 py-2.5">
        <IconLock size={14} className="text-ll-text-faint" />
        <span className="text-[11px] text-ll-text-faint">
          Records are append-only. Mock data shown until audit read API is available.
        </span>
      </div>
    </div>
  );
}
