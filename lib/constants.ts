export const STATES: { name: string; code: string; region: string }[] = [
  { name: "Maharashtra", code: "mh", region: "Western" },
  { name: "Gujarat", code: "gj", region: "Western" },
  { name: "Karnataka", code: "ka", region: "South-Western" },
  { name: "Tamil Nadu", code: "tn", region: "Southern" },
  { name: "Telangana", code: "tg", region: "South-Central" },
  { name: "Uttar Pradesh", code: "up", region: "Northern" },
  { name: "West Bengal", code: "wb", region: "Eastern" },
  { name: "Madhya Pradesh", code: "mp", region: "Central" },
  { name: "Rajasthan", code: "rj", region: "North-Western" },
  { name: "Delhi", code: "dl", region: "North-Western" },
];
export const REGIONS = Array.from(new Set(STATES.map((s) => s.region)));
export const stateByName = (n: string) => STATES.find((s) => s.name.toLowerCase() === n.toLowerCase());

export const ACADEMIC_YEARS = ["2024-25", "2025-26"];
export const CURRENT_YEAR = "2025-26";

/** Academic year window used for "admission date outside academic year" checks */
export function academicYearRange(ay: string) {
  const start = parseInt(ay.slice(0, 4), 10);
  return { from: `${start}-06-01`, to: `${start + 1}-05-31` };
}

export const SEAT_TYPE_LABEL: Record<string, string> = {
  regular: "Regular",
  nri: "NRI",
  oci: "OCI",
  fn: "Foreign National",
  tfw: "Tuition Fee Waiver",
  other: "Other supernumerary",
};

export const DISCIPLINES = ["CSE", "ECE", "ME", "CE", "EE", "IT", "AI&DS", "MBA", "MCA"];

/** Fields that may ever be disclosed through a verification. Category, contacts and parent name never are. */
export const DISCLOSABLE_FIELDS = ["name", "institution", "program", "academicYear", "status", "apaarId", "dob", "outcome"] as const;
export const DEFAULT_DISCLOSED = ["name", "institution", "program", "academicYear", "status"];
export const NEVER_DISCLOSED = ["category", "phone", "email", "parentName"];

export const FIELD_LABEL: Record<string, string> = {
  name: "Name",
  institution: "Institution",
  program: "Program",
  academicYear: "Academic year",
  status: "Status",
  apaarId: "APAAR ID",
  dob: "Date of birth",
  outcome: "Outcome",
};

export const ISSUE_LABEL: Record<string, string> = {
  invalid_apaar: "Invalid APAAR",
  missing_apaar: "Missing APAAR",
  apaar_not_found: "APAAR not in registry",
  apaar_mismatch: "Name/DOB mismatch with APAAR",
  duplicate_in_institution: "Duplicate record",
  intake_exceeded: "Intake exceeded",
  inconsistency: "Inconsistent data",
  missing_field: "Missing mandatory field",
  cross_institution_duplicate: "Enrolled elsewhere",
  fuzzy_duplicate: "Possible duplicate person",
  no_counselling: "No counselling allotment",
  ghost_scholarship: "Possible ghost student",
  shared_contact: "Shared contact",
  late_bulk_upload: "Late bulk upload",
  ghost_pattern: "Ghost-student pattern",
};
