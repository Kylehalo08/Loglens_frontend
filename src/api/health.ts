import { getApiBase, getIngestBase } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

async function fetchHealth(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    const json = (await res.json()) as ApiResponse<{ status: string }>;
    return res.ok && json.success && json.data.status === "ok";
  } catch {
    return false;
  }
}

export function getApiHealth() {
  return fetchHealth(`${getApiBase()}/health`);
}

export function getIngestHealth() {
  return fetchHealth(`${getIngestBase()}/health`);
}
