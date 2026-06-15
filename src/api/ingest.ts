import { getIngestBase } from "@/lib/utils";
import type { ApiResponse, Severity } from "@/types/api";

export interface IngestLogBody {
  message: string;
  severity: Severity;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export async function ingestLog(
  apiKey: string,
  body: IngestLogBody,
): Promise<{ id: string }> {
  const res = await fetch(`${getIngestBase()}/v1/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      message: body.message,
      severity: body.severity,
      timestamp: body.timestamp,
      metadata: body.metadata ?? {},
    }),
  });

  const json = (await res.json()) as ApiResponse<{ id: string }>;
  if (!json.success) {
    throw new Error(json.error || "Ingest failed");
  }
  return json.data;
}
