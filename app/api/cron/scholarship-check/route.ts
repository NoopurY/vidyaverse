import { cronJob } from "@/lib/cron";
import { recomputeRisk, scholarshipCheck, ghostPatternCheck } from "@/lib/checks";

export const dynamic = "force-dynamic";
export const GET = cronJob("scholarship-check", async () => {
  const r = await scholarshipCheck();
  const g = await ghostPatternCheck();
  await recomputeRisk();
  return { ...r, ghostPattern: g };
});
