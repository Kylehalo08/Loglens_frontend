import { cn } from "@/lib/utils";
import { DEMO_LIMITS_COPY } from "@/lib/apiErrors";
import type { Severity } from "@/types/api";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "accent" | "danger";
}) {
  const variants = {
    primary:
      "bg-ll-accent text-[#0A0D0F] hover:bg-[#00e88c] border-none font-medium",
    ghost:
      "bg-transparent border border-ll-border text-ll-text-muted hover:border-ll-text-faint hover:text-ll-text",
    accent:
      "bg-[#00FF9C11] border border-[#00FF9C55] text-ll-accent hover:bg-[#00FF9C22]",
    danger:
      "bg-transparent border border-[#2b1414] text-[#703030] hover:border-ll-error hover:text-ll-error",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-ll px-3 py-2 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-ll border border-ll-border bg-ll-elevated px-3 py-2.5 text-sm text-ll-text outline-none placeholder:text-ll-text-faint focus:border-[#00FF9C55]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "rounded-ll border border-ll-border bg-ll-muted px-2.5 py-2 text-xs text-[#7a9aaa] outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[11px] uppercase tracking-wider text-[#5a7080]",
        className,
      )}
    >
      {children}
    </label>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-ll-border bg-ll-elevated overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[10px] border border-ll-border bg-ll-elevated p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3.5 text-sm font-medium text-ll-text">{title}</div>
        {subtitle && (
          <div className="mb-3.5 text-xs text-ll-text-dim">{subtitle}</div>
        )}
        {children}
      </div>
    </div>
  );
}

const severityStyles: Record<Severity, string> = {
  DEBUG: "bg-ll-muted text-[#4a5e6a]",
  INFO: "bg-[#08182b] text-ll-info",
  WARN: "bg-[#2b1e08] text-ll-warn",
  ERROR: "bg-[#2b0e0e] text-ll-error",
  FATAL: "bg-[#2b0e0e] text-ll-error",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-medium",
        severityStyles[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}

const roleStyles: Record<string, string> = {
  owner: "bg-[#0d2b1f] text-ll-accent border border-[#00FF9C33]",
  admin: "bg-[#081828] text-ll-info border border-[#378ADD33]",
  developer: "bg-[#2b1e08] text-ll-warn border border-[#f0a83233]",
  viewer: "bg-[#1a1a1a] text-[#5a7080] border border-[#2a3a44]",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 font-mono text-[10px]",
        roleStyles[role] ?? roleStyles.viewer,
      )}
    >
      {role}
    </span>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1 text-[11px] text-ll-error">{message}</div>
  );
}

export function DemoLimitsNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] leading-relaxed text-ll-text-faint", className)}>
      {DEMO_LIMITS_COPY}
    </p>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-ll-text-faint">
      {label}
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-ll-text">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-ll-text-dim">{subtitle}</p>}
    </div>
  );
}

export function PageTopbar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-ll-border px-4 py-3">
      <div>
        <div className="text-sm font-medium text-ll-text">{title}</div>
        {subtitle && (
          <div className="mt-0.5 text-[11px] text-ll-text-dim">{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer transition-colors",
        active
          ? "border-[#00FF9C44] bg-[#0d2b1f] text-ll-accent"
          : "border-ll-border bg-ll-elevated text-[#7a9aaa] hover:text-ll-text",
      )}
    >
      {children}
    </button>
  );
}

export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  return (
    <Button
      variant="accent"
      className="shrink-0 py-1 px-2"
      onClick={() => navigator.clipboard.writeText(text)}
    >
      {label}
    </Button>
  );
}
