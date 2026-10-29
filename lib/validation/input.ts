import { z } from "zod";
import { normaliseRow, type StudentRow } from "./schema";

const str = (max = 200) => z.union([z.string().max(max), z.number()]).optional().transform((v) => (v === undefined ? "" : String(v)));

/** Loose wire format (strings) — semantic validation is done by the rule engine, which produces fix hints */
export const StudentRowInput = z
  .object({
    apaarId: str(20),
    institutionStudentId: str(50),
    name: str(120),
    dob: str(20),
    gender: str(5),
    parentName: str(120),
    phone: str(20),
    email: str(120),
    category: str(20),
    nri: str(5),
    oci: str(5),
    foreignNational: str(5),
    seatType: str(10),
    programId: str(20),
    academicYear: str(10),
    admissionDate: str(20),
    counsellingRef: str(50),
    status: str(20),
  })
  .transform((r) => normaliseRow(r as Record<string, unknown>) as StudentRow);

export const StudentRowsInput = z.object({ rows: z.array(StudentRowInput).min(1).max(5000) });
