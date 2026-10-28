import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Masks PII for tables and verifier views, e.g. 9876543221 -> 98XXXXXX21 */
export function maskPhone(p?: string | null) {
  if (!p) return "—";
  const d = p.replace(/\D/g, "");
  if (d.length < 6) return "XXXX";
  return d.slice(0, 2) + "X".repeat(d.length - 4) + d.slice(-2);
}
export function maskEmail(e?: string | null) {
  if (!e) return "—";
  const [u, dom] = e.split("@");
  if (!dom) return "XXXX";
  return `${u.slice(0, 2)}${"X".repeat(Math.max(2, u.length - 2))}@${dom}`;
}
export function maskApaar(a?: string | null) {
  if (!a) return "—";
  return `${a.slice(0, 2)}XXXXXX${a.slice(-4)}`;
}
export function maskName(n?: string | null) {
  if (!n) return "—";
  return n
    .split(" ")
    .map((w) => (w.length > 1 ? w[0] + "•".repeat(Math.min(4, w.length - 1)) : w))
    .join(" ");
}

export const fmtNum = (n?: number | null) => (n ?? 0).toLocaleString("en-IN");
export const fmtPct = (n?: number | null, d = 1) => `${(n ?? 0).toFixed(d)}%`;
export function fmtDate(d?: string | Date | null, withTime = false) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function toCsv(columns: { key: string; label: string }[], rows: Record<string, unknown>[]) {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // neutralise spreadsheet formula injection
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return [columns.map((c) => esc(c.label)).join(","), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(","))].join(
    "\n"
  );
}
