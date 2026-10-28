import * as XLSX from "xlsx";
import { route } from "@/lib/api";
import { buildTemplate, templateBuffer } from "@/lib/template";
import { Institution } from "@/models";

/** GET /api/v1/uploads/template[?format=csv] — template with field descriptions, dropdowns and your program IDs */
export const GET = route({ roles: ["INSTITUTION", "AICTE_ADMIN"] }, async ({ actor, query }) => {
  const inst = actor.institutionId ? await Institution.findById(actor.institutionId, { programs: 1 }).lean() : null;
  const programs = inst?.programs.map((p) => ({ id: p.programId, name: p.name })) ?? [];
  if (query.get("format") === "csv") {
    const csv = XLSX.utils.sheet_to_csv(buildTemplate(programs).Sheets["Students"]);
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="apaar-student-template.csv"' } });
  }
  return new Response(new Uint8Array(templateBuffer(programs)), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="apaar-student-template.xlsx"',
    },
  });
});
