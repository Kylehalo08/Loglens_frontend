import { apiRequest } from "./client";
import type { APIKeyMeta, CreateAPIKeyResult, Service } from "@/types/api";

export function listServices(orgId: string) {
  return apiRequest<Service[]>(`/orgs/${orgId}/services`);
}

export function getService(orgId: string, serviceId: string) {
  return apiRequest<Service>(`/orgs/${orgId}/services/${serviceId}`);
}

export function createService(orgId: string, name: string, description?: string) {
  return apiRequest<Service>(`/orgs/${orgId}/services`, {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export function updateService(
  orgId: string,
  serviceId: string,
  data: { name?: string; description?: string },
) {
  return apiRequest<Service>(`/orgs/${orgId}/services/${serviceId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteService(orgId: string, serviceId: string) {
  return apiRequest<{ message: string }>(`/orgs/${orgId}/services/${serviceId}`, {
    method: "DELETE",
  });
}

export function listApiKeys(orgId: string, serviceId: string) {
  return apiRequest<APIKeyMeta[]>(
    `/orgs/${orgId}/services/${serviceId}/api-keys`,
  );
}

export function createApiKey(orgId: string, serviceId: string, label?: string) {
  return apiRequest<CreateAPIKeyResult>(
    `/orgs/${orgId}/services/${serviceId}/api-keys`,
    {
      method: "POST",
      body: JSON.stringify({ label }),
    },
  );
}

export function revokeApiKey(orgId: string, serviceId: string, keyId: string) {
  return apiRequest<APIKeyMeta>(
    `/orgs/${orgId}/services/${serviceId}/api-keys/${keyId}`,
    { method: "DELETE" },
  );
}

export function rotateApiKey(orgId: string, serviceId: string, keyId: string) {
  return apiRequest<CreateAPIKeyResult>(
    `/orgs/${orgId}/services/${serviceId}/api-keys/${keyId}/rotate`,
    { method: "POST" },
  );
}
