import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  IconBuilding,
  IconLayoutDashboard,
  IconPlayerPlay,
  IconRobot,
  IconSearch,
  IconShield,
  IconUsers,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { HealthStatusBadge } from "@/components/layout/HealthStatusBadge";
import { listServices } from "@/api/services";
import { logout as apiLogout } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { isDeveloperPlus } from "@/lib/roles";

function NavItem({
  to,
  icon,
  children,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] mb-0.5 transition-colors",
          isActive
            ? "bg-[#1a2820] text-ll-accent"
            : "text-ll-text-muted hover:bg-ll-muted hover:text-[#a0b0bc]",
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

function ServiceDot({ index }: { index: number }) {
  const colors = ["bg-ll-accent", "bg-ll-accent", "bg-ll-warn", "bg-ll-error"];
  return (
    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", colors[index % colors.length])} />
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const { currentOrg, refreshToken, clearAuth } = useAuthStore();
  const orgId = currentOrg?.id ?? "";
  const showInvestigate = isDeveloperPlus(currentOrg?.role);

  const { data: services = [] } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => listServices(orgId),
    enabled: !!orgId,
  });

  const handleLogout = async () => {
    try {
      if (refreshToken) await apiLogout(refreshToken);
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  if (!currentOrg) return null;

  const base = `/org/${orgId}`;

  return (
    <div className="flex h-full min-h-screen bg-ll-bg">
      <aside className="flex w-[200px] shrink-0 flex-col border-r border-ll-border bg-ll-elevated">
        <div className="flex items-center gap-2 border-b border-ll-border px-4 py-4">
          <span className="h-2 w-2 rounded-full bg-ll-accent" />
          <span className="font-mono text-[13px] font-medium tracking-wider text-ll-accent">
            LogLens
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <NavItem to={base} icon={<IconLayoutDashboard size={16} />} end>
            Dashboard
          </NavItem>
          <NavItem to={`${base}/search`} icon={<IconSearch size={16} />}>
            Search
          </NavItem>
          <NavItem to={`${base}/live`} icon={<IconPlayerPlay size={16} />}>
            Live feed
          </NavItem>
          {showInvestigate && (
            <NavItem to={`${base}/investigate`} icon={<IconRobot size={16} />}>
              Investigate
            </NavItem>
          )}

          <div className="px-2.5 pb-1 pt-3 text-[10px] uppercase tracking-wider text-[#3a4a55]">
            Services
          </div>
          {services.map((svc, i) => (
            <NavLink
              key={svc.id}
              to={`${base}/services/${svc.id}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs mb-0.5",
                  isActive
                    ? "bg-ll-muted text-ll-text"
                    : "text-ll-text-muted hover:bg-ll-muted hover:text-[#a0b0bc]",
                )
              }
            >
              <ServiceDot index={i} />
              <span className="truncate">{svc.name}</span>
            </NavLink>
          ))}
          <NavLink
            to={`${base}/services`}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-ll-text-faint hover:text-ll-text-muted"
          >
            + Manage services
          </NavLink>

          <div className="px-2.5 pb-1 pt-3 text-[10px] uppercase tracking-wider text-[#3a4a55]">
            Settings
          </div>
          <NavItem to={`${base}/members`} icon={<IconUsers size={16} />}>
            Members
          </NavItem>
          <NavItem to={`${base}/audit`} icon={<IconShield size={16} />}>
            Audit log
          </NavItem>
        </nav>

        <div className="border-t border-ll-border p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left text-xs text-ll-text-faint hover:text-ll-text-muted"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ll-border px-5 py-3.5">
          <div />
          <div className="flex items-center gap-2.5">
            <HealthStatusBadge />
            <span className="flex items-center gap-1.5 rounded border border-[#00FF9C44] bg-[#0d2b1f] px-2 py-0.5 font-mono text-[11px] text-ll-accent">
              <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-ll-accent" />
              live
            </span>
            <button
              type="button"
              onClick={() => navigate("/orgs")}
              className="flex items-center gap-1.5 rounded-md border border-ll-border bg-ll-muted px-2.5 py-1 text-xs text-ll-text-muted"
            >
              <IconBuilding size={13} />
              {currentOrg.name}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
