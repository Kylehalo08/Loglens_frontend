import { apiRequest } from "./client";
import type { AuthTokens } from "@/types/api";

export function register(email: string, password: string) {
  return apiRequest<AuthTokens>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export function login(email: string, password: string) {
  return apiRequest<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export function logout(refreshToken: string) {
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
