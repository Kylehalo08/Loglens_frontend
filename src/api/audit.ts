import type { AuditEntry } from "@/types/api";

// Mock audit data until FR18 read API is available (see frontend.md)
export const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: "1",
    timestamp: new Date().toISOString(),
    actor_email: "owner@loglens.dev",
    actor_initials: "OL",
    action: "login",
    detail: "signed in via email/password",
    ip: "103.21.58.4",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actor_email: "owner@loglens.dev",
    actor_initials: "OL",
    action: "key.create",
    detail: "generated key Production for payment-svc",
    ip: "103.21.58.4",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    actor_email: "admin@loglens.dev",
    actor_initials: "AD",
    action: "member.invite",
    detail: "invited teammate@company.com as developer",
    ip: "49.36.112.8",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    actor_email: "owner@loglens.dev",
    actor_initials: "OL",
    action: "key.revoke",
    detail: "revoked key CI pipeline on payment-svc",
    ip: "103.21.58.4",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    actor_email: "dev@loglens.dev",
    actor_initials: "DV",
    action: "service.create",
    detail: "created service notif-svc",
    ip: "122.177.9.21",
  },
];

export function listAuditEntries(): AuditEntry[] {
  return MOCK_AUDIT_ENTRIES;
}
