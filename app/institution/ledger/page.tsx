"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardBody, CardHeader, EmptyState, ErrorNote, PageHeader, Select, SkeletonRows } from "@/components/ui";
import { LedgerView, type LedgerProgram } from "@/components/shared/ledger-view";

type Resp = { year: string; institutions: { institutionId: string; name: string; approved: number; consumed: number; programs: LedgerProgram[] }[] };

export default function InstitutionLedger() {
  const [year, setYear] = useState("2025-26");
  const { data, error, isLoading } = useSWR<Resp>(`/api/v1/ledger?year=${year}`, { refreshInterval: 10_000 });
  const mine = data?.institutions[0];
  return (
    <>
      <PageHeader
        title="Seat Ledger"
        description="One digital token per AICTE-approved seat. An admission consumes a token; with no token left the admission is rejected."
        actions={<Select aria-label="Academic year" value={year} onChange={(e) => setYear(e.target.value)} className="w-32"><option>2025-26</option><option>2024-25</option></Select>}
      />
      <ErrorNote error={error} />
      <Card>
        <CardHeader title={mine ? `${mine.consumed} of ${mine.approved} seats consumed` : "Seats"} description="Regular and supernumerary seats (NRI / OCI / FN / TFW / other) by program" />
        <CardBody>{isLoading ? <SkeletonRows /> : mine ? <LedgerView programs={mine.programs} /> : <EmptyState title="No seats issued" body="Seats are issued when AICTE approves your program intake." />}</CardBody>
      </Card>
    </>
  );
}
