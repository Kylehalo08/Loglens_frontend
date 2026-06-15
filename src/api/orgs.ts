import { apiRequest } from "./client";
import type {
  InviteCodeResult,
  InviteResult,
  JoinResult,
  OrgDetail,
  OrgSummary,
} from "@/types/api";

export function createOrg(name: string) {
  return apiRequest<OrgSummary>("/orgs", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function listOrgs() {
  return apiRequest<OrgSummary[]>("/orgs");
}

export function getOrg(id: string) {
  return apiRequest<OrgDetail>(`/orgs/${id}`);
}

export function sendInvite(orgId: string, email: string, role: string) {
  return apiRequest<InviteResult>(`/orgs/${orgId}/invites`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export function createInviteCode(orgId: string) {
  return apiRequest<InviteCodeResult>(`/orgs/${orgId}/invite-codes`, {
    method: "POST",
  });
}

export function joinByToken(token: string) {
  return apiRequest<JoinResult>("/orgs/join/token", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function joinByCode(code: string) {
  return apiRequest<JoinResult>("/orgs/join/code", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}
