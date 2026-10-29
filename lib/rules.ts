import { z } from "zod";
import { dbConnect } from "./db";
import { Rules } from "@/models";

export const DEFAULT_RULES = {
  quotaLimits: { nri: 15, oci: 5, fn: 5, tfw: 5, other: 5 },
  fuzzyThreshold: 0.9,
  riskWeights: {
    intakeBreach: 25,
    crossDuplicate: 20,
    counsellingMismatch: 20,
    scholarshipMismatch: 25,
    sharedContact: 20,
    yoyJump: 25,
    fullFillHighForeign: 20,
    lateUpload: 10,
    openIssues: 10,
  },
  deadlineDate: new Date("2025-10-31T18:30:00.000Z"),
  ghostSharedContactThreshold: 3,
  yoyJumpThreshold: 100,
};

export const RulesInput = z.object({
  quotaLimits: z.object({
    nri: z.number().min(0).max(100),
    oci: z.number().min(0).max(100),
    fn: z.number().min(0).max(100),
    tfw: z.number().min(0).max(100),
    other: z.number().min(0).max(100),
  }),
  fuzzyThreshold: z.number().min(0.5).max(1),
  riskWeights: z.object({
    intakeBreach: z.number().min(0).max(50),
    crossDuplicate: z.number().min(0).max(50),
    counsellingMismatch: z.number().min(0).max(50),
    scholarshipMismatch: z.number().min(0).max(50),
    sharedContact: z.number().min(0).max(50),
    yoyJump: z.number().min(0).max(50),
    fullFillHighForeign: z.number().min(0).max(50),
    lateUpload: z.number().min(0).max(50),
    openIssues: z.number().min(0).max(50),
  }),
  deadlineDate: z.coerce.date(),
  ghostSharedContactThreshold: z.number().int().min(2).max(50),
  yoyJumpThreshold: z.number().min(10).max(1000),
});
export type RulesT = z.infer<typeof RulesInput>;

export async function getRules(): Promise<RulesT> {
  await dbConnect();
  const doc = await Rules.findOne({ key: "global" }).lean();
  if (!doc) return DEFAULT_RULES;
  return {
    quotaLimits: { ...DEFAULT_RULES.quotaLimits, ...(doc.quotaLimits as object) },
    fuzzyThreshold: doc.fuzzyThreshold ?? DEFAULT_RULES.fuzzyThreshold,
    riskWeights: { ...DEFAULT_RULES.riskWeights, ...(doc.riskWeights as object) },
    deadlineDate: doc.deadlineDate ?? DEFAULT_RULES.deadlineDate,
    ghostSharedContactThreshold: doc.ghostSharedContactThreshold ?? DEFAULT_RULES.ghostSharedContactThreshold,
    yoyJumpThreshold: doc.yoyJumpThreshold ?? DEFAULT_RULES.yoyJumpThreshold,
  } as RulesT;
}
