import { apiErrorMessage } from "@/lib/apiErrors";
import { getIngestBase } from "@/lib/utils";
import type { ApiResponse, Severity } from "@/types/api";

export interface IngestLogBody {
  message: string;
  severity: Severity;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export class IngestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "IngestError";
    this.status = status;
  }
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

  let json: ApiResponse<{ id: string }>;
  try {
    json = (await res.json()) as ApiResponse<{ id: string }>;
  } catch {
    throw new IngestError(apiErrorMessage(res.status), res.status);
  }

  if (!json.success) {
    throw new IngestError(apiErrorMessage(res.status, json.error), res.status);
  }
  return json.data;
}
