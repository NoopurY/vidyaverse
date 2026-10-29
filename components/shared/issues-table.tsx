"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, ConfirmDialog, EmptyState, SeverityBadge, Table, Tip } from "../ui";
import { api } from "@/lib/fetcher";
import { ISSUE_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";
import type { IssueRow } from "./types";

/** Validation issues / flags with fix hints; AICTE can override, institutions can mark resolved */
export function IssuesTable({ items, showInstitution, canResolve, canOverride, onChange }: { items: IssueRow[]; showInstitution?: boolean; canResolve?: boolean; canOverride?: boolean; onChange?: () => void }) {
  const [confirm, setConfirm] = useState<{ id: string; action: "resolve" | "override" } | null>(null);
  if (!items.length) return <EmptyState title="No open issues" body="Validation issues and fraud flags will appear here with plain-language fix hints." />;
  return (
    <>
      <Table caption="Validation issues">
        <thead>
          <tr>
            {["Severity", "Type", ...(showInstitution ? ["Institution"] : []), "Student", "Details", "How to fix", "Raised", ""].map((h) => <th key={h} className="th">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i._id} className={i.severity === "high" ? "flagged-row" : undefined}>
              <td className="td"><SeverityBadge severity={i.severity} /></td>
              <td className="td whitespace-nowrap font-medium">
                {i.severity === "high" ? (
                  <Tip content={i.details}><span tabIndex={0}>{ISSUE_LABEL[i.type] ?? i.type}</span></Tip>
                ) : (
                  ISSUE_LABEL[i.type] ?? i.type
                )}
              </td>
              {showInstitution && <td className="td">{i.institutionName}</td>}
              <td className="td">
                <span className="font-mono text-xs">{i.studentApaar ?? "—"}</span>
                {i.meta?.name && <span className="block text-xs text-muted">{i.meta.name}</span>}
                {i.rowNumber && <span className="block text-xs text-muted">Row {i.rowNumber}</span>}
              </td>
              <td className="td max-w-xs">{i.details}</td>
              <td className="td max-w-xs text-xs text-muted">{i.fixHint}</td>
              <td className="td whitespace-nowrap text-xs text-muted">{fmtDate(i.createdAt)}</td>
              <td className="td whitespace-nowrap">
                {canResolve && (
                  <Button size="sm" variant="ghost" onClick={() => setConfirm({ id: i._id, action: "resolve" })}>Resolve</Button>
                )}
                {canOverride && (
                  <Button size="sm" variant="ghost" onClick={() => setConfirm({ id: i._id, action: "override" })}>Override</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.action === "override" ? "Override this flag?" : "Mark as resolved?"}
        body={confirm?.action === "override" ? "The flag will be closed as a false positive. This action is recorded in the audit log." : "Confirm the underlying data has been corrected. This action is recorded in the audit log."}
        confirmLabel={confirm?.action === "override" ? "Override" : "Resolve"}
        danger={confirm?.action === "override"}
        onConfirm={async () => {
          try {
            await api(`/api/v1/issues/${confirm!.id}`, "PATCH", { action: confirm!.action });
            toast.success("Issue updated");
            onChange?.();
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </>
  );
}
