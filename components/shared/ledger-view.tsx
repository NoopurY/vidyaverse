"use client";

import { Progress } from "../ui";
import { SEAT_TYPE_LABEL } from "@/lib/constants";

export type LedgerProgram = {
  programId: string;
  name: string;
  discipline?: string;
  seats: { seatType: string; approved: number; consumed: number; remaining: number }[];
};

/** Approved / consumed / remaining per program and seat type with progress bars */
export function LedgerView({ programs }: { programs: LedgerProgram[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {programs.map((p) => {
        const reg = p.seats.find((s) => s.seatType === "regular");
        return (
          <div key={p.programId} className="rounded border border-line p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-muted">
                  {p.programId}
                  {p.discipline && ` · ${p.discipline}`}
                </p>
              </div>
              {reg && (
                <span className={reg.remaining <= 0 ? "text-sm font-semibold text-danger" : reg.consumed / reg.approved >= 0.9 ? "text-sm font-semibold text-[#7A5A00]" : "text-sm font-semibold text-success"}>
                  {reg.remaining <= 0 ? "Full" : `${reg.remaining} left`}
                </span>
              )}
            </div>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-1 font-medium">Seat type</th>
                  <th className="pb-1 text-right font-medium">Approved</th>
                  <th className="pb-1 text-right font-medium">Consumed</th>
                  <th className="pb-1 text-right font-medium">Remaining</th>
                  <th className="w-1/3 pb-1" aria-label="Usage" />
                </tr>
              </thead>
              <tbody>
                {p.seats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-2 text-xs text-muted">No seat tokens issued for this year.</td>
                  </tr>
                )}
                {p.seats.map((s) => (
                  <tr key={s.seatType}>
                    <td className="py-1">{SEAT_TYPE_LABEL[s.seatType] ?? s.seatType}</td>
                    <td className="py-1 text-right">{s.approved}</td>
                    <td className="py-1 text-right">{s.consumed}</td>
                    <td className={s.remaining <= 0 ? "py-1 text-right font-semibold text-danger" : "py-1 text-right"}>{s.remaining}</td>
                    <td className="py-1 pl-3">
                      <Progress value={s.consumed} max={s.approved} label={`${p.name} ${s.seatType} seats used`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
