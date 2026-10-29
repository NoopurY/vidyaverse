import bcrypt from "bcryptjs";
import { z } from "zod";
import { route, ApiError, assertInstitutionAccess } from "@/lib/api";
import { audit } from "@/lib/audit";
import { encrypt } from "@/lib/crypto";
import { User } from "@/models";

export const dynamic = "force-dynamic";

export const GET = route({ roles: ["INSTITUTION"], perms: { INSTITUTION: ["admin"] } }, async ({ actor, params }) => {
  await assertInstitutionAccess(actor, params.id);
  const users = await User.find({ institutionId: params.id }, { name: 1, email: 1, permission: 1, lastLogin: 1, active: 1 }).lean();
  return { items: users };
});

const Body = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(120),
  password: z.string().min(10).max(100).regex(/[A-Z]/, "needs an uppercase letter").regex(/\d/, "needs a digit"),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  permission: z.enum(["admin", "operator"]).default("operator"),
});

/** POST /api/v1/institutions/:id/users — institution admin adds an operator/admin */
export const POST = route({ roles: ["INSTITUTION"], perms: { INSTITUTION: ["admin"] }, body: Body }, async ({ actor, params, body, ip }) => {
  await assertInstitutionAccess(actor, params.id);
  if (await User.exists({ email: body.email.toLowerCase() })) throw new ApiError(409, "A user with this email already exists");
  const u = await User.create({
    name: body.name,
    email: body.email,
    passwordHash: await bcrypt.hash(body.password, 10),
    role: "INSTITUTION",
    permission: body.permission,
    institutionId: params.id,
    phone: encrypt(body.phone),
  });
  await audit({ actor: actor.email, role: actor.role, action: "user.create", entity: "User", entityId: String(u._id), after: { email: u.email, permission: u.permission }, ip });
  return { ok: true, id: String(u._id) };
});
