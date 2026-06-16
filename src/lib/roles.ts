import type { OrgRole } from "@/types/api";

export function isDeveloperPlus(role: OrgRole | undefined): boolean {
  return role === "developer" || role === "admin" || role === "owner";
}
