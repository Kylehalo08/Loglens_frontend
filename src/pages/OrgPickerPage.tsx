import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPlus } from "@tabler/icons-react";
import { createOrg, listOrgs } from "@/api/orgs";
import { useAuthStore } from "@/stores/authStore";
import { Button, Card, EmptyState, Input, Label, LoadingState } from "@/components/ui";
import { RoleBadge } from "@/components/ui";
import type { OrgSummary } from "@/types/api";
import { ApiClientError } from "@/api/client";
import { joinResultToOrgSummary, joinWithInvite } from "@/lib/orgJoin";

export function OrgPickerPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setCurrentOrg = useAuthStore((s) => s.setCurrentOrg);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: listOrgs,
  });

  const selectOrg = (org: OrgSummary) => {
    setCurrentOrg(org);
    navigate(`/org/${org.id}`);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setJoinLoading(true);
    try {
      const result = await joinWithInvite(joinCode);
      setCurrentOrg(joinResultToOrgSummary(result));
      await qc.invalidateQueries({ queryKey: ["orgs"] });
      navigate(`/org/${result.org_id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Join failed");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const org = await createOrg(newName.trim());
      setCurrentOrg(org);
      navigate(`/org/${org.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to create org");
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ll-bg p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-ll-accent" />
            <span className="font-mono text-sm tracking-wider text-ll-accent">LogLens</span>
          </div>
          <h1 className="text-lg font-medium text-ll-text">Select organization</h1>
          <p className="mt-1 text-xs text-ll-text-dim">
            Choose an org or create a new one
          </p>
        </div>

        {orgs && orgs.length > 0 && (
          <div className="mb-4 space-y-2">
            {orgs.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => selectOrg(org)}
                className="flex w-full items-center justify-between rounded-lg border border-ll-border bg-ll-elevated px-4 py-3 text-left hover:border-[#00FF9C44] transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-ll-text">{org.name}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-ll-text-faint">
                    {org.id.slice(0, 8)}…
                  </div>
                </div>
                <RoleBadge role={org.role} />
              </button>
            ))}
          </div>
        )}

        {orgs?.length === 0 && !creating && (
          <EmptyState
            title="No organizations yet"
            subtitle="Create your first org to get started"
          />
        )}

        {joining ? (
          <Card className="p-4">
            <form onSubmit={handleJoin}>
              <Label>Invite code or token</Label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="ABC123"
                autoFocus
                required
              />
              {error && <p className="mt-2 text-xs text-ll-error">{error}</p>}
              <div className="mt-3 flex gap-2">
                <Button type="submit" disabled={joinLoading}>
                  Join
                </Button>
                <Button type="button" variant="ghost" onClick={() => setJoining(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        ) : creating ? (
          <Card className="p-4">
            <form onSubmit={handleCreate}>
              <Label>Organization name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="LogLens Dev"
                autoFocus
                required
              />
              {error && <p className="mt-2 text-xs text-ll-error">{error}</p>}
              <div className="mt-3 flex gap-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              variant="accent"
              className="w-full"
              onClick={() => setCreating(true)}
            >
              <IconPlus size={14} />
              Create organization
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setJoining(true)}>
              Join with invite code
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
