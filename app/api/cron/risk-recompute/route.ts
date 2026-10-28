import { cronJob } from "@/lib/cron";
import { counsellingCheckAll, crossDuplicateCheck, lateUploadCheck, recomputeRisk, sharedContactCheck } from "@/lib/checks";
import { getRules } from "@/lib/rules";

export const dynamic = "force-dynamic";
export const GET = cronJob("risk-recompute", async () => {
  const rules = await getRules();
  return {
    counselling: await counsellingCheckAll(),
    crossDuplicates: await crossDuplicateCheck(),
    sharedContacts: await sharedContactCheck(rules),
    lateUploads: await lateUploadCheck(rules),
    risk: await recomputeRisk(rules),
  };
});
