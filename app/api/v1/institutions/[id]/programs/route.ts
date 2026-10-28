import { z } from "zod";
import { route, ApiError, assertInstitutionAccess } from "@/lib/api";
import { audit } from "@/lib/audit";
import { generateSeatTokens } from "@/lib/ledger";
import { getRules } from "@/lib/rules";
import { CURRENT_YEAR, DISCIPLINES } from "@/lib/constants";
import { Institution } from "@/models";

const Body = z.object({
  programId: z.string().regex(/^[A-Z0-9-]{1,12}$/),
  name: z.string().min(2).max(120),
  level: z.enum(["UG", "PG", "Diploma"]),
  discipline: z.enum(DISCIPLINES as [string, ...string[]]),
  approvedIntake: z.number().int().min(1).max(1000),
  supernumeraryApproved: z.object({ nri: z.number().int().min(0), oci: z.number().int().min(0), fn: z.number().int().min(0), tfw: z.number().int().min(0), other: z.number().int().min(0) }),
  academicYear: z.string().default(CURRENT_YEAR),
});

/** POST /api/v1/institutions/:id/programs — AICTE approves intake for a program → seat tokens are minted */
export const POST = route({ roles: ["AICTE_ADMIN"], perms: { AICTE_ADMIN: ["full", "regional"] }, body: Body }, async ({ actor, params, body, ip }) => {
  await assertInstitutionAccess(actor, params.id);
  const inst = await Institution.findById(params.id);
  if (!inst) throw new ApiError(404, "Institution not found");
  const { academicYear, ...program } = body;
  const idx = inst.programs.findIndex((p) => p.programId === program.programId);
  const before = idx >= 0 ? JSON.parse(JSON.stringify(inst.programs[idx])) : null;
  if (idx >= 0) {
    if (program.approvedIntake < inst.programs[idx].approvedIntake) throw new ApiError(400, "Reducing approved intake is not supported once seats are issued");
    inst.programs[idx] = program as never;
  } else inst.programs.push(program as never);
  await inst.save();
  const created = await generateSeatTokens(inst._id, program, academicYear, await getRules());
  await audit({ actor: actor.email, role: actor.role, action: "program.intake_approved", entity: "Institution", entityId: params.id, before, after: { ...program, academicYear, tokensCreated: created }, ip });
  return { ok: true, tokensCreated: created };
});
