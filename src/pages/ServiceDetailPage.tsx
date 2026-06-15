import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPencil, IconPlus } from "@tabler/icons-react";
import {
  createApiKey,
  getService,
  listApiKeys,
  revokeApiKey,
  rotateApiKey,
  updateService,
} from "@/api/services";
import { useAuthStore } from "@/stores/authStore";
import {
  Button,
  CopyButton,
  Input,
  Label,
  LoadingState,
  Modal,
  PageTopbar,
} from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import { saveTestApiKey } from "@/lib/testKeyStorage";
import { SdkSetupPanel } from "@/components/services/SdkSetupPanel";
import { ApiClientError } from "@/api/client";

type Tab = "keys" | "sdk" | "settings";

export function ServiceDetailPage() {
  const { orgId = "", serviceId = "" } = useParams();
  const role = useAuthStore((s) => s.currentOrg?.role);
  const canEdit = role === "owner" || role === "admin" || role === "developer";
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("keys");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  const { data: service, isLoading } = useQuery({
    queryKey: ["service", orgId, serviceId],
    queryFn: () => getService(orgId, serviceId),
  });

  const { data: keys = [] } = useQuery({
    queryKey: ["api-keys", orgId, serviceId],
    queryFn: () => listApiKeys(orgId, serviceId),
    enabled: canEdit,
  });

  useEffect(() => {
    if (service) {
      setEditName(service.name);
      setEditDescription(service.description ?? "");
    }
  }, [service]);

  const handleGenerate = async () => {
    setError("");
    try {
      const result = await createApiKey(
        orgId,
        serviceId,
        newKeyLabel.trim() || undefined,
      );
      setRevealedKey(result.api_key);
      saveTestApiKey(serviceId, result.api_key);
      setShowGenerate(false);
      setNewKeyLabel("");
      qc.invalidateQueries({ queryKey: ["api-keys", orgId, serviceId] });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed");
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Revoke this API key immediately?")) return;
    await revokeApiKey(orgId, serviceId, keyId);
    qc.invalidateQueries({ queryKey: ["api-keys", orgId, serviceId] });
  };

  const handleRotate = async (keyId: string) => {
    const result = await rotateApiKey(orgId, serviceId, keyId);
    setRevealedKey(result.api_key);
    saveTestApiKey(serviceId, result.api_key);
    qc.invalidateQueries({ queryKey: ["api-keys", orgId, serviceId] });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess(false);
    setEditSaving(true);
    try {
      await updateService(orgId, serviceId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ["service", orgId, serviceId] });
      qc.invalidateQueries({ queryKey: ["services", orgId] });
      setEditSuccess(true);
    } catch (err) {
      setEditError(err instanceof ApiClientError ? err.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  if (isLoading || !service) return <LoadingState />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "keys", label: "API keys" },
    { id: "sdk", label: "SDK setup" },
    ...(canEdit ? [{ id: "settings" as Tab, label: "Settings" }] : []),
  ];

  return (
    <div>
      <PageTopbar
        title={service.name}
        subtitle={service.description ?? "Service details"}
        right={
          <Link
            to={`/org/${orgId}/services`}
            className="text-xs text-ll-text-muted hover:text-ll-text"
          >
            ← All services
          </Link>
        }
      />

      <div className="flex border-b border-ll-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs border-b-2 transition-colors ${
              tab === t.id
                ? "border-ll-accent text-ll-accent bg-[#0d1a14]"
                : "border-transparent text-ll-text-dim hover:text-ll-text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "keys" && (
        <>
          {canEdit ? (
            <>
              <div className="flex items-center justify-between border-b border-ll-border px-4 py-3">
                <div className="text-[11px] text-ll-text-dim">
                  Keys authenticate log ingestion from your application
                </div>
                <Button variant="accent" onClick={() => setShowGenerate(true)}>
                  <IconPlus size={14} /> Generate key
                </Button>
              </div>

              <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_100px] gap-2 border-b border-ll-border px-4 py-2 text-[10px] uppercase tracking-wider text-ll-text-faint">
                <span>Name</span>
                <span>Created</span>
                <span>Last used</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {keys.map((key) => (
                <div
                  key={key.id}
                  className="grid grid-cols-[1.4fr_1fr_1fr_1fr_100px] items-center gap-2 border-b border-[#141a1e] px-4 py-2.5 text-xs"
                >
                  <div>
                    <div className="font-medium text-ll-text">
                      {key.label || "Unnamed"}
                    </div>
                    <div className="font-mono text-[11px] text-ll-text-faint">
                      {key.prefix}••••••••
                    </div>
                  </div>
                  <span className="font-mono text-ll-text-muted">
                    {new Date(key.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-mono text-ll-text-dim">
                    {key.last_used_at ? formatRelative(key.last_used_at) : "—"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        key.revoked_at ? "bg-[#3a4a55]" : "bg-ll-accent"
                      }`}
                    />
                    <span
                      className={`text-[11px] ${
                        key.revoked_at ? "text-ll-text-faint" : "text-[#00c97e]"
                      }`}
                    >
                      {key.revoked_at ? "revoked" : "active"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {!key.revoked_at && (
                      <>
                        <Button
                          variant="danger"
                          className="py-1 px-2"
                          onClick={() => handleRevoke(key.id)}
                        >
                          Revoke
                        </Button>
                        <Button
                          variant="ghost"
                          className="py-1 px-2"
                          onClick={() => handleRotate(key.id)}
                        >
                          Rotate
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="p-8 text-center text-xs text-ll-text-dim">
              Viewers cannot manage API keys
            </div>
          )}
        </>
      )}

      {tab === "sdk" && (
        <SdkSetupPanel
          serviceName={service.name}
          orgId={orgId}
          serviceId={serviceId}
          canManageKeys={canEdit}
        />
      )}

      {tab === "settings" && canEdit && (
        <form onSubmit={handleSaveSettings} className="max-w-md space-y-4 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-ll-text">
            <IconPencil size={14} className="text-ll-accent" />
            Edit service
          </div>
          <div>
            <Label>Name</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              maxLength={255}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          {editError && <p className="text-xs text-ll-error">{editError}</p>}
          {editSuccess && (
            <p className="text-xs text-[#00c97e]">Service updated</p>
          )}
          <Button type="submit" variant="accent" disabled={editSaving}>
            {editSaving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      )}

      <Modal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        title="Generate API key"
      >
        <input
          className="mb-3 w-full rounded-ll border border-ll-border bg-ll-muted px-3 py-2 text-sm text-ll-text outline-none"
          placeholder="Label (e.g. production)"
          value={newKeyLabel}
          onChange={(e) => setNewKeyLabel(e.target.value)}
        />
        {error && <p className="mb-2 text-xs text-ll-error">{error}</p>}
        <Button className="w-full" onClick={handleGenerate}>
          Generate
        </Button>
      </Modal>

      <Modal
        open={!!revealedKey}
        onClose={() => setRevealedKey(null)}
        title="New key generated"
        subtitle="Copy it now. It won't be shown again."
      >
        <div className="mb-3 flex items-center gap-2.5 rounded-ll border border-[#00FF9C33] bg-ll-muted p-3">
          <span className="flex-1 break-all font-mono text-xs text-ll-accent">
            {revealedKey}
          </span>
          {revealedKey && <CopyButton text={revealedKey} />}
        </div>
        <div className="flex items-center gap-2 rounded-md border border-[#f0a83244] bg-[#2b2010] px-2.5 py-2 text-[11px] text-ll-warn">
          Store this somewhere safe. You cannot retrieve it after closing.
        </div>
      </Modal>
    </div>
  );
}
