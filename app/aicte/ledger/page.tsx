"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, EmptyState, ErrorNote, PageHeader, Progress, Select, SkeletonRows } from "@/components/ui";
import { LedgerView, type LedgerProgram } from "@/components/shared/ledger-view";
import { qs } from "@/lib/fetcher";
import { STATES } from "@/lib/constants";

type Resp = { year: string; institutions: { institutionId: string; name: string; state: string; approved: number; consumed: number; programs: LedgerProgram[] }[] };

export default function AicteLedger() {
  const [year, setYear] = useState("2025-26");
  const [state, setState] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { data, error, isLoading } = useSWR<Resp>(`/api/v1/ledger${qs({ year, state })}`, { refreshInterval: 10_000 });
  return (
    <>
      <PageHeader
        title="Seat Ledger"
        description="Every approved seat is a token. Admissions consume tokens atomically; drops and transfers release them."
        actions={
          <>
            <Select aria-label="State" value={state} onChange={(e) => setState(e.target.value)} className="w-44">
              <option value="">All states</option>
              {STATES.map((s) => <option key={s.code}>{s.name}</option>)}
            </Select>
            <Select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)} className="w-32">
              <option>2025-26</option>
              <option>2024-25</option>
            </Select>
          </>
        }
      />
      <ErrorNote error={error} />
      <Card>
        {isLoading ? (
          <SkeletonRows rows={10} />
        ) : !data?.institutions.length ? (
          <EmptyState title="No seat tokens issued" body="Approve program intake from an institution's page to issue seat tokens." />
        ) : (
          <ul className="divide-y divide-line">
            {data.institutions.map((i) => {
              const isOpen = open === i.institutionId;
              return (
                <li key={i.institutionId}>
                  <button onClick={() => setOpen(isOpen ? null : i.institutionId)} aria-expanded={isOpen} className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-page">
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" aria-hidden /> : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{i.name}</span>
                      <span className="text-xs text-muted">{i.state}</span>
                    </span>
                    <span className="hidden w-48 sm:block"><Progress value={i.consumed} max={i.approved} label={`${i.name} seats used`} /></span>
                    <span className="w-28 text-right text-sm">{i.consumed} / {i.approved}</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-line bg-page p-5">
                      <LedgerView programs={i.programs} />
                      <Link href={`/aicte/institutions/${i.institutionId}`} className="mt-3 inline-block text-sm font-medium text-navy hover:underline">Open institution →</Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
