import bcrypt from "bcryptjs";
import { z } from "zod";
import { publicRoute, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { randomCode, sha256 } from "@/lib/crypto";
import { env } from "@/lib/env";
import { OtpChallenge, User } from "@/models";

export const dynamic = "force-dynamic";

// demo accounts such as "institute@demo" have no TLD, so only the basic local@domain shape is enforced
const Body = z.object({ email: z.string().trim().regex(/^[^\s@]+@[^\s@]+$/,"Enter a valid email").max(120), password: z.string().min(1).max(200) });
const LOCK_MINUTES = 15;

/** Login step 1: verify password (with lockout) and issue an OTP challenge (AICTE + institution users). */
export const POST = publicRoute({ body: Body, rate: { name: "login", limit: 10, windowSec: 60 } }, async ({ body, ip }) => {
  const user = await User.findOne({ email: body.email.trim().toLowerCase() });
  const generic = new ApiError(401, "Invalid email or password");
  if (!user || !user.active) {
    await bcrypt.compare(body.password, "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Z3PZsGZ7Q9gkQlR7yJqZ8ZVb1K6eW").catch(() => false); // equalise timing
    throw generic;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new ApiError(423, `Account locked after 5 failed attempts. Try again in ${mins} minute(s).`);
  }
  // tolerate an accidental leading/trailing space from copy-paste
  const ok =
    (await bcrypt.compare(body.password, user.passwordHash)) ||
    (body.password.trim() !== body.password && (await bcrypt.compare(body.password.trim(), user.passwordHash)));
  if (!ok) {
    user.failedLogins = (user.failedLogins ?? 0) + 1;
    if (user.failedLogins >= 5) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
      user.failedLogins = 0;
      await audit({ actor: user.email, role: user.role, action: "auth.locked", entity: "User", entityId: String(user._id), ip });
    }
    await user.save();
    throw generic;
  }
  user.failedLogins = 0;
  user.lockedUntil = undefined;
  await user.save();

  // OTP is off by default (MVP demo); set OTP_REQUIRED=true to enforce it for AICTE and institution users
  const otpRequired = process.env.OTP_REQUIRED === "true" && user.role !== "STUDENT";
  const otp = randomCode(6);
  const ch = await OtpChallenge.create({
    userId: user._id,
    otpHash: otpRequired ? sha256(otp) : undefined,
    otpRequired,
    expiresAt: new Date(Date.now() + 5 * 60000),
  });
  if (otpRequired) console.log(`[OTP] ${user.email}: ${otp} (mock SMS – valid 5 minutes)`);
  const showOtp = !env.isProd || process.env.DEMO_MODE === "true";
  return {
    challengeId: String(ch._id),
    otpRequired,
    maskedPhone: "registered mobile",
    ...(otpRequired && showOtp ? { devOtp: otp } : {}),
  };
});
