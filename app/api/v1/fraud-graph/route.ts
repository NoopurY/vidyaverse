import { route, institutionScope, canSeePII } from "@/lib/api";
import { getRules } from "@/lib/rules";
import { refId } from "@/lib/crypto";
import { maskName } from "@/lib/utils";
import { ISSUE_LABEL } from "@/lib/constants";
import { Alert, Institution, Student, ValidationIssue } from "@/models";

export const dynamic = "force-dynamic";

export const maxDuration = 60; // seconds (Vercel function limit for heavy jobs)

type Node = { id: string; kind: "student" | "institution" | "contact"; label: string; suspicious: boolean; details: Record<string, unknown> };

/** GET /api/v1/fraud-graph — students, institutions and shared contacts (masked) with suspicious clusters */
export const GET = route({ roles: ["AICTE_ADMIN"] }, async ({ actor }) => {
  const rules = await getRules();
  const insts = await Institution.find(institutionScope(actor), { name: 1, state: 1, riskScore: 1, aicteId: 1 }).lean();
  const instIds = insts.map((i) => i._id);
  const pii = canSeePII(actor);

  const [contactGroups, dupGroups] = await Promise.all([
    Student.aggregate([
      { $match: { status: "active", institutionId: { $in: instIds }, phoneHash: { $ne: null } } },
      { $group: { _id: "$phoneHash", n: { $sum: 1 }, students: { $push: { id: "$_id", inst: "$institutionId", name: "$name", apaar: "$apaarId", token: "$apaarToken" } } } },
      { $match: { n: { $gte: 2 } } },
      { $sort: { n: -1 } },
      { $limit: 40 },
    ]),
    Student.aggregate([
      { $match: { status: "active", institutionId: { $in: instIds } } },
      { $group: { _id: "$apaarToken", insts: { $addToSet: "$institutionId" }, students: { $push: { id: "$_id", inst: "$institutionId", name: "$name", apaar: "$apaarId" } } } },
      { $match: { "insts.1": { $exists: true } } },
      { $limit: 40 },
    ]),
  ]);

  const nodes = new Map<string, Node>();
  const links: { source: string; target: string; kind: "enrolment" | "shared-contact" | "same-person"; suspicious: boolean }[] = [];
  const instById = new Map(insts.map((i) => [String(i._id), i]));
  const addInst = (id: string) => {
    const i = instById.get(id);
    if (!i || nodes.has(`i:${id}`)) return;
    nodes.set(`i:${id}`, { id: `i:${id}`, kind: "institution", label: i.name, suspicious: (i.riskScore ?? 0) >= 50, details: { aicteId: i.aicteId, state: i.state, riskScore: i.riskScore, institutionId: id } });
  };
  const addStudent = (s: { id: unknown; inst: unknown; name: string; apaar: string }, suspicious: boolean) => {
    const key = `s:${String(s.id)}`;
    const existing = nodes.get(key);
    if (existing) {
      existing.suspicious ||= suspicious;
      return key;
    }
    nodes.set(key, { id: key, kind: "student", label: pii ? s.name : maskName(s.name), suspicious, details: { apaarId: pii ? s.apaar : undefined, studentId: String(s.id), institutionId: String(s.inst) } });
    addInst(String(s.inst));
    links.push({ source: key, target: `i:${String(s.inst)}`, kind: "enrolment", suspicious: false });
    return key;
  };

  for (const g of contactGroups) {
    const suspicious = g.n >= rules.ghostSharedContactThreshold;
    const cid = `c:${String(g._id).slice(0, 12)}`;
    nodes.set(cid, { id: cid, kind: "contact", label: `Phone ••••${String(g._id).slice(-4)}`, suspicious, details: { sharedBy: g.n, note: "Masked contact (hash)" } });
    for (const s of g.students) links.push({ source: addStudent(s, suspicious), target: cid, kind: "shared-contact", suspicious });
  }
  for (const g of dupGroups) {
    const keys = g.students.map((s: { id: unknown; inst: unknown; name: string; apaar: string }) => addStudent(s, true));
    for (let i = 1; i < keys.length; i++) links.push({ source: keys[0], target: keys[i], kind: "same-person", suspicious: true });
    keys.forEach((k: string) => (nodes.get(k)!.details.ref = refId(g._id)));
  }

  // linked alerts / issues for the side panel
  const studentIds = Array.from(nodes.values()).filter((n) => n.kind === "student").map((n) => n.details.studentId as string);
  const [issues, alerts] = await Promise.all([
    ValidationIssue.find({ studentId: { $in: studentIds }, status: "open" }, { studentId: 1, type: 1, details: 1 }).lean(),
    Alert.find({ institutionId: { $in: Array.from(nodes.values()).filter((n) => n.kind === "institution").map((n) => n.details.institutionId) } }).sort({ createdAt: -1 }).limit(200).lean(),
  ]);
  for (const n of nodes.values()) {
    if (n.kind === "student") n.details.flags = issues.filter((i) => String(i.studentId) === n.details.studentId).map((i) => `${ISSUE_LABEL[i.type] ?? i.type}: ${i.details}`);
    if (n.kind === "institution") n.details.alerts = alerts.filter((a) => String(a.institutionId) === n.details.institutionId).slice(0, 5).map((a) => a.message);
  }
  return {
    nodes: Array.from(nodes.values()),
    links,
    summary: { contactClusters: contactGroups.filter((g) => g.n >= rules.ghostSharedContactThreshold).length, multiInstitution: dupGroups.length, threshold: rules.ghostSharedContactThreshold },
  };
});
