import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { dbConnect } from "@/lib/db";
import { sha256, safeEqual } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { Institution, OtpChallenge, User } from "@/models";

const Input = z.object({ challengeId: z.string().length(24), otp: z.string().max(6).optional().default("") });

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { challengeId: {}, otp: {} },
      // Second step of login: the password was verified by /api/auth/otp, which issued this challenge
      async authorize(raw) {
        const parsed = Input.safeParse(raw);
        if (!parsed.success) return null;
        await dbConnect();
        const ch = await OtpChallenge.findById(parsed.data.challengeId);
        if (!ch || ch.used || ch.expiresAt < new Date() || ch.attempts >= 5) return null;
        if (ch.otpRequired) {
          if (!ch.otpHash || !safeEqual(sha256(parsed.data.otp), ch.otpHash)) {
            ch.attempts += 1;
            await ch.save();
            return null;
          }
        }
        ch.used = true;
        await ch.save();
        const user = await User.findById(ch.userId);
        if (!user || !user.active) return null;
        user.lastLogin = new Date();
        await user.save();
        let institutionName: string | undefined;
        let isDegreeAwarding = false;
        if (user.institutionId) {
          const inst = await Institution.findById(user.institutionId, { name: 1, isDegreeAwarding: 1 }).lean();
          institutionName = inst?.name;
          isDegreeAwarding = !!inst?.isDegreeAwarding;
        }
        await audit({ actor: user.email, role: user.role, action: "auth.login", entity: "User", entityId: String(user._id) });
        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          permission: user.permission,
          region: user.region ?? undefined,
          institutionId: user.institutionId ? String(user.institutionId) : undefined,
          studentApaar: user.studentApaar ?? undefined,
          isDegreeAwarding,
          institutionName,
        } as never;
      },
    }),
  ],
});
