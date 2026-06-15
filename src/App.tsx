import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listOrgs } from "@/api/orgs";
import { useAuthStore } from "@/stores/authStore";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui";
import { AuthPage } from "@/pages/AuthPage";
import { OrgPickerPage } from "@/pages/OrgPickerPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SearchPage } from "@/pages/SearchPage";
import { LiveFeedPage } from "@/pages/LiveFeedPage";
import { InvestigatePage } from "@/pages/InvestigatePage";
import { ServicesPage } from "@/pages/ServicesPage";
import { ServiceDetailPage } from "@/pages/ServiceDetailPage";
import { MembersPage } from "@/pages/MembersPage";
import { LogDetailPage } from "@/pages/LogDetailPage";
import { AuditLogPage } from "@/pages/AuditLogPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OrgLayout() {
  const { orgId = "" } = useParams();
  const currentOrg = useAuthStore((s) => s.currentOrg);
  const setCurrentOrg = useAuthStore((s) => s.setCurrentOrg);

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: listOrgs,
  });

  useEffect(() => {
    if (!orgs) return;
    const match = orgs.find((o) => o.id === orgId);
    if (match) setCurrentOrg(match);
  }, [orgs, orgId, setCurrentOrg]);

  if (isLoading) return <LoadingState />;
  if (!currentOrg || currentOrg.id !== orgId) {
    return <Navigate to="/orgs" replace />;
  }

  return <AppShell />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/orgs"
        element={
          <RequireAuth>
            <OrgPickerPage />
          </RequireAuth>
        }
      />
      <Route
        path="/org/:orgId"
        element={
          <RequireAuth>
            <OrgLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="logs/:logId" element={<LogDetailPage />} />
        <Route path="live" element={<LiveFeedPage />} />
        <Route path="investigate" element={<InvestigatePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:serviceId" element={<ServiceDetailPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="audit" element={<AuditLogPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/orgs" replace />} />
      <Route path="*" element={<Navigate to="/orgs" replace />} />
    </Routes>
  );
}
