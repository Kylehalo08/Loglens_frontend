import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrgSummary } from "@/types/api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentOrg: OrgSummary | null;
  setTokens: (access: string, refresh: string) => void;
  clearAuth: () => void;
  setCurrentOrg: (org: OrgSummary | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      currentOrg: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, currentOrg: null }),
      setCurrentOrg: (currentOrg) => set({ currentOrg }),
    }),
    { name: "loglens-auth" },
  ),
);
