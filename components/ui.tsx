"use client";

import * as React from "react";
import * as DialogP from "@radix-ui/react-dialog";
import * as TabsP from "@radix-ui/react-tabs";
import * as TooltipP from "@radix-ui/react-tooltip";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronLeft, ChevronRight, Inbox, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Button ---------- */
const buttonVariants = cva(
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
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}
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
Button.displayName = "Button";

/* ---------- Card ---------- */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("rounded border border-line bg-white shadow-card", className)} {...p} />;
}
export function CardHeader({ title, description, action, className }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4", className)}>
      <div>
        <h2 className="card-title">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function CardBody({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...p} />;
}

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
}

/* ---------- Feedback states ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-[#E9EDF2]", className)} aria-hidden />;
}
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-5" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}
export function EmptyState({ title, body, action, icon }: { title: string; body?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-navy-tint p-3 text-navy">{icon ?? <Inbox className="h-6 w-6" aria-hidden />}</div>
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function ErrorNote({ error }: { error?: Error | null }) {
  if (!error) return null;
  return <div role="alert" className="m-5 rounded border border-[#F3B9B9] bg-[#FDECEC] px-4 py-3 text-sm text-[#9E1C1C]">{error.message}</div>;
}

/* ---------- Progress & KPI ---------- */
export function Progress({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  const color = pct >= 100 ? "bg-danger" : pct >= 90 ? "bg-warning" : "bg-success";
  return (
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
    </Card>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Form controls ---------- */
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
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
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
      className={cn("-mb-px border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted hover:text-navy data-[state=active]:border-navy data-[state=active]:text-navy", className)}
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
          <TooltipP.Content sideOffset={6} className="z-50 max-w-xs rounded bg-ink px-3 py-2 text-xs text-white shadow-lg">
            {content}
            <TooltipP.Arrow className="fill-ink" />
          </TooltipP.Content>
        </TooltipP.Portal>
      </TooltipP.Root>
    </TooltipP.Provider>
  );
}

/* ---------- Dialogs ---------- */
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
        </DialogP.Content>
      </DialogP.Portal>
    </DialogP.Root>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, body, confirmLabel = "Confirm", danger, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; body: React.ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => Promise<void> | void }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title}>
      <div className="text-sm text-ink">{body}</div>
      <div className="mt-6 flex justify-end gap-2">
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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}
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
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
