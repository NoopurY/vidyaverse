"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Search } from "lucide-react";
import { EmptyState, ErrorNote, Input, Pagination, Select, SkeletonRows, StatusBadge, Table, Tip } from "../ui";
import { qs } from "@/lib/fetcher";
import { SEAT_TYPE_LABEL } from "@/lib/constants";

type Row = {
  id: string;
  apaarId: string;
  name: string;
  programId: string;
  academicYear: string;
  seatType: string;
  category: string;
  nationalityStatus: string;
  status: string;
  phone: string;
  flags: string[];
};

/** Paginated, searchable, filterable students table with flagged rows (red left border + reason tooltip) */
export function StudentsTable({ institutionId, detailHref, programs }: { institutionId?: string; detailHref?: (apaar: string) => string; programs?: { programId: string; name: string }[] }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState("");
  const [program, setProgram] = useState("");
  const [flagged, setFlagged] = useState(false);
  const { data, error, isLoading } = useSWR<{ items: Row[]; total: number; page: number; limit: number }>(
    `/api/v1/students${qs({ institutionId, page, limit: 20, q: query, status, academicYear: year, programId: program, flagged: flagged ? 1 : undefined })}`,
    { keepPreviousData: true }
  );
  const reset = () => setPage(1);
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-4">
        <form
          role="search"
          className="relative min-w-[220px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
            reset();
          }}
        >
          <label htmlFor="st-q" className="sr-only">Search by name or APAAR</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input id="st-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or APAAR, press Enter" className="pl-9" />
        </form>
        <Select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); reset(); }} className="w-36">
          <option value="">All statuses</option>
          {["active", "graduated", "dropped", "transferred"].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select aria-label="Academic year" value={year} onChange={(e) => { setYear(e.target.value); reset(); }} className="w-32">
          <option value="">All years</option>
          <option>2025-26</option>
          <option>2024-25</option>
        </Select>
        {programs && (
          <Select aria-label="Program" value={program} onChange={(e) => { setProgram(e.target.value); reset(); }} className="w-44">
            <option value="">All programs</option>
            {programs.map((p) => <option key={p.programId} value={p.programId}>{p.programId} – {p.name}</option>)}
          </Select>
        )}
        <label className="flex h-10 items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-navy" checked={flagged} onChange={(e) => { setFlagged(e.target.checked); reset(); }} />
          Flagged only
        </label>
      </div>
      <ErrorNote error={error} />
      {isLoading ? (
        <SkeletonRows rows={8} />
      ) : !data?.items.length ? (
        <EmptyState title="No students found" body={query || status || flagged ? "Try clearing the filters." : "Add students one by one or upload the Excel template from the Upload page."} />
      ) : (
        <>
          <Table caption="Students">
            <thead>
              <tr>
                {["APAAR", "Name", "Program", "Year", "Seat", "Category", "Mobile", "Status", "Flags"].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => {
                const isFlagged = s.flags.length > 0;
                return (
                  <tr key={s.id} className={isFlagged ? "flagged-row hover:bg-page" : "hover:bg-page"}>
                    <td className="td font-mono text-xs">{s.apaarId}</td>
                    <td className="td font-medium">
                      {detailHref ? <Link className="text-navy hover:underline" href={detailHref(s.apaarId)}>{s.name}</Link> : s.name}
                    </td>
                    <td className="td">{s.programId}</td>
                    <td className="td">{s.academicYear}</td>
                    <td className="td">{SEAT_TYPE_LABEL[s.seatType] ?? s.seatType}</td>
                    <td className="td">{s.nationalityStatus !== "Indian" ? s.nationalityStatus : s.category}</td>
                    <td className="td font-mono text-xs">{s.phone}</td>
                    <td className="td"><StatusBadge status={s.status} /></td>
                    <td className="td">
                      {isFlagged ? (
                        <Tip content={<ul className="list-disc pl-4">{s.flags.map((f) => <li key={f}>{f}</li>)}</ul>}>
                          <button className="text-left"><StatusBadge status="flagged" label={`${s.flags.length} flag${s.flags.length > 1 ? "s" : ""}`} /></button>
                        </Tip>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
