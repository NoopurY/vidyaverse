import { route, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { filtersFrom } from "@/lib/analytics";
import { buildReport, REPORTS } from "@/lib/reports";
import { tablePdf } from "@/lib/pdf";
import { toCsv } from "@/lib/utils";

/** GET /api/v1/reports/:type?format=json|csv|pdf&year=&state=&region=&discipline=&institutionType= */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async ({ actor, params, query, ip }) => {
  const meta = REPORTS[params.type];
  if (!meta) throw new ApiError(404, "Unknown report type");
  if (meta.aicteOnly && actor.role !== "AICTE_ADMIN") throw new ApiError(403, "This report is available to AICTE only");
  const f = filtersFrom(query);
  const data = await buildReport(params.type, actor, f);
  const format = query.get("format") ?? "json";
  await audit({ actor: actor.email, role: actor.role, action: "report.generate", entity: "Report", entityId: params.type, after: { format, filters: f }, ip });
  const fname = `${params.type}-${new Date().toISOString().slice(0, 10)}`;
  if (format === "csv")
    return new Response(toCsv(data.columns, data.rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${fname}.csv"` } });
  if (format === "pdf") {
    const filtersText = Object.entries(f).map(([k, v]) => `${k}: ${v}`).join("  |  ") || "No filters";
    const bytes = await tablePdf(data.title, data.columns, data.rows, filtersText);
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${fname}.pdf"` } });
  }
  return data;
});
