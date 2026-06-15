import { joinByCode, joinByToken } from "@/api/orgs";
import type { JoinResult, OrgSummary } from "@/types/api";

export function isInviteToken(value: string): boolean {
  return value.trim().length > 10;
}

export function joinResultToOrgSummary(result: JoinResult): OrgSummary {
  return {
    id: result.org_id,
    name: result.org_name,
    role: result.role,
    created_at: result.joined_at,
  };
}

export function joinWithInvite(invite: string) {
  const trimmed = invite.trim();
  return isInviteToken(trimmed)
    ? joinByToken(trimmed)
    : joinByCode(trimmed.toUpperCase());
}
