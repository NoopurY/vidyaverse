import { cronJob } from "@/lib/cron";
import { expireConsents } from "@/lib/consent";

export const dynamic = "force-dynamic";
export const GET = cronJob("consent-expiry", expireConsents);
