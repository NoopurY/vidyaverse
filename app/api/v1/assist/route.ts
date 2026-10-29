import { z } from "zod";
import { route } from "@/lib/api";
import { chatJson } from "@/lib/llm";
import { hintFor } from "@/lib/validation/hints";
import { ISSUE_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

const Body = z.object({
  lang: z.enum(["en", "hi", "mr"]).default("en"),
  errors: z
    .array(z.object({ rowNumber: z.number().int(), type: z.string().max(40), field: z.string().max(40).optional(), message: z.string().max(300) }))
    .min(1)
    .max(60),
});

/** POST /api/v1/assist — AI error assistant: plain-language explanation + fix per row error (LLM or templates) */
export const POST = route({ roles: ["INSTITUTION"], body: Body, rate: { name: "assist", limit: 20, windowSec: 60 } }, async ({ body }) => {
  const templated = body.errors.map((e) => ({
    rowNumber: e.rowNumber,
    type: e.type,
    explanation: `Row ${e.rowNumber}: ${ISSUE_LABEL[e.type] ?? e.type}${e.field ? ` (${e.field})` : ""}. ${e.message}.`,
    fix: hintFor(e.type, body.lang),
  }));
  // Messages never contain contact details or parent names (rule messages only), so they are safe to send to the LLM.
  const llm = await chatJson(
    `You help staff at small Indian colleges fix spreadsheet errors when uploading student data to AICTE. For each error, reply in ${{ en: "simple English", hi: "simple Hindi", mr: "simple Marathi" }[body.lang]} with one short sentence explaining the problem and one practical fix. Respond as JSON: {"items":[{"rowNumber":n,"explanation":"...","fix":"..."}]}`,
    JSON.stringify(body.errors)
  );
  const items = (llm as { items?: { rowNumber: number; explanation: string; fix: string }[] } | null)?.items;
  if (Array.isArray(items) && items.length) {
    return { engine: "llm", items: templated.map((t) => ({ ...t, ...(items.find((i) => i.rowNumber === t.rowNumber) ?? {}) })) };
  }
  return { engine: "template", items: templated };
});
