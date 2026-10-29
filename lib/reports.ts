/** Report catalogue: each report returns columns + rows from the analytics layer (CSV / PDF / JSON). */
import { Student, Institution } from "@/models";
import { refId } from "./crypto";
import { byState, institutionMetrics, scopedInstitutions, type Filters } from "./analytics";
import { ACADEMIC_YEARS, CURRENT_YEAR } from "./constants";
import { fmtPct } from "./utils";
import type { Actor } from "./api";

export const REPORTS: Record<string, { title: string; description: string; aicteOnly?: boolean }> = {
  "state-enrolment": { title: "State-wise enrolment", description: "Institutions, approved intake, enrolment and fill rate by state" },
  "program-intake": { title: "Program-wise intake vs enrolment", description: "Approved intake and actual enrolment per program" },
  "category-split": { title: "Category split", description: "NRI / OCI / FN / supernumerary / reserved categories" },
  "flagged-institutions": { title: "Flagged institutions", description: "Risk score, compliance badge and reasons", aicteOnly: true },
  "cross-duplicates": { title: "Cross-institution duplicates", description: "Students active in more than one institution (tokenised)", aicteOnly: true },
  outcomes: { title: "Outcomes", description: "Placement and higher-studies rates by institution and state" },
  accreditation: { title: "Accreditation summary", description: "NBA/NAAC-style intake, enrolment, fill %, outcomes, compliance" },
  "yoy-trends": { title: "Year-on-year trends", description: "Enrolment change between academic years" },
};

type Col = { key: string; label: string };
export type ReportData = { title: string; columns: Col[]; rows: Record<string, unknown>[] };

export async function buildReport(type: string, actor: Actor, f: Filters): Promise<ReportData> {
  const meta = REPORTS[type];
  if (!meta) throw new Error("Unknown report");
  const insts = await scopedInstitutions(actor, f);
  const m = await institutionMetrics(insts, f);
  const year = f.year ?? CURRENT_YEAR;

  switch (type) {
    case "state-enrolment": {
      const rows = byState(m).map((s) => ({ ...s, fill: fmtPct(s.fillPct) }));
      return { title: `${meta.title} (${year})`, columns: [{ key: "state", label: "State" }, { key: "region", label: "Region" }, { key: "institutions", label: "Institutions" }, { key: "intake", label: "Approved intake" }, { key: "enrolled", label: "Enrolled" }, { key: "fill", label: "Fill %" }, { key: "flags", label: "Open flags" }], rows };
    }
    case "program-intake": {
      const agg = await Student.aggregate([
        { $match: { institutionId: { $in: insts.map((i) => i._id) }, academicYear: year, status: { $in: ["active", "graduated"] } } },
        { $group: { _id: { i: "$institutionId", p: "$programId" }, n: { $sum: 1 } } },
      ]);
      const rows = insts.flatMap((i) =>
        i.programs
          .filter((p) => !f.discipline || p.discipline === f.discipline)
          .map((p) => {
            const enrolled = agg.find((a) => String(a._id.i) === String(i._id) && a._id.p === p.programId)?.n ?? 0;
            return { institution: i.name, state: i.state, program: `${p.name} (${p.programId})`, discipline: p.discipline, intake: p.approvedIntake, enrolled, fill: fmtPct(p.approvedIntake ? (Math.min(enrolled, p.approvedIntake) / p.approvedIntake) * 100 : 0) };
          })
      );
      return { title: `${meta.title} (${year})`, columns: [{ key: "institution", label: "Institution" }, { key: "state", label: "State" }, { key: "program", label: "Program" }, { key: "discipline", label: "Discipline" }, { key: "intake", label: "Approved intake" }, { key: "enrolled", label: "Enrolled" }, { key: "fill", label: "Fill %" }], rows };
    }
    case "category-split": {
      const rows = m.map((x) => ({ institution: x.name, state: x.state, enrolled: x.enrolled, ...x.categories }));
      return { title: `${meta.title} (${year})`, columns: [{ key: "institution", label: "Institution" }, { key: "state", label: "State" }, { key: "enrolled", label: "Enrolled" }, { key: "General", label: "General" }, { key: "OBC", label: "OBC" }, { key: "SC", label: "SC" }, { key: "ST", label: "ST" }, { key: "EWS", label: "EWS" }, { key: "NRI", label: "NRI" }, { key: "OCI", label: "OCI" }, { key: "FN", label: "FN" }, { key: "supernumerary", label: "Supernumerary" }], rows };
    }
    case "flagged-institutions": {
      const rows = m
        .filter((x) => x.riskScore > 0 || x.badge !== "green")
        .sort((a, b) => b.riskScore - a.riskScore)
        .map((x) => ({ institution: x.name, aicteId: x.aicteId, state: x.state, risk: x.riskScore, compliance: x.complianceScore, badge: x.badge, flags: x.openFlags, reasons: x.riskReasons.slice(0, 3).join("; ") }));
      return { title: meta.title, columns: [{ key: "institution", label: "Institution" }, { key: "aicteId", label: "AICTE ID" }, { key: "state", label: "State" }, { key: "risk", label: "Risk score" }, { key: "compliance", label: "Compliance" }, { key: "badge", label: "Badge" }, { key: "flags", label: "Open flags" }, { key: "reasons", label: "Top reasons" }], rows };
    }
    case "cross-duplicates": {
      const groups = await Student.aggregate([
        { $match: { status: "active", institutionId: { $in: insts.map((i) => i._id) } } },
        { $group: { _id: "$apaarToken", insts: { $addToSet: "$institutionId" } } },
        { $match: { "insts.1": { $exists: true } } },
      ]);
      const names = new Map((await Institution.find({ _id: { $in: groups.flatMap((g) => g.insts) } }, { name: 1 }).lean()).map((i) => [String(i._id), i.name]));
      const rows = groups.map((g) => ({ ref: refId(g._id), count: g.insts.length, institutions: g.insts.map((i: unknown) => names.get(String(i))).join(" | ") }));
      return { title: meta.title, columns: [{ key: "ref", label: "Reference (tokenised)" }, { key: "count", label: "Institutions" }, { key: "institutions", label: "Enrolled at" }], rows };
    }
    case "outcomes": {
      const rows = [
        ...m.map((x) => ({ level: "Institution", name: x.name, state: x.state, graduates: x.graduates, placed: x.placed, higher: x.higher, placement: fmtPct(x.placementRate), higherRate: fmtPct(x.higherRate) })),
        ...byState(m).map((s) => ({ level: "State", name: s.state, state: s.state, graduates: "", placed: "", higher: "", placement: fmtPct(s.placementRate), higherRate: fmtPct(s.higherRate) })),
      ];
      return { title: meta.title, columns: [{ key: "level", label: "Level" }, { key: "name", label: "Name" }, { key: "state", label: "State" }, { key: "graduates", label: "Graduates" }, { key: "placed", label: "Placed" }, { key: "higher", label: "Higher studies" }, { key: "placement", label: "Placement %" }, { key: "higherRate", label: "Higher-studies %" }], rows };
    }
    case "accreditation": {
      const rows = m.map((x) => ({ institution: x.name, aicteId: x.aicteId, intake: x.intake, enrolled: x.enrolled, fill: fmtPct(x.fillPct), placement: fmtPct(x.placementRate), higher: fmtPct(x.higherRate), compliance: x.complianceScore, risk: x.riskScore, nba: x.accreditation?.nba ? "Yes" : "No", naac: x.accreditation?.naacGrade ?? "—" }));
      return { title: `${meta.title} (${year})`, columns: [{ key: "institution", label: "Institution" }, { key: "aicteId", label: "AICTE ID" }, { key: "intake", label: "Intake" }, { key: "enrolled", label: "Enrolment" }, { key: "fill", label: "Fill %" }, { key: "placement", label: "Placement %" }, { key: "higher", label: "Higher studies %" }, { key: "compliance", label: "Compliance" }, { key: "risk", label: "Risk" }, { key: "nba", label: "NBA" }, { key: "naac", label: "NAAC" }], rows };
    }
    case "yoy-trends": {
      const [y0, y1] = ACADEMIC_YEARS;
      const rows = [
        ...byState(m).map((s) => ({ level: "State", name: s.state, a: s.enrolledBy[y0], b: s.enrolledBy[y1], change: s.enrolledBy[y0] ? fmtPct(((s.enrolledBy[y1] - s.enrolledBy[y0]) / s.enrolledBy[y0]) * 100, 0) : "—" })),
        ...m.map((x) => ({ level: "Institution", name: x.name, a: x.enrolledBy[y0], b: x.enrolledBy[y1], change: x.enrolledBy[y0] ? fmtPct(((x.enrolledBy[y1] - x.enrolledBy[y0]) / x.enrolledBy[y0]) * 100, 0) : "—" })),
      ];
      return { title: meta.title, columns: [{ key: "level", label: "Level" }, { key: "name", label: "Name" }, { key: "a", label: y0 }, { key: "b", label: y1 }, { key: "change", label: "Change" }], rows };
    }
  }
  throw new Error("Unknown report");
}
