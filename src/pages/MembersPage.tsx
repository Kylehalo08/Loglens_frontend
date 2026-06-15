import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconMail, IconUserPlus } from "@tabler/icons-react";
import { createInviteCode, getOrg, sendInvite } from "@/api/orgs";
import { useAuthStore } from "@/stores/authStore";
import {
  Button,
  CopyButton,
  LoadingState,
  PageTopbar,
  RoleBadge,
  Select,
} from "@/components/ui";
import { avatarColor, initialsFromEmail } from "@/lib/utils";
import { ApiClientError } from "@/api/client";
import type { OrgRole } from "@/types/api";

export function MembersPage() {
  const { orgId = "" } = useParams();
  const currentOrg = useAuthStore((s) => s.currentOrg);
  const qc = useQueryClient();
  const canInvite = currentOrg?.role === "owner" || currentOrg?.role === "admin";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("developer");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: org, isLoading } = useQuery({
    queryKey: ["org", orgId],
    queryFn: () => getOrg(orgId),
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await sendInvite(orgId, email.trim(), role);
      setInviteToken(result.token);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["org", orgId] });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Invite failed");
    }
  };

  const handleInviteCode = async () => {
    const result = await createInviteCode(orgId);
    setInviteCode(result.code);
  };

  if (isLoading || !org) return <LoadingState />;

  return (
    <div>
      <PageTopbar
        title={`Members — ${org.name}`}
        subtitle={`${org.members.length} members · Owner and Admins can invite`}
        right={
          canInvite ? (
            <Button variant="accent">
              <IconUserPlus size={14} /> Invite member
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-[2fr_1.5fr_1fr_90px_60px] gap-2 border-b border-ll-border px-4 py-2 text-[10px] uppercase tracking-wider text-ll-text-faint">
        <span>Member</span>
        <span>Email</span>
        <span>Joined</span>
        <span>Role</span>
        <span />
      </div>

      {org.members.map((member) => (
        <div
          key={member.user_id}
          className="grid grid-cols-[2fr_1.5fr_1fr_90px_60px] items-center gap-2 border-b border-[#141a1e] px-4 py-2.5"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${avatarColor(member.email)}`}
            >
              {initialsFromEmail(member.email)}
            </div>
            <span className="text-sm font-medium text-ll-text">
              {member.email.split("@")[0]}
            </span>
          </div>
          <span className="truncate font-mono text-xs text-[#5a7080]">
            {member.email}
          </span>
          <span className="text-[11px] text-ll-text-dim">
            {new Date(member.joined_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <RoleBadge role={member.role} />
          <span />
        </div>
      ))}

      {canInvite && (
        <div className="border-t border-ll-border p-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-ll-text">
            <IconMail size={16} className="text-ll-accent" />
            Invite by email
          </div>
          <form onSubmit={handleInvite} className="flex flex-wrap gap-2">
            <input
              className="min-w-[200px] flex-1 rounded-md border border-ll-border bg-ll-muted px-3 py-2 text-xs text-ll-text outline-none"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
            >
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </Select>
            <Button type="submit" variant="accent">
              Send invite
            </Button>
          </form>
          {error && <p className="mt-2 text-xs text-ll-error">{error}</p>}
          {inviteToken && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-ll-text-dim">Invite token (share once):</span>
              <code className="flex-1 truncate rounded border border-ll-border bg-ll-muted px-2 py-1 font-mono text-[11px] text-ll-text-faint">
                {inviteToken}
              </code>
              <CopyButton text={inviteToken} />
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <span className="shrink-0 text-[11px] text-ll-text-dim">Or share code</span>
            {inviteCode ? (
              <>
                <code className="flex-1 rounded border border-ll-border bg-ll-muted px-2 py-1 font-mono text-[11px]">
                  {inviteCode}
                </code>
                <CopyButton text={inviteCode} />
              </>
            ) : (
              <Button variant="ghost" onClick={handleInviteCode}>
                Generate invite code
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
