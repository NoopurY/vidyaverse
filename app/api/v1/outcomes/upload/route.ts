import { z } from "zod";
import { route } from "@/lib/api";
import { audit } from "@/lib/audit";
import { Student } from "@/models";

const Row = z.object({
  apaarId: z.string().regex(/^\d{12}$/),
  type: z.enum(["placement", "higher-studies", "none"]),
  organisation: z.string().max(120).optional().default(""),
  year: z.coerce.number().int().min(2015).max(2035),
});
const Body = z.object({ rows: z.array(z.unknown()).min(1).max(5000) });

/** POST /api/v1/outcomes/upload — institution bulk-uploads outcomes for its own students */
export const POST = route({ roles: ["INSTITUTION"], body: Body, idempotent: true }, async ({ actor, body, ip }) => {
  const results: { row: number; ok: boolean; error?: string }[] = [];
  const ops = [];
  for (let i = 0; i < body.rows.length; i++) {
    const p = Row.safeParse(body.rows[i]);
    if (!p.success) {
      results.push({ row: i + 2, ok: false, error: p.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ") });
      continue;
    }
    // consentGiven stays false until the student confirms it in the portal (controls individual disclosure)
    ops.push({
      updateOne: {
        filter: { apaarId: p.data.apaarId, institutionId: actor.institutionId },
        update: { $set: { "outcome.type": p.data.type, "outcome.organisation": p.data.organisation, "outcome.year": p.data.year } },
      },
    });
    results.push({ row: i + 2, ok: true });
  }
  const res = ops.length ? await Student.bulkWrite(ops as never, { ordered: false }) : { matchedCount: 0 };
  await audit({ actor: actor.email, role: actor.role, action: "outcomes.bulk_upload", entity: "Institution", entityId: actor.institutionId, after: { rows: body.rows.length, matched: res.matchedCount }, ip });
  return { ok: true, matched: res.matchedCount, invalid: results.filter((r) => !r.ok) };
});
