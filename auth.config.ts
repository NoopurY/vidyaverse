import type { NextAuthConfig } from "next-auth";

export const ADMIN_IDLE_MS = 15 * 60 * 1000;

const HOME_BY_ROLE: Record<string, string> = {
  AICTE_ADMIN: "/aicte",
  INSTITUTION: "/institution",
  STUDENT: "/student",
};
export const homeFor = (role?: string) => HOME_BY_ROLE[role ?? ""] ?? "/";

/** Edge-safe config shared by middleware and the full Node auth instance */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user, trigger }) {
      if (user) {
        const u = user as Record<string, unknown>;
        for (const k of ["id", "role", "permission", "region", "institutionId", "studentApaar", "isDegreeAwarding", "institutionName"])
          token[k] = u[k];
        token.lastSeen = Date.now();
        return token;
      }
      const isAdmin = token.role === "AICTE_ADMIN" || token.role === "INSTITUTION";
      if (isAdmin && typeof token.lastSeen === "number" && Date.now() - token.lastSeen > ADMIN_IDLE_MS + 60_000) {
        return null; // idle timeout: invalidate the session
      }
      if (trigger === "update") token.lastSeen = Date.now();
      return token;
    },
    session({ session, token }) {
      const t = token as Record<string, unknown>;
      Object.assign(session.user, {
        id: t.id,
        role: t.role,
        permission: t.permission,
        region: t.region,
        institutionId: t.institutionId,
        studentApaar: t.studentApaar,
        isDegreeAwarding: t.isDegreeAwarding,
        institutionName: t.institutionName,
      });
      return session;
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const role = (auth?.user as { role?: string } | undefined)?.role;
      const guarded: [string, string][] = [
        ["/aicte", "AICTE_ADMIN"],
        ["/institution", "INSTITUTION"],
        ["/student", "STUDENT"],
      ];
      for (const [prefix, need] of guarded) {
        if (path === prefix || path.startsWith(prefix + "/")) {
          if (!auth?.user) return false; // redirect to /login
          if (role !== need) return Response.redirect(new URL(homeFor(role), request.nextUrl));
        }
      }
      if (path === "/login" && auth?.user) return Response.redirect(new URL(homeFor(role), request.nextUrl));
      return true;
    },
  },
} satisfies NextAuthConfig;
