/**
 * Natural-language search for AICTE officers. The LLM (or keyword parser) may only produce a filter over a
 * WHITELIST of fields; the filter is validated with zod and translated to a query by our own code.
 */
import { z } from "zod";
import { DISCIPLINES, STATES, CURRENT_YEAR, REGIONS } from "./constants";
import { chatJson } from "./llm";

export const SearchFilter = z
  .object({
    state: z.enum(STATES.map((s) => s.name) as [string, ...string[]]).optional(),
    region: z.enum(REGIONS as [string, ...string[]]).optional(),
    discipline: z.enum(DISCIPLINES as [string, ...string[]]).optional(),
    institutionType: z.enum(["Government", "Private", "Deemed", "Autonomous"]).optional(),
    exceedingIntake: z.boolean().optional(),
    nearLimit: z.boolean().optional(),
    minRiskScore: z.number().min(0).max(100).optional(),
    badge: z.enum(["green", "amber", "red"]).optional(),
    flagType: z.enum(["no_counselling", "ghost_scholarship", "cross_institution_duplicate", "shared_contact", "intake_exceeded"]).optional(),
    academicYear: z.enum(["2024-25", "2025-26"]).optional(),
  })
  .strict();
export type SearchFilterT = z.infer<typeof SearchFilter>;

const SYSTEM = `You convert an AICTE officer's question into a JSON filter. Output ONLY a JSON object with any of these keys:
state (one of: ${STATES.map((s) => s.name).join(", ")}), region (${REGIONS.join(", ")}), discipline (${DISCIPLINES.join(", ")}),
institutionType (Government|Private|Deemed|Autonomous), exceedingIntake (boolean: attempted or exceeded approved intake),
nearLimit (boolean: >=90% filled), minRiskScore (0-100), badge (green|amber|red),
flagType (no_counselling|ghost_scholarship|cross_institution_duplicate|shared_contact|intake_exceeded), academicYear (2024-25|2025-26).
Omit keys that are not mentioned. Never output anything else.`;

const DISC_SYNONYMS: [RegExp, string][] = [
  [/\b(cse|computer science|computer)\b/i, "CSE"],
  [/\b(ece|electronics)\b/i, "ECE"],
  [/\b(mechanical|me)\b/i, "ME"],
  [/\b(civil|ce)\b/i, "CE"],
  [/\b(electrical|ee)\b/i, "EE"],
  [/\b(information technology|it)\b/i, "IT"],
  [/\b(ai|data science|ai&ds)\b/i, "AI&DS"],
  [/\bmba\b/i, "MBA"],
  [/\bmca\b/i, "MCA"],
];

export function keywordParse(q: string): SearchFilterT {
  const f: SearchFilterT = {};
  const s = q.toLowerCase();
  const st = STATES.find((x) => s.includes(x.name.toLowerCase()));
  if (st) f.state = st.name;
  const rg = REGIONS.find((r) => s.includes(r.toLowerCase() + " region"));
  if (rg) f.region = rg;
  for (const [re, d] of DISC_SYNONYMS) if (re.test(q)) { f.discipline = d; break; }
  if (/(exceed|over|beyond|breach)\w*\s*(the\s*)?(approved\s*)?intake|over-?intake/i.test(q)) f.exceedingIntake = true;
  if (/near(ing)?\s*(the\s*)?limit|almost full|90%/i.test(q)) f.nearLimit = true;
  const risk = s.match(/risk\s*(score)?\s*(above|over|>|>=)\s*(\d{1,3})/);
  if (risk) f.minRiskScore = Number(risk[3]);
  else if (/high[- ]risk/.test(s)) f.minRiskScore = 50;
  if (/non-?compliant|red badge/.test(s)) f.badge = "red";
  if (/needs attention|amber/.test(s)) f.badge = "amber";
  if (/counsel+ing/.test(s)) f.flagType = "no_counselling";
  if (/ghost|scholarship/.test(s)) f.flagType = "ghost_scholarship";
  if (/double|two institutions|duplicate enrol/.test(s)) f.flagType = "cross_institution_duplicate";
  if (/shared (phone|contact|mobile|email)/.test(s)) f.flagType = "shared_contact";
  for (const t of ["government", "private", "deemed", "autonomous"]) if (s.includes(t)) f.institutionType = (t[0].toUpperCase() + t.slice(1)) as SearchFilterT["institutionType"];
  const ay = q.match(/20\d\d-\d\d/);
  if (ay && ["2024-25", "2025-26"].includes(ay[0])) f.academicYear = ay[0] as SearchFilterT["academicYear"];
  return f;
}

export async function parseQuery(q: string): Promise<{ filter: SearchFilterT; engine: "llm" | "keyword" }> {
  const llm = await chatJson(SYSTEM, q.slice(0, 500));
  if (llm && typeof llm === "object") {
    const parsed = SearchFilter.safeParse(llm);
    if (parsed.success && Object.keys(parsed.data).length) return { filter: parsed.data, engine: "llm" };
  }
  return { filter: keywordParse(q), engine: "keyword" };
}

export const DEFAULT_SEARCH_YEAR = CURRENT_YEAR;
