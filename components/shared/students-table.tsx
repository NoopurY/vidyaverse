"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { AlertCircle, Filter, Search, ShieldAlert, User } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  Input,
  Pagination,
  Select,
  SkeletonRows,
  StatusBadge,
  Table,
  Tip,
} from "../ui";
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
export function StudentsTable({
  institutionId,
  detailHref,
  programs,
}: {
  institutionId?: string;
  detailHref?: (apaar: string) => string;
  programs?: { programId: string; name: string }[];
}) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState("");
  const [program, setProgram] = useState("");
  const [flagged, setFlagged] = useState(false);

  const { data, error, isLoading } = useSWR<{
    items: Row[];
    total: number;
    page: number;
    limit: number;
  }>(
    `/api/v1/students${qs({
      institutionId,
      page,
      limit: 20,
      q: query,
      status,
      academicYear: year,
      programId: program,
      flagged: flagged ? 1 : undefined,
    })}`,
    { keepPreviousData: true }
  );

  const reset = () => setPage(1);

  return (
    <div className="bg-white rounded-xl border border-line shadow-card overflow-hidden">
      {/* Search and Filters Strip */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-[#F8FAFD] p-4">
        <form
          role="search"
          className="relative min-w-[240px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
            reset();
          }}
        >
          <label htmlFor="st-q" className="sr-only">
            Search by student name or 12-digit APAAR ID
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            id="st-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search student name or APAAR ID, press Enter..."
            className="pl-9 h-9 text-xs"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Filter by enrollment status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              reset();
            }}
            className="w-36 h-9 text-xs"
          >
            <option value="">All Statuses</option>
            {["active", "graduated", "dropped", "transferred"].map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by academic year"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              reset();
            }}
            className="w-32 h-9 text-xs"
          >
            <option value="">All Years</option>
            <option>2025-26</option>
            <option>2024-25</option>
          </Select>

          {programs && (
            <Select
              aria-label="Filter by program"
              value={program}
              onChange={(e) => {
                setProgram(e.target.value);
                reset();
              }}
              className="w-44 h-9 text-xs"
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p.programId} value={p.programId}>
                  {p.programId} – {p.name}
                </option>
              ))}
            </Select>
          )}

          <label className="flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink cursor-pointer hover:border-navy">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded accent-navy"
              checked={flagged}
              onChange={(e) => {
                setFlagged(e.target.checked);
                reset();
              }}
            />
            <span>Flagged Only</span>
          </label>
        </div>
      </div>

      <ErrorNote error={error} />

      {isLoading ? (
        <SkeletonRows rows={8} />
      ) : !data?.items.length ? (
        <EmptyState
          title="No student records found"
          body={
            query || status || flagged
              ? "No matching records found. Try modifying or clearing your filters."
              : "No students enrolled yet. Upload records from the Upload portal."
          }
        />
      ) : (
        <>
          <Table caption="Registered students repository">
            <thead>
              <tr>
                {["APAAR ID", "Student Name", "Program", "Year", "Seat Type", "Category", "Contact", "Status", "Integrity Flags"].map(
                  (h) => (
                    <th key={h} className="th">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => {
                const isFlagged = s.flags.length > 0;
                return (
                  <tr
                    key={s.id}
                    className={
                      isFlagged
                        ? "flagged-row transition-colors"
                        : "hover:bg-page transition-colors"
                    }
                  >
                    <td className="td font-mono text-xs font-semibold text-navy">
                      {s.apaarId.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")}
                    </td>
                    <td className="td font-bold text-ink">
                      {detailHref ? (
                        <Link className="text-navy hover:underline" href={detailHref(s.apaarId)}>
                          {s.name}
                        </Link>
                      ) : (
                        s.name
                      )}
                    </td>
                    <td className="td text-xs font-mono font-medium text-muted">{s.programId}</td>
                    <td className="td text-xs text-muted">{s.academicYear}</td>
                    <td className="td text-xs font-medium text-ink">
                      {SEAT_TYPE_LABEL[s.seatType] ?? s.seatType}
                    </td>
                    <td className="td text-xs text-muted">
                      {s.nationalityStatus !== "Indian" ? s.nationalityStatus : s.category}
                    </td>
                    <td className="td font-mono text-xs text-muted">{s.phone}</td>
                    <td className="td">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="td">
                      {isFlagged ? (
                        <Tip
                          content={
                            <ul className="list-disc pl-4 space-y-1">
                              {s.flags.map((f) => (
                                <li key={f}>{f}</li>
                              ))}
                            </ul>
                          }
                        >
                          <button className="text-left cursor-help">
                            <StatusBadge
                              status="flagged"
                              label={`${s.flags.length} flag${s.flags.length > 1 ? "s" : ""}`}
                            />
                          </button>
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
