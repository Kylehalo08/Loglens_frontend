import { getApiBase } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { ApiResponse } from "@/types/api";

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

type RequestOptions = RequestInit & { skipAuth?: boolean };

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${getApiBase()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const json = (await res.json()) as ApiResponse<{
      access_token: string;
      refresh_token: string;
    }>;
    if (!res.ok || !json.success) {
      clearAuth();
      return false;
    }
    setTokens(json.data.access_token, json.data.refresh_token);
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, headers: customHeaders, ...rest } = options;
  const { accessToken } = useAuthStore.getState();

  const headers = new Headers(customHeaders);
  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const url = path.startsWith("http") ? path : `${getApiBase()}${path}`;
  let res = await fetch(url, { ...rest, headers });

  if (res.status === 401 && !skipAuth) {
    if (!refreshPromise) refreshPromise = refreshTokens();
    const ok = await refreshPromise;
    refreshPromise = null;
    if (ok) {
      const newToken = useAuthStore.getState().accessToken;
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, { ...rest, headers });
    }
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new ApiClientError(json.error || "Request failed", res.status);
  }
  return json.data;
}
