/** Pure row-level validation rules (run instantly in the browser preview and again on the server). */
import { academicYearRange } from "@/lib/constants";
import { hintFor } from "./hints";
import { nationalityOf, StudentRow, TEMPLATE_COLUMNS } from "./schema";

export type Severity = "high" | "medium" | "low";
export type RowIssue = {
  type: string;
  severity: Severity;
  field?: keyof StudentRow | string;
  message: string;
  fixHint: string;
};

const issue = (type: string, severity: Severity, field: string | undefined, message: string, hintType = type): RowIssue => ({
  type,
  severity,
  field,
  message,
  fixHint: hintFor(hintType),
});

export const isValidApaar = (a?: string) => !!a && /^\d{12}$/.test(a);

function ageOn(dob: string, on: string) {
  const d = new Date(dob);
  const o = new Date(on);
  let age = o.getFullYear() - d.getFullYear();
  const m = o.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && o.getDate() < d.getDate())) age--;
  return age;
}
const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());

export type RowContext = { programIds?: string[] };

export function validateRow(row: StudentRow, ctx: RowContext = {}): RowIssue[] {
  const out: RowIssue[] = [];

  // APAAR
  if (!row.apaarId) out.push(issue("missing_apaar", "high", "apaarId", "APAAR ID is missing"));
  else if (!isValidApaar(row.apaarId))
    out.push(issue("invalid_apaar", "high", "apaarId", `APAAR ID "${row.apaarId}" is not 12 numeric digits`));

  // Mandatory fields
  for (const c of TEMPLATE_COLUMNS) {
    if (c.key === "apaarId" || !c.required) continue;
    if (!row[c.key]) out.push(issue("missing_field", "high", c.key, `${c.header} is required`));
    else if (c.options && !c.options.includes(row[c.key]))
      out.push(issue("missing_field", "high", c.key, `${c.header} "${row[c.key]}" is not one of: ${c.options.join(", ")}`));
  }

  // Formats
  if (row.dob && !isIsoDate(row.dob)) out.push(issue("missing_field", "high", "dob", "Date of birth must be YYYY-MM-DD"));
  if (row.admissionDate && !isIsoDate(row.admissionDate))
    out.push(issue("missing_field", "high", "admissionDate", "Admission date must be YYYY-MM-DD"));
  if (row.phone && !/^[6-9]\d{9}$/.test(row.phone)) out.push(issue("format", "low", "phone", "Mobile must be a valid 10-digit number"));
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) out.push(issue("format", "low", "email", "Email format looks wrong"));
  if (ctx.programIds && row.programId && !ctx.programIds.includes(row.programId))
    out.push(issue("missing_field", "high", "programId", `Program "${row.programId}" is not approved for your institution`));

  // Inconsistencies
  const flags = [row.nri, row.oci, row.foreignNational].filter((v) => v === "Y").length;
  if (row.oci === "Y" && row.foreignNational === "Y")
    out.push(issue("inconsistency", "high", "oci", "A student cannot be both OCI and Foreign National"));
  else if (flags > 1) out.push(issue("inconsistency", "high", "nri", "Only one of NRI / OCI / Foreign National can be Y"));

  const nat = nationalityOf(row);
  if ((nat === "FN" || nat === "OCI") && ["SC", "ST", "OBC", "EWS"].includes(row.category))
    out.push(
      issue("inconsistency", "high", "category", `${nat === "FN" ? "Foreign National" : "OCI"} student cannot hold the domestic reserved category ${row.category}`)
    );
  const seatNeeds: Record<string, string> = { nri: "NRI", oci: "OCI", fn: "FN" };
  if (seatNeeds[row.seatType] && seatNeeds[row.seatType] !== nat)
    out.push(issue("inconsistency", "high", "seatType", `Seat type "${row.seatType}" requires nationality ${seatNeeds[row.seatType]}, but student is ${nat}`));
  if ((nat === "FN" || nat === "OCI") && (row.seatType === "regular" || row.seatType === "tfw"))
    out.push(issue("inconsistency", "high", "seatType", `${nat} students must be admitted on a supernumerary ${nat.toLowerCase()} seat`));

  if (row.admissionDate && isIsoDate(row.admissionDate) && /^\d{4}-\d{2}$/.test(row.academicYear)) {
    const { from, to } = academicYearRange(row.academicYear);
    if (row.admissionDate < from || row.admissionDate > to)
      out.push(issue("inconsistency", "medium", "admissionDate", `Admission date ${row.admissionDate} is outside academic year ${row.academicYear} (${from} to ${to})`));
  }
  if (row.dob && isIsoDate(row.dob)) {
    const age = ageOn(row.dob, isIsoDate(row.admissionDate) ? row.admissionDate : new Date().toISOString().slice(0, 10));
    if (age < 15 || age > 40) out.push(issue("inconsistency", "medium", "dob", `Date of birth implies age ${age} at admission (allowed 15–40)`));
  }
  return out;
}

export const isBlocking = (issues: RowIssue[]) => issues.some((i) => i.severity === "high");
