"use client";

import * as React from "react";
import * as DialogP from "@radix-ui/react-dialog";
import * as TabsP from "@radix-ui/react-tabs";
import * as TooltipP from "@radix-ui/react-tooltip";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
<<<<<<< HEAD
import { ChevronLeft, ChevronRight, Inbox, Loader2, X } from "lucide-react";
=======
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, Loader2, X } from "lucide-react";
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
import { cn } from "@/lib/utils";

/* ---------- Button ---------- */
const buttonVariants = cva(
<<<<<<< HEAD
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-navy text-white hover:bg-navy-hover",
        secondary: "border border-line bg-white text-navy hover:bg-navy-tint",
        ghost: "text-navy hover:bg-navy-tint",
        danger: "bg-danger text-white hover:bg-[#a51f1f]",
        success: "bg-success text-white hover:bg-[#0f6d06]",
      },
      size: { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" },
=======
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-sm transition-all duration-150 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary: "bg-navy text-white shadow-sm hover:bg-[#082B63] focus-visible:ring-2 focus-visible:ring-navy/30",
        secondary: "border border-line bg-white text-navy shadow-sm hover:bg-navy-light hover:border-navy/30",
        ghost: "text-navy hover:bg-navy-light",
        danger: "bg-danger text-white shadow-sm hover:bg-[#A51F1F] focus-visible:ring-2 focus-visible:ring-danger/30",
        success: "bg-success text-white shadow-sm hover:bg-[#0F6D06] focus-visible:ring-2 focus-visible:ring-success/30",
        outline: "border border-line bg-transparent text-ink hover:bg-page hover:border-navy/40",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm font-semibold",
        xl: "h-12 px-6 text-base font-semibold",
        icon: "h-9 w-9 p-0",
      },
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);
<<<<<<< HEAD
=======

>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}
<<<<<<< HEAD
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, loading, children, disabled, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
});
=======

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-current" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
Button.displayName = "Button";

/* ---------- Card ---------- */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
<<<<<<< HEAD
  return <section className={cn("rounded border border-line bg-white shadow-card", className)} {...p} />;
}
export function CardHeader({ title, description, action, className }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
=======
  return (
    <section
      className={cn(
        "rounded-xl border border-line bg-white shadow-card transition-shadow duration-150 hover:shadow-elevated",
        className
      )}
      {...p}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4", className)}>
      <div>
        <h2 className="card-title">{title}</h2>
<<<<<<< HEAD
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
=======
        {description && <p className="mt-0.5 text-xs text-muted leading-relaxed">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
export function CardBody({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...p} />;
}

<<<<<<< HEAD
/* ---------- Badges (same semantics everywhere) ---------- */
type Tone = "green" | "amber" | "red" | "navy" | "grey";
const toneCls: Record<Tone, string> = {
  green: "bg-[#E7F4E4] text-[#0E6106] border-[#B9DDB1]",
  amber: "bg-[#FFF6D9] text-[#7A5A00] border-[#F0D98A]",
  red: "bg-[#FDECEC] text-[#9E1C1C] border-[#F3B9B9]",
  navy: "bg-navy-tint text-navy border-[#C5D3EE]",
  grey: "bg-page text-muted border-line",
};
export function Badge({ tone = "navy", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", toneCls[tone], className)}>{children}</span>;
}

const STATUS_TONE: Record<string, Tone> = {
  green: "green", compliant: "green", verified: "green", approved: "green", active: "green", completed: "green", resolved: "green", committed: "green", graduated: "navy",
  amber: "amber", pending: "amber", requested: "amber", released: "amber", submitted: "amber", draft: "grey", acknowledged: "navy", medium: "amber", near: "amber", open: "amber",
  red: "red", breach: "red", flagged: "red", revoked: "red", rejected: "red", expired: "grey", high: "red", dropped: "grey", transferred: "grey", error: "red", overridden: "grey",
  low: "navy", info: "navy", "institution-fixed": "navy", "aicte-approved": "green", "under review": "navy",
};
const BADGE_LABEL: Record<string, string> = { green: "Compliant", amber: "Needs Attention", red: "Non-Compliant" };
export function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const s = String(status ?? "").toLowerCase();
  return <Badge tone={STATUS_TONE[s] ?? "navy"}>{label ?? BADGE_LABEL[s] ?? (s ? s.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "—")}</Badge>;
}
export function SeverityBadge({ severity }: { severity: string }) {
  return <StatusBadge status={severity} label={severity === "high" ? "High" : severity === "medium" ? "Medium" : "Low"} />;
=======
/* ---------- Badges & Status ---------- */
export type Tone = "green" | "amber" | "red" | "navy" | "grey";

const toneCls: Record<Tone, string> = {
  green: "bg-[#EAF7EF] text-[#0E6106] border-[#B9DDB1]",
  amber: "bg-[#FFF5E8] text-[#9A6200] border-[#F0D98A]",
  red: "bg-[#FDECEC] text-[#9E1C1C] border-[#F3B9B9]",
  navy: "bg-[#E8EEF9] text-[#0B3D91] border-[#C5D3EE]",
  grey: "bg-[#F5F8FC] text-[#64748B] border-[#DCE5F0]",
};

export function Badge({
  tone = "navy",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors",
        toneCls[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  green: "green",
  compliant: "green",
  verified: "green",
  approved: "green",
  active: "green",
  completed: "green",
  resolved: "green",
  committed: "green",
  graduated: "navy",
  amber: "amber",
  pending: "amber",
  requested: "amber",
  released: "amber",
  submitted: "amber",
  draft: "grey",
  acknowledged: "navy",
  medium: "amber",
  near: "amber",
  open: "amber",
  red: "red",
  breach: "red",
  flagged: "red",
  revoked: "red",
  rejected: "red",
  expired: "grey",
  high: "red",
  dropped: "grey",
  transferred: "grey",
  error: "red",
  overridden: "grey",
  low: "navy",
  info: "navy",
  "institution-fixed": "navy",
  "aicte-approved": "green",
  "under review": "navy",
};

const BADGE_LABEL: Record<string, string> = {
  green: "Compliant",
  amber: "Needs Attention",
  red: "Non-Compliant",
};

export function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const s = String(status ?? "").toLowerCase();
  const tone = STATUS_TONE[s] ?? "navy";
  return (
    <Badge tone={tone}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "green" && "bg-[#138808]",
          tone === "amber" && "bg-[#D97706]",
          tone === "red" && "bg-[#C62828]",
          tone === "navy" && "bg-[#0B3D91]",
          tone === "grey" && "bg-[#94A3B8]"
        )}
        aria-hidden
      />
      {label ?? BADGE_LABEL[s] ?? (s ? s.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "—")}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <StatusBadge
      status={severity}
      label={severity === "high" ? "High" : severity === "medium" ? "Medium" : "Low"}
    />
  );
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
}

/* ---------- Feedback states ---------- */
export function Skeleton({ className }: { className?: string }) {
<<<<<<< HEAD
  return <div className={cn("animate-pulse rounded bg-[#E9EDF2]", className)} aria-hidden />;
}
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-5" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
=======
  return <div className={cn("animate-pulse rounded-lg bg-[#E9EDF5]", className)} aria-hidden />;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
      ))}
    </div>
  );
}
<<<<<<< HEAD
export function EmptyState({ title, body, action, icon }: { title: string; body?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-navy-tint p-3 text-navy">{icon ?? <Inbox className="h-6 w-6" aria-hidden />}</div>
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-md text-sm text-muted">{body}</p>}
=======

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-light text-navy border border-navy/15">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden />}
      </div>
      <p className="font-semibold text-base text-ink">{title}</p>
      {body && <p className="mt-1 max-w-md text-xs text-muted leading-relaxed">{body}</p>}
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
<<<<<<< HEAD
export function ErrorNote({ error }: { error?: Error | null }) {
  if (!error) return null;
  return <div role="alert" className="m-5 rounded border border-[#F3B9B9] bg-[#FDECEC] px-4 py-3 text-sm text-[#9E1C1C]">{error.message}</div>;
=======

export function ErrorNote({ error }: { error?: Error | null }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="m-5 flex items-start gap-2.5 rounded-lg border border-[#F3B9B9] bg-[#FDECEC] px-4 py-3 text-sm text-[#9E1C1C]"
    >
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="font-semibold text-xs uppercase tracking-wider">System Notice</p>
        <p className="mt-0.5 text-sm">{error.message}</p>
      </div>
    </div>
  );
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
}

/* ---------- Progress & KPI ---------- */
export function Progress({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  const color = pct >= 100 ? "bg-danger" : pct >= 90 ? "bg-warning" : "bg-success";
  return (
<<<<<<< HEAD
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E9EDF2]" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
export function Kpi({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "danger" | "warning" | "success" }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-1 text-[1.75rem] font-semibold leading-9", tone === "danger" && "text-danger", tone === "warning" && "text-[#7A5A00]", tone === "success" && "text-success")}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
=======
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-[#E9EDF5]"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className={cn("h-full rounded-full transition-all duration-300", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "danger" | "warning" | "success";
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-4 transition-all hover:border-navy/30">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
        {icon && <div className="text-muted">{icon}</div>}
      </div>
      <p
        className={cn(
          "mt-1.5 text-[1.75rem] font-bold leading-none tracking-tight text-ink",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-[#9A6200]",
          tone === "success" && "text-success"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
    </Card>
  );
}

<<<<<<< HEAD
export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
=======
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
<<<<<<< HEAD
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
=======
        {description && <p className="mt-1 text-xs text-muted leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
    </div>
  );
}

/* ---------- Form controls ---------- */
<<<<<<< HEAD
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn("input", className)} {...p} />
));
Input.displayName = "Input";
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...p }, ref) => (
  <select ref={ref} className={cn("input pr-8", className)} {...p}>
    {children}
  </select>
));
Select.displayName = "Select";
export function Field({ label, htmlFor, hint, error, children, className }: { label: string; htmlFor: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
=======
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} className={cn("input", className)} {...p} />
);
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...p }, ref) => (
    <select ref={ref} className={cn("input pr-8", className)} {...p}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
<<<<<<< HEAD
      {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
=======
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-danger" role="alert">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden /> {error}
        </p>
      )}
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
    </div>
  );
}

/* ---------- Tabs ---------- */
export const Tabs = TabsP.Root;
export function TabsList({ className, ...p }: TabsP.TabsListProps) {
  return <TabsP.List className={cn("mb-4 flex flex-wrap gap-1 border-b border-line", className)} {...p} />;
}
export function Tab({ className, ...p }: TabsP.TabsTriggerProps) {
  return (
    <TabsP.Trigger
<<<<<<< HEAD
      className={cn("-mb-px border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted hover:text-navy data-[state=active]:border-navy data-[state=active]:text-navy", className)}
=======
      className={cn(
        "-mb-px border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-navy data-[state=active]:border-navy data-[state=active]:font-semibold data-[state=active]:text-navy",
        className
      )}
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
      {...p}
    />
  );
}
export const TabPanel = TabsP.Content;

/* ---------- Tooltip ---------- */
export function Tip({ content, children }: { content: React.ReactNode; children: React.ReactNode }) {
  return (
    <TooltipP.Provider delayDuration={150}>
      <TooltipP.Root>
        <TooltipP.Trigger asChild>{children}</TooltipP.Trigger>
        <TooltipP.Portal>
<<<<<<< HEAD
          <TooltipP.Content sideOffset={6} className="z-50 max-w-xs rounded bg-ink px-3 py-2 text-xs text-white shadow-lg">
            {content}
            <TooltipP.Arrow className="fill-ink" />
=======
          <TooltipP.Content
            sideOffset={6}
            className="z-50 max-w-xs rounded-lg bg-[#082B63] px-3 py-2 text-xs text-white shadow-dropdown animate-in fade-in-0 zoom-in-95"
          >
            {content}
            <TooltipP.Arrow className="fill-[#082B63]" />
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
          </TooltipP.Content>
        </TooltipP.Portal>
      </TooltipP.Root>
    </TooltipP.Provider>
  );
}

/* ---------- Dialogs ---------- */
<<<<<<< HEAD
export function Dialog({ open, onOpenChange, title, description, children, wide }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <DialogP.Root open={open} onOpenChange={onOpenChange}>
      <DialogP.Portal>
        <DialogP.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <DialogP.Content className={cn("fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded border border-line bg-white shadow-xl", wide ? "max-w-3xl" : "max-w-lg")}>
          <div className="flex items-start justify-between border-b border-line px-5 py-4">
            <div>
              <DialogP.Title className="card-title">{title}</DialogP.Title>
              {description ? <DialogP.Description className="mt-0.5 text-sm text-muted">{description}</DialogP.Description> : <DialogP.Description className="sr-only">{title}</DialogP.Description>}
            </div>
            <DialogP.Close className="rounded p-1 text-muted hover:bg-page" aria-label="Close">
              <X className="h-5 w-5" />
            </DialogP.Close>
          </div>
          <div className="p-5">{children}</div>
=======
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <DialogP.Root open={open} onOpenChange={onOpenChange}>
      <DialogP.Portal>
        <DialogP.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity" />
        <DialogP.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-white shadow-modal",
            wide ? "max-w-3xl" : "max-w-lg"
          )}
        >
          <div className="flex items-start justify-between border-b border-line px-6 py-4">
            <div>
              <DialogP.Title className="card-title">{title}</DialogP.Title>
              {description ? (
                <DialogP.Description className="mt-0.5 text-xs text-muted">{description}</DialogP.Description>
              ) : (
                <DialogP.Description className="sr-only">{title}</DialogP.Description>
              )}
            </div>
            <DialogP.Close className="rounded-lg p-1.5 text-muted hover:bg-page hover:text-ink transition-colors" aria-label="Close">
              <X className="h-5 w-5" />
            </DialogP.Close>
          </div>
          <div className="p-6">{children}</div>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
        </DialogP.Content>
      </DialogP.Portal>
    </DialogP.Root>
  );
}

<<<<<<< HEAD
export function ConfirmDialog({ open, onOpenChange, title, body, confirmLabel = "Confirm", danger, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; body: React.ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => Promise<void> | void }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title}>
      <div className="text-sm text-ink">{body}</div>
      <div className="mt-6 flex justify-end gap-2">
=======
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title}>
      <div className="text-sm text-ink leading-relaxed">{body}</div>
      <div className="mt-6 flex justify-end gap-2.5">
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onOpenChange(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

/* ---------- Table helpers ---------- */
export function Table({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
<<<<<<< HEAD
    <div className="overflow-x-auto">
=======
    <div className="overflow-x-auto rounded-lg">
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}
<<<<<<< HEAD
export function Pagination({ page, limit, total, onPage }: { page: number; limit: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-muted">
      <span>
        {total === 0 ? "No records" : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total.toLocaleString("en-IN")}`}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2">
          {page} / {pages}
        </span>
        <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
=======

export function Pagination({
  page,
  limit,
  total,
  onPage,
}: {
  page: number;
  limit: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
      <span>
        {total === 0
          ? "No records"
          : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total.toLocaleString("en-IN")}`}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 font-medium text-ink">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
<<<<<<< HEAD
=======

/* ---------- Step Timeline Component ---------- */
export function StepTimeline({
  steps,
  currentStep,
}: {
  steps: { label: string; description?: string }[];
  currentStep?: number;
}) {
  return (
    <div className="w-full py-2">
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((s, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep ? stepNum < currentStep : false;
          const isCurrent = currentStep === stepNum;
          return (
            <li
              key={s.label}
              className={cn(
                "relative rounded-xl border p-4 transition-all duration-150",
                isCurrent
                  ? "border-navy bg-navy-light/60 shadow-sm ring-1 ring-navy"
                  : isDone
                  ? "border-line bg-white text-ink"
                  : "border-line/80 bg-white/70 text-muted"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isDone
                      ? "bg-success text-white"
                      : isCurrent
                      ? "bg-navy text-white"
                      : "bg-[#E9EDF5] text-muted"
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : stepNum}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-saffron">
                  Step {stepNum}
                </span>
              </div>
              <p className="font-semibold text-sm text-ink">{s.label}</p>
              {s.description && <p className="mt-1 text-xs text-muted leading-relaxed">{s.description}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
