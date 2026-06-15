import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPlus } from "@tabler/icons-react";
import {
  createService,
  deleteService,
  listServices,
} from "@/api/services";
import { useAuthStore } from "@/stores/authStore";
import {
  Button,
  EmptyState,
  Input,
  Label,
  LoadingState,
  Modal,
  PageTopbar,
} from "@/components/ui";
import { ApiClientError } from "@/api/client";

export function ServicesPage() {
  const { orgId = "" } = useParams();
  const role = useAuthStore((s) => s.currentOrg?.role);
  const canEdit = role === "owner" || role === "admin" || role === "developer";
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => listServices(orgId),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createService(orgId, name.trim(), description.trim() || undefined);
      qc.invalidateQueries({ queryKey: ["services", orgId] });
      setShowCreate(false);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to create");
    }
  };

  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Delete service "${serviceName}"?`)) return;
    await deleteService(orgId, serviceId);
    qc.invalidateQueries({ queryKey: ["services", orgId] });
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <PageTopbar
        title="Services"
        subtitle="Manage applications that send logs to LogLens"
        right={
          canEdit ? (
            <Button variant="accent" onClick={() => setShowCreate(true)}>
              <IconPlus size={14} /> New service
            </Button>
          ) : undefined
        }
      />

      {services.length === 0 ? (
        <EmptyState
          title="No services yet"
          subtitle={canEdit ? "Create a service to get an API key" : undefined}
        />
      ) : (
        <div className="divide-y divide-[#141a1e]">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-ll-elevated"
            >
              <Link
                to={`/org/${orgId}/services/${svc.id}`}
                className="flex-1 min-w-0"
              >
                <div className="text-sm font-medium text-ll-text">{svc.name}</div>
                {svc.description && (
                  <div className="mt-0.5 truncate text-xs text-ll-text-dim">
                    {svc.description}
                  </div>
                )}
                {svc.active_api_keys_count !== undefined && (
                  <div className="mt-1 font-mono text-[10px] text-ll-text-faint">
                    {svc.active_api_keys_count} active API keys
                  </div>
                )}
              </Link>
              {canEdit && (
                <Button
                  variant="danger"
                  className="ml-3 shrink-0"
                  onClick={() => handleDelete(svc.id, svc.name)}
                >
                  Delete
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create service"
        subtitle="Each service gets its own API keys for log ingestion"
      >
        <form onSubmit={handleCreate}>
          <div className="mb-3">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Payment Service"
              required
            />
          </div>
          <div className="mb-3">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Handles checkout and refunds"
            />
          </div>
          {error && <p className="mb-2 text-xs text-ll-error">{error}</p>}
          <Button type="submit" className="w-full">
            Create service
          </Button>
        </form>
      </Modal>
    </div>
  );
}
