// API types from frontend.md

export type OrgRole = "owner" | "admin" | "developer" | "viewer";
export type Severity = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface OrgSummary {
  id: string;
  name: string;
  created_by?: string;
  created_at: string;
  role: OrgRole;
}

export interface OrgMember {
  user_id: string;
  email: string;
  role: OrgRole;
  joined_at: string;
}

export interface OrgDetail {
  id: string;
  name: string;
  created_at: string;
  members: OrgMember[];
  services_count: number;
}

export interface Service {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  active_api_keys_count?: number;
}

export interface APIKeyMeta {
  id: string;
  service_id: string;
  prefix: string;
  label?: string;
  created_at: string;
  created_by: string;
  revoked_at: string | null;
  last_used_at: string | null;
}

export interface CreateAPIKeyResult extends APIKeyMeta {
  api_key: string;
}

export interface LogEntry {
  id: string;
  org_id: string;
  service_id: string;
  timestamp: string;
  severity: Severity;
  message: string;
  metadata: Record<string, unknown>;
  ingested_at: string;
}

export interface SearchResult {
  logs: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface InviteResult {
  invite_id: string;
  email: string;
  role: OrgRole;
  expires_at: string;
  token: string;
}

export interface InviteCodeResult {
  code: string;
  org_id: string;
  default_role: OrgRole;
  is_active: boolean;
}

export interface JoinResult {
  org_id: string;
  org_name: string;
  role: OrgRole;
  joined_at: string;
}

// AI types (mock until backend ready)
export interface AIQueryResult {
  query: string;
  interpreted_filters: {
    service_ids?: string[];
    severity?: Severity[];
    from?: string;
    to?: string;
    q?: string;
  };
  logs_analyzed: number;
}

export interface AIInvestigationResult {
  root_cause: string;
  confidence: "high" | "medium" | "low";
  evidence: Array<{ title: string; detail: string }>;
  related_logs: LogEntry[];
}

export interface AISummaryResult {
  summary: string;
  log_count: number;
}

// Audit (mock until API exists)
export type AuditAction =
  | "login"
  | "login.fail"
  | "key.create"
  | "key.revoke"
  | "member.invite"
  | "member.remove"
  | "service.create"
  | "service.delete";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor_email: string;
  actor_initials: string;
  action: AuditAction;
  detail: string;
  ip: string;
}

export interface LogSearchParams {
  service_id?: string;
  severity?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  limit?: number;
}
