import { cronJob } from "@/lib/cron";
import { expireConsents } from "@/lib/consent";

export const maxDuration = 60; // seconds (Vercel function limit for heavy jobs)

export const dynamic = "force-dynamic";
export const GET = cronJob("consent-expiry", expireConsents);
