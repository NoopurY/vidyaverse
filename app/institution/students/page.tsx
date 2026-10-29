"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button, Card, CardHeader, Dialog, EmptyState, PageHeader, StatusBadge, Table } from "@/components/ui";
import { StudentsTable } from "@/components/shared/students-table";
import { StudentForm } from "@/components/institution/student-form";
import type { InstitutionDetail } from "@/components/shared/types";
import { api } from "@/lib/fetcher";
import { fmtDate } from "@/lib/utils";

type Grievance = { _id: string; studentApaar: string; field: string; currentValue?: string; requestedValue: string; reason: string; status: string; createdAt: string };

export default function StudentsPage() {
  const { data: session } = useSession();
  const id = session?.user?.institutionId;
  const { data } = useSWR<InstitutionDetail>(id ? `/api/v1/institutions/${id}` : null);
  const { data: grievances, mutate: refreshG } = useSWR<{ items: Grievance[] }>("/api/v1/grievances");
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const programs = data?.institution.programs ?? [];
  return (
    <>
      <PageHeader
        title="Students"
        description="Your institution's students. Contacts are masked in the list; open a record to view or edit (access is audited)."
        actions={<Button onClick={() => setOpen(true)} disabled={!programs.length}><UserPlus className="h-4 w-4" aria-hidden /> Add student</Button>}
      />
      <Card>
        <StudentsTable programs={programs} detailHref={(a) => `/institution/students/${a}`} />
      </Card>

      <Card className="mt-6">
        <CardHeader title="Correction requests from students" description="Fix the record, then mark as fixed. AICTE gives final approval." />
        {!grievances?.items.length ? (
          <EmptyState title="No correction requests" />
        ) : (
          <Table caption="Student grievances">
            <thead><tr>{["Raised", "APAAR", "Field", "Current", "Requested", "Reason", "Status", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {grievances.items.map((g) => (
                <tr key={g._id}>
                  <td className="td text-xs">{fmtDate(g.createdAt)}</td>
                  <td className="td font-mono text-xs">{g.studentApaar}</td>
                  <td className="td">{g.field}</td>
                  <td className="td">{g.currentValue ?? "—"}</td>
                  <td className="td font-medium">{g.requestedValue}</td>
                  <td className="td max-w-xs text-xs">{g.reason}</td>
                  <td className="td"><StatusBadge status={g.status} /></td>
                  <td className="td whitespace-nowrap">
                    {g.status === "open" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={async () => { try { await api(`/api/v1/grievances/${g._id}`, "PATCH", { action: "institution-fixed" }); toast.success("Marked as fixed"); refreshG(); } catch (e) { toast.error((e as Error).message); } }}>Mark fixed</Button>
                        <Button size="sm" variant="ghost" onClick={async () => { try { await api(`/api/v1/grievances/${g._id}`, "PATCH", { action: "rejected", remarks: "Record is correct as per documents" }); toast.success("Rejected"); refreshG(); } catch (e) { toast.error((e as Error).message); } }}>Reject</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen} title="Add a student" description="Validated instantly; on save a seat token is consumed from your ledger." wide>
        <StudentForm
          programs={programs}
          onDone={() => {
            setOpen(false);
            mutate((k) => typeof k === "string" && k.startsWith("/api/v1/students"));
          }}
        />
      </Dialog>
    </>
  );
}
