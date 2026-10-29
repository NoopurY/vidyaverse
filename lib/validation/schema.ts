/** Upload template definition + row normalisation (isomorphic: used by the browser preview and the server). */

export type TemplateColumn = {
  key: keyof StudentRow;
  header: string;
  required: boolean;
  description: string;
  options?: string[];
  example: string;
};

export type StudentRow = {
  apaarId: string;
  institutionStudentId: string;
  name: string;
  dob: string;
  gender: string;
  parentName: string;
  phone: string;
  email: string;
  category: string;
  nri: string;
  oci: string;
  foreignNational: string;
  seatType: string;
  programId: string;
  academicYear: string;
  admissionDate: string;
  counsellingRef: string;
  status: string;
};

export const TEMPLATE_COLUMNS: TemplateColumn[] = [
  { key: "apaarId", header: "APAAR ID", required: true, description: "12-digit APAAR ID (numbers only). Student can generate it on DigiLocker.", example: "100000000001" },
  { key: "institutionStudentId", header: "Institution Student ID", required: false, description: "Your college roll/registration number", example: "ENG2025-001" },
  { key: "name", header: "Student Name", required: true, description: "Full name as in APAAR / 10th certificate", example: "Aarav Sharma" },
  { key: "dob", header: "Date of Birth", required: true, description: "Format YYYY-MM-DD", example: "2006-04-15" },
  { key: "gender", header: "Gender", required: true, description: "M, F or T", options: ["M", "F", "T"], example: "M" },
  { key: "parentName", header: "Parent/Guardian Name", required: true, description: "Father/mother/guardian full name", example: "Rakesh Sharma" },
  { key: "phone", header: "Mobile", required: true, description: "10-digit mobile number", example: "9876543210" },
  { key: "email", header: "Email", required: false, description: "Student email", example: "aarav@example.com" },
  { key: "category", header: "Category", required: true, description: "General, SC, ST, OBC or EWS", options: ["General", "SC", "ST", "OBC", "EWS"], example: "General" },
  { key: "nri", header: "NRI (Y/N)", required: true, description: "Y if Non-Resident Indian", options: ["Y", "N"], example: "N" },
  { key: "oci", header: "OCI (Y/N)", required: true, description: "Y if Overseas Citizen of India", options: ["Y", "N"], example: "N" },
  { key: "foreignNational", header: "Foreign National (Y/N)", required: true, description: "Y if foreign national", options: ["Y", "N"], example: "N" },
  { key: "seatType", header: "Seat Type", required: true, description: "regular, nri, oci, fn, tfw or other (supernumerary)", options: ["regular", "nri", "oci", "fn", "tfw", "other"], example: "regular" },
  { key: "programId", header: "Program ID", required: true, description: "Program code from your AICTE approval (see Seat Ledger page)", example: "P1" },
  { key: "academicYear", header: "Academic Year", required: true, description: "Format 2025-26", options: ["2024-25", "2025-26"], example: "2025-26" },
  { key: "admissionDate", header: "Admission Date", required: true, description: "Format YYYY-MM-DD, within the academic year", example: "2025-08-01" },
  { key: "counsellingRef", header: "Counselling Ref", required: false, description: "JoSAA / state CAP allotment number", example: "CAP-2025-11223" },
  { key: "status", header: "Status", required: true, description: "active, dropped, transferred or graduated", options: ["active", "dropped", "transferred", "graduated"], example: "active" },
];

const HEADER_TO_KEY = new Map<string, keyof StudentRow>();
for (const c of TEMPLATE_COLUMNS) {
  HEADER_TO_KEY.set(c.header.toLowerCase(), c.key);
  HEADER_TO_KEY.set(String(c.key).toLowerCase(), c.key);
}

function excelSerialToIso(n: number) {
  const ms = Math.round((n - 25569) * 86400 * 1000);
  return new Date(ms).toISOString().slice(0, 10);
}

export function normaliseDate(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (v instanceof Date && !isNaN(v.getTime())) {
    const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
  if (typeof v === "number") return excelSerialToIso(v);
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return s;
}

const yn = (v: unknown) => (/^(y|yes|true|1)$/i.test(String(v ?? "").trim()) ? "Y" : String(v ?? "").trim() ? "N" : "");

/** Maps a raw spreadsheet record (header -> value) to a normalised StudentRow */
export function normaliseRow(raw: Record<string, unknown>): StudentRow {
  const out: Record<string, string> = {};
  for (const [h, v] of Object.entries(raw)) {
    const key = HEADER_TO_KEY.get(h.trim().toLowerCase());
    if (!key) continue;
    out[key] = v === null || v === undefined ? "" : v instanceof Date ? normaliseDate(v) : String(v).trim();
    if (key === "dob" || key === "admissionDate") out[key] = normaliseDate(v);
  }
  const row = Object.fromEntries(TEMPLATE_COLUMNS.map((c) => [c.key, out[c.key] ?? ""])) as StudentRow;
  row.apaarId = row.apaarId.replace(/[\s-]/g, "");
  row.phone = row.phone.replace(/\D/g, "").replace(/^91(\d{10})$/, "$1");
  row.gender = row.gender.toUpperCase().slice(0, 1);
  row.seatType = row.seatType.toLowerCase();
  row.status = (row.status || "active").toLowerCase();
  row.nri = yn(row.nri) || "N";
  row.oci = yn(row.oci) || "N";
  row.foreignNational = yn(row.foreignNational) || "N";
  const cat = ["General", "SC", "ST", "OBC", "EWS"].find((c) => c.toLowerCase() === row.category.toLowerCase());
  if (cat) row.category = cat;
  return row;
}

export function nationalityOf(row: Pick<StudentRow, "nri" | "oci" | "foreignNational">) {
  if (row.foreignNational === "Y") return "FN";
  if (row.oci === "Y") return "OCI";
  if (row.nri === "Y") return "NRI";
  return "Indian";
}
