/**
 * npm run seed — resets the database and loads demo data:
 * ~50 institutions in 10 states, ~5,000 students over 2 academic years, mock APAAR / counselling / NSP datasets,
 * seat ledger tokens, demo users and the planted frauds described in the README.
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import mongoose, { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { apaarToken, contactHash, encrypt, parentHash } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { DEFAULT_RULES } from "@/lib/rules";
import { seatQuota } from "@/lib/ledger";
import { snapshotOf, enrolStudent } from "@/lib/students";
import { processRows } from "@/lib/intake";
import { runAllChecks } from "@/lib/checks";
import { requestConsent } from "@/lib/consent";
import { releaseTransfer, completeTransfer } from "@/lib/transfers";
import { templateBuffer } from "@/lib/template";
import { phoneticNormalise } from "@/lib/validation/fuzzy";
import { STATES } from "@/lib/constants";
import type { StudentRow } from "@/lib/validation/schema";
import type { Actor } from "@/lib/api";
import {
  ApaarRegistry, CounsellingAllotment, Grievance, Institution, Rules, ScholarshipRecord, SeatToken, Student, Transfer, UploadBatch, User,
  type InstitutionDoc,
} from "@/models";

// ---------- deterministic randomness ----------
let seed = 20251028;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)];
const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const weighted = <T,>(pairs: [T, number][]) => {
  const r = rand() * pairs.reduce((a, [, w]) => a + w, 0);
  let acc = 0;
  for (const [v, w] of pairs) if ((acc += w) >= r) return v;
  return pairs[0][0];
};
const pad = (n: number) => String(n).padStart(2, "0");

const MALE = ["Aarav", "Vihaan", "Aditya", "Arjun", "Rohan", "Karan", "Rahul", "Siddharth", "Ishaan", "Pranav", "Harsh", "Yash", "Kunal", "Nikhil", "Varun", "Aniket", "Omkar", "Sai", "Manish", "Abhishek", "Tejas", "Rajat", "Deepak", "Gaurav", "Vivek", "Amit", "Suresh", "Kartik", "Mohit", "Akash"];
const FEMALE = ["Ananya", "Diya", "Isha", "Priya", "Sneha", "Pooja", "Kavya", "Riya", "Aditi", "Shreya", "Neha", "Tanvi", "Meera", "Sakshi", "Nandini", "Aishwarya", "Divya", "Harini", "Lakshmi", "Swati", "Pallavi", "Komal", "Ritika", "Anjali", "Bhavana", "Gauri", "Ira", "Jyoti", "Madhuri", "Nisha"];
const SURNAMES: Record<string, string[]> = {
  Maharashtra: ["Patil", "Deshmukh", "Kulkarni", "Joshi", "Pawar", "Shinde", "Jadhav", "Gaikwad", "More", "Chavan"],
  Gujarat: ["Patel", "Shah", "Mehta", "Desai", "Parmar", "Chauhan", "Joshi", "Trivedi", "Vyas", "Solanki"],
  Karnataka: ["Gowda", "Rao", "Hegde", "Shetty", "Nayak", "Kamath", "Bhat", "Kulkarni", "Reddy", "Naik"],
  "Tamil Nadu": ["Iyer", "Krishnan", "Murugan", "Subramanian", "Raman", "Pillai", "Natarajan", "Rajan", "Sundaram", "Venkatesh"],
  Telangana: ["Reddy", "Rao", "Goud", "Naidu", "Yadav", "Chary", "Varma", "Kumar", "Sharma", "Raju"],
  "Uttar Pradesh": ["Sharma", "Verma", "Yadav", "Singh", "Gupta", "Mishra", "Tiwari", "Pandey", "Srivastava", "Shukla"],
  "West Bengal": ["Banerjee", "Chatterjee", "Mukherjee", "Das", "Ghosh", "Bose", "Sen", "Roy", "Dutta", "Majumdar"],
  "Madhya Pradesh": ["Sharma", "Patel", "Chouhan", "Jain", "Tiwari", "Dubey", "Rajput", "Thakur", "Soni", "Agrawal"],
  Rajasthan: ["Sharma", "Meena", "Rathore", "Choudhary", "Agarwal", "Joshi", "Shekhawat", "Gupta", "Saini", "Jat"],
  Delhi: ["Sharma", "Gupta", "Arora", "Malhotra", "Kapoor", "Khanna", "Bansal", "Sethi", "Chopra", "Mehra"],
};
const CITIES: Record<string, string[]> = {
  Maharashtra: ["Pune", "Mumbai", "Nagpur", "Nashik", "Aurangabad"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  Telangana: ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Khammam"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Varanasi", "Prayagraj"],
  "West Bengal": ["Kolkata", "Durgapur", "Siliguri", "Howrah", "Asansol"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
  Rajasthan: ["Jaipur", "Jodhpur", "Kota", "Udaipur", "Ajmer"],
  Delhi: ["New Delhi", "Dwarka", "Rohini", "Okhla", "Narela"],
};
const NAME_PATTERNS = ["{c} Institute of Technology", "Government College of Engineering, {c}", "{c} College of Engineering & Management", "Sri Venkateshwara Institute of Technology, {c}", "{c} School of Engineering"];
const PROGRAM_CATALOG = [
  { name: "B.Tech Computer Science & Engineering", level: "UG", discipline: "CSE" },
  { name: "B.Tech Electronics & Communication", level: "UG", discipline: "ECE" },
  { name: "B.Tech Mechanical Engineering", level: "UG", discipline: "ME" },
  { name: "B.Tech Civil Engineering", level: "UG", discipline: "CE" },
  { name: "B.Tech Information Technology", level: "UG", discipline: "IT" },
  { name: "B.Tech AI & Data Science", level: "UG", discipline: "AI&DS" },
  { name: "MBA", level: "PG", discipline: "MBA" },
  { name: "MCA", level: "PG", discipline: "MCA" },
] as const;
const COMPANIES = ["Infosys", "TCS", "Wipro", "HCLTech", "L&T", "Tata Motors", "Accenture", "Cognizant", "Bosch", "Mahindra"];
const UNIVERSITIES = ["IIT Bombay", "IISc Bengaluru", "NIT Trichy", "IIM Ahmedabad", "University of Hyderabad", "Jadavpur University"];
const YEARS = ["2024-25", "2025-26"] as const;

let apaarCounter = 0;
const newApaar = () => String(100000000000 + ++apaarCounter * 7919 + int(0, 7000)).slice(0, 12);
const usedPhones = new Set<string>();
const newPhone = () => {
  let p: string;
  do p = `${pick(["9", "8", "7"])}${int(100000000, 999999999)}`;
  while (usedPhones.has(p));
  usedPhones.add(p);
  return p;
};
const dobFor = (year: string) => `${Number(year.slice(0, 4)) - int(18, 20)}-${pad(int(1, 12))}-${pad(int(1, 28))}`;
const admissionFor = (year: string) => `${year.slice(0, 4)}-${pad(int(7, 9))}-${pad(int(1, 28))}`;

type Person = { name: string; gender: "M" | "F" | "T"; parentName: string };
function person(state: string): Person {
  const gender = weighted<"M" | "F" | "T">([["M", 60], ["F", 39], ["T", 1]]);
  const surname = pick(SURNAMES[state]);
  const first = gender === "F" ? pick(FEMALE) : pick(MALE);
  return { name: `${first} ${surname}`, gender, parentName: `${pick(MALE)} ${surname}` };
}

/** Deterministic ObjectIds so sessions stay valid across reseeds (same id for the same institution / user) */
const stableId = (key: string) => new Types.ObjectId(createHash("sha256").update(key).digest("hex").slice(0, 24));

const SEED_ACTOR: Pick<Actor, "email" | "role"> = { email: "system:seed", role: "INSTITUTION" };

async function main() {
  const t0 = Date.now();
  await dbConnect();
  console.log("Connected. Resetting database…");
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));

  await Rules.create({ key: "global", ...DEFAULT_RULES, updatedBy: "system:seed" });
  const rules = DEFAULT_RULES;
  await audit({ actor: "system:seed", role: "SYSTEM", action: "seed.start", entity: "System" });

  // ---------- institutions ----------
  const instDocs: InstitutionDoc[] = [];
  for (const st of STATES) {
    const code = st.code.toUpperCase();
    for (let i = 1; i <= 5; i++) {
      const city = CITIES[st.name][i - 1];
      const type = i === 2 ? "Government" : i === 1 && code === "MH" ? "Autonomous" : weighted([["Private", 6], ["Autonomous", 2], ["Deemed", 1], ["Government", 1]] as [string, number][]);
      const nProg = int(3, 4);
      const chosen = [...PROGRAM_CATALOG].sort(() => rand() - 0.5).slice(0, nProg);
      if (code === "MH" && i === 1) chosen.splice(0, chosen.length, PROGRAM_CATALOG[0], PROGRAM_CATALOG[1], PROGRAM_CATALOG[2], PROGRAM_CATALOG[6]);
      const programs = chosen.map((p, k) => ({
        programId: `P${k + 1}`,
        name: p.name,
        level: p.level,
        discipline: p.discipline,
        approvedIntake: code === "MH" && i === 1 ? [30, 30, 20, 30][k] : pick([15, 20, 20, 25]),
        supernumeraryApproved: { nri: int(2, 5), oci: 1, fn: 1, tfw: int(1, 2), other: 0 },
      }));
      instDocs.push({
        _id: stableId(`inst:${code}-${i}`),
        aicteId: `AICTE-${code}-${String(i).padStart(4, "0")}`,
        name: pick(NAME_PATTERNS).replace("{c}", city) + (i === 1 && code === "MH" ? "" : ""),
        state: st.name,
        district: city,
        region: st.region,
        address: `${int(1, 200)}, Knowledge Park, ${city}, ${st.name}`,
        type,
        isDegreeAwarding: type === "Deemed" || type === "Autonomous",
        affiliatedUniversityId: `UNIV-${code}-${int(1, 9)}`,
        contactPhone: newPhone(),
        programs,
        complianceScore: 100,
        riskScore: 0,
        riskReasons: [],
        badge: "green",
        accreditation: { nba: rand() > 0.5, naacGrade: pick(["A++", "A+", "A", "B++", "B+"]) },
      } as unknown as InstitutionDoc);
    }
  }
  // Give the demo institutions memorable names
  const byAicte = (id: string) => instDocs.find((i) => i.aicteId === id)!;
  byAicte("AICTE-MH-0001").name = "Pune Institute of Engineering & Technology";
  byAicte("AICTE-MH-0003").name = "Nagpur Institute of Technology";
  byAicte("AICTE-RJ-0002").name = "Government College of Engineering, Jodhpur";
  byAicte("AICTE-RJ-0002").type = "Private";
  byAicte("AICTE-RJ-0002").name = "Jodhpur Global Institute of Technology";
  byAicte("AICTE-TG-0002").name = "Warangal College of Engineering";
  byAicte("AICTE-UP-0003").name = "Noida Institute of Engineering & Technology";
  await Institution.insertMany(instDocs);
  console.log(`Institutions: ${instDocs.length}`);

  // ---------- seat tokens ----------
  const tokenDocs: Record<string, unknown>[] = [];
  for (const inst of instDocs)
    for (const p of inst.programs)
      for (const y of YEARS) {
        const q = seatQuota(p, rules);
        for (const [seatType, count] of Object.entries(q))
          for (let n = 1; n <= count; n++)
            tokenDocs.push({ _id: new Types.ObjectId(), institutionId: inst._id, programId: p.programId, academicYear: y, seatType, seatNo: n, status: "available" });
      }
  // index for quick allocation in memory
  const freeTokens = new Map<string, Record<string, unknown>[]>();
  for (const t of tokenDocs) {
    const k = `${t.institutionId}|${t.programId}|${t.academicYear}|${t.seatType}`;
    if (!freeTokens.has(k)) freeTokens.set(k, []);
    freeTokens.get(k)!.push(t);
  }
  const takeToken = (inst: InstitutionDoc, programId: string, year: string, seatType: string, tok: string) => {
    const list = freeTokens.get(`${inst._id}|${programId}|${year}|${seatType}`);
    const t = list?.find((x) => x.status === "available");
    if (!t) return false;
    Object.assign(t, { status: "consumed", studentApaarToken: tok, consumedAt: new Date(`${year.slice(0, 4)}-08-15`) });
    return true;
  };

  // ---------- students ----------
  const students: Record<string, unknown>[] = [];
  const registry: Record<string, unknown>[] = [];
  const allotments: Record<string, unknown>[] = [];
  const scholarships: Record<string, unknown>[] = [];
  const noCounsellingTargets = new Map<string, number>([["AICTE-UP-0002", 10], ["AICTE-KA-0001", 5]]);

  type Mk = { inst: InstitutionDoc; programId: string; year: string; seatType?: string; nationality?: string; status?: string; phone?: string; person?: Person; dob?: string; apaar?: string; counselling?: boolean; category?: string };
  const make = ({ inst, programId, year, seatType = "regular", nationality = "Indian", status = "active", phone, person: pp, dob, apaar, counselling = true, category }: Mk) => {
    const p = pp ?? person(inst.state);
    const apaarId = apaar ?? newApaar();
    const tok = apaarToken(apaarId);
    if (!takeToken(inst, programId, year, seatType, tok)) return null;
    const ph = phone ?? newPhone();
    const email = `${p.name.toLowerCase().replace(/\s+/g, ".")}${int(1, 999)}@example.in`;
    const program = inst.programs.find((x) => x.programId === programId)!;
    const doc: Record<string, unknown> = {
      _id: new Types.ObjectId(),
      apaarId,
      apaarToken: tok,
      institutionStudentId: `${inst.aicteId.slice(6, 8)}${year.slice(2, 4)}${programId}${String(students.length + 1).padStart(5, "0")}`,
      name: p.name,
      nameNormalised: phoneticNormalise(p.name),
      dob: dob ?? dobFor(year),
      gender: p.gender,
      parentName: encrypt(p.parentName),
      parentHash: parentHash(p.parentName),
      phone: encrypt(ph),
      phoneHash: contactHash(ph),
      email: encrypt(email),
      emailHash: contactHash(email),
      category: category ?? (nationality === "Indian" || nationality === "NRI" ? weighted([["General", 45], ["OBC", 27], ["SC", 15], ["ST", 7], ["EWS", 6]] as [string, number][]) : "General"),
      nationalityStatus: nationality,
      seatType,
      institutionId: inst._id,
      programId,
      academicYear: year,
      admissionDate: admissionFor(year),
      counsellingRef: counselling ? `CAP-${year.slice(0, 4)}-${int(10000, 99999)}` : undefined,
      status,
      outcome: { type: "none", consentGiven: false },
      version: 1,
    };
    doc.history = [{ version: 1, changedBy: "system:seed", changedAt: new Date(`${year.slice(0, 4)}-09-01`), diff: { created: true }, snapshot: snapshotOf(doc as never) }];
    students.push(doc);
    registry.push({ apaarId, name: p.name, dob: doc.dob, gender: p.gender, status: "active" });
    if (counselling) allotments.push({ apaarId, name: p.name, institutionAicteId: inst.aicteId, programName: program.name, round: int(1, 3), year });
    if (rand() < 0.1) scholarships.push({ apaarId, name: p.name, institutionAicteId: inst.aicteId, scheme: pick(["AICTE Pragati", "AICTE Saksham", "Post-Matric SC", "Central Sector Scheme"]), amount: pick([30000, 50000, 25000]), year });
    return doc;
  };

  for (const inst of instDocs) {
    const special = inst.aicteId;
    for (const year of YEARS) {
      for (const p of inst.programs) {
        let fill = 0.55 + rand() * 0.37;
        if (special === "AICTE-RJ-0002") fill = year === "2024-25" ? 0.3 : 1; // +200% YoY
        if (special === "AICTE-MH-0001" && year === "2025-26") fill = p.programId === "P2" ? 1 : 0.6; // P2 full (live demo)
        if (special === "AICTE-MH-0003" && year === "2025-26" && p.programId === "P1") fill = 1; // breach attempts target
        if (special === "AICTE-GJ-0004" && year === "2025-26") fill = 0.6; // room for the planted double enrolments
        const n = Math.round(p.approvedIntake * fill);
        for (let k = 0; k < n; k++) {
          let counselling = true;
          const left = noCounsellingTargets.get(special);
          if (year === "2025-26" && left) {
            counselling = false;
            noCounsellingTargets.set(special, left - 1);
          }
          make({ inst, programId: p.programId, year, counselling });
        }
        // a few supernumerary admissions (and many at the high-NRI institution)
        const q = seatQuota(p, rules);
        const nri = special === "AICTE-RJ-0002" && year === "2025-26" ? q.nri : rand() < 0.4 ? int(0, Math.min(2, q.nri)) : 0;
        for (let k = 0; k < nri; k++) make({ inst, programId: p.programId, year, seatType: "nri", nationality: "NRI" });
        const fn = special === "AICTE-RJ-0002" && year === "2025-26" ? q.fn : rand() < 0.15 ? Math.min(1, q.fn) : 0;
        for (let k = 0; k < fn; k++) make({ inst, programId: p.programId, year, seatType: "fn", nationality: "FN" });
        if (rand() < 0.3 && q.tfw) make({ inst, programId: p.programId, year, seatType: "tfw" });
      }
    }
  }

  // graduates + outcomes from the 2024-25 PG cohort, some dropped students
  for (const s of students) {
    if (s.academicYear !== "2024-25") continue;
    const inst = instDocs.find((i) => String(i._id) === String(s.institutionId))!;
    const level = inst.programs.find((p) => p.programId === s.programId)?.level;
    if (level === "PG" && rand() < 0.7) {
      s.status = "graduated";
      const r = rand();
      s.outcome = r < 0.6 ? { type: "placement", organisation: pick(COMPANIES), year: 2026, consentGiven: rand() < 0.8 } : r < 0.8 ? { type: "higher-studies", organisation: pick(UNIVERSITIES), year: 2026, consentGiven: true } : { type: "none", consentGiven: false };
    }
  }
  // Planted 3: ghost students – dropped students at TG-0002 still paid scholarships, plus never-enrolled APAARs
  const tg = byAicte("AICTE-TG-0002");
  const tgStudents = students.filter((s) => String(s.institutionId) === String(tg._id) && s.academicYear === "2025-26").slice(0, 5);
  for (const s of tgStudents) {
    s.status = "dropped";
    for (let j = scholarships.length - 1; j >= 0; j--) if (scholarships[j].apaarId === s.apaarId) scholarships.splice(j, 1);
    const t = tokenDocs.find((x) => x.studentApaarToken === s.apaarToken);
    if (t) Object.assign(t, { status: "released", studentApaarToken: undefined, consumedAt: undefined });
    scholarships.push({ apaarId: s.apaarId, name: s.name, institutionAicteId: tg.aicteId, scheme: "AICTE Pragati", amount: 50000, year: "2025-26" });
  }
  for (let k = 0; k < 5; k++) {
    const p = person("Telangana");
    const apaarId = newApaar();
    registry.push({ apaarId, name: p.name, dob: dobFor("2025-26"), gender: p.gender, status: "active" });
    scholarships.push({ apaarId, name: p.name, institutionAicteId: tg.aicteId, scheme: pick(["Post-Matric SC", "AICTE Saksham"]), amount: 50000, year: "2025-26" });
  }

  // Planted 4: five students active at two institutions (GJ-0001 and GJ-0004)
  const gj1 = byAicte("AICTE-GJ-0001");
  const gj4 = byAicte("AICTE-GJ-0004");
  const dupSources = students.filter((s) => String(s.institutionId) === String(gj1._id) && s.academicYear === "2025-26" && s.status === "active").slice(0, 5);
  for (const s of dupSources) {
    const prog = gj4.programs[0];
    const tok = s.apaarToken as string;
    if (!takeToken(gj4, prog.programId, "2025-26", "regular", tok)) continue;
    const copy: Record<string, unknown> = { ...s, _id: new Types.ObjectId(), institutionId: gj4._id, programId: prog.programId, institutionStudentId: `GJ4-${String(s.institutionStudentId)}` };
    copy.history = [{ version: 1, changedBy: "system:seed", changedAt: new Date("2025-09-05"), diff: { created: true }, snapshot: snapshotOf(copy as never) }];
    students.push(copy);
    allotments.push({ apaarId: s.apaarId, name: s.name, institutionAicteId: gj4.aicteId, programName: prog.name, round: 2, year: "2025-26" });
  }

  // Planted 5: one phone number shared by 8 students (UP-0003)
  const up3 = byAicte("AICTE-UP-0003");
  const shared = "9811100008";
  usedPhones.add(shared);
  for (let k = 0; k < 8; k++) {
    const prog = up3.programs[k % up3.programs.length];
    const tokOk = make({ inst: up3, programId: prog.programId, year: "2025-26", phone: shared });
    if (!tokOk) {
      // program full: rewrite an existing student's phone instead
      const s = students.find((x) => String(x.institutionId) === String(up3._id) && x.academicYear === "2025-26" && x.phoneHash !== contactHash(shared));
      if (s) Object.assign(s, { phone: encrypt(shared), phoneHash: contactHash(shared) });
    }
  }

  // Planted 6: fuzzy duplicate base record – "Subodh Patel" at MH-0002
  const mh2 = byAicte("AICTE-MH-0002");
  const subodh = make({ inst: mh2, programId: "P1", year: "2025-26", person: { name: "Subodh Patel", gender: "M", parentName: "Ramesh Patel" }, dob: "2006-03-14" }) ?? make({ inst: mh2, programId: "P2", year: "2025-26", person: { name: "Subodh Patel", gender: "M", parentName: "Ramesh Patel" }, dob: "2006-03-14" });

  // Late bulk upload at the high-risk institution (Planted 7 context)
  const rj2 = byAicte("AICTE-RJ-0002");

  // The demo student
  const mh1 = byAicte("AICTE-MH-0001");
  const demoStudent = students.find((s) => String(s.institutionId) === String(mh1._id) && s.academicYear === "2025-26" && s.programId === "P1" && s.seatType === "regular")!;
  const demoPhone = "9876500001";
  usedPhones.add(demoPhone);
  Object.assign(demoStudent, { name: "Aarav Sharma", nameNormalised: phoneticNormalise("Aarav Sharma"), gender: "M", dob: "2006-04-15", phone: encrypt(demoPhone), phoneHash: contactHash(demoPhone), email: encrypt("aarav.sharma@example.in"), emailHash: contactHash("aarav.sharma@example.in"), parentName: encrypt("Rakesh Sharma"), parentHash: parentHash("Rakesh Sharma"), category: "OBC" });
  (demoStudent.history as { snapshot: unknown }[])[0].snapshot = snapshotOf(demoStudent as never);
  const reg = registry.find((r) => r.apaarId === demoStudent.apaarId)!;
  Object.assign(reg, { name: "Aarav Sharma", dob: "2006-04-15", gender: "M" });
  const al = allotments.find((a) => a.apaarId === demoStudent.apaarId);
  if (al) al.name = "Aarav Sharma";

  // ---------- bulk insert ----------
  for (let i = 0; i < students.length; i += 1000) await Student.insertMany(students.slice(i, i + 1000), { ordered: false });
  for (let i = 0; i < tokenDocs.length; i += 5000) await SeatToken.insertMany(tokenDocs.slice(i, i + 5000), { ordered: false });
  await ApaarRegistry.insertMany(registry, { ordered: false });
  await CounsellingAllotment.insertMany(allotments, { ordered: false });
  await ScholarshipRecord.insertMany(scholarships, { ordered: false });
  console.log(`Students: ${students.length} · seat tokens: ${tokenDocs.length} · registry: ${registry.length} · allotments: ${allotments.length} · scholarships: ${scholarships.length}`);

  // ---------- users ----------
  const hash = await bcrypt.hash("Demo@123", 10);
  await User.insertMany([
    { name: "Dr. Meenakshi Rao", _id: stableId("user:admin@aicte.demo"), email: "admin@aicte.demo", passwordHash: hash, role: "AICTE_ADMIN", permission: "full", phone: encrypt("9000000001") },
    { name: "Shri Anil Kulkarni", _id: stableId("user:regional@aicte.demo"), email: "regional@aicte.demo", passwordHash: hash, role: "AICTE_ADMIN", permission: "regional", region: "Western", phone: encrypt("9000000002") },
    { name: "NBA / NAAC Reviewer", _id: stableId("user:regulator@aicte.demo"), email: "regulator@aicte.demo", passwordHash: hash, role: "AICTE_ADMIN", permission: "readonly", phone: encrypt("9000000003") },
    { name: "Prof. Sunita Deshpande", _id: stableId("user:institute@demo"), email: "institute@demo", passwordHash: hash, role: "INSTITUTION", permission: "admin", institutionId: mh1._id, phone: encrypt(mh1.contactPhone!) },
    { name: "Rahul Jadhav", _id: stableId("user:operator@demo"), email: "operator@demo", passwordHash: hash, role: "INSTITUTION", permission: "operator", institutionId: mh1._id, phone: encrypt("9000000005") },
    { name: "Aarav Sharma", _id: stableId("user:student@demo"), email: "student@demo", passwordHash: hash, role: "STUDENT", permission: "self", studentApaar: demoStudent.apaarId, phone: encrypt(demoPhone) },
  ]);

  const loadInst = async (id: Types.ObjectId) => (await Institution.findById(id).lean<InstitutionDoc>())!;

  // ---------- Planted 1: admissions beyond intake at MH-0003 (blocked by the seat ledger) ----------
  const mh3 = await loadInst(byAicte("AICTE-MH-0003")._id);
  for (let k = 0; k < 2; k++) {
    const p = person("Maharashtra");
    const apaar = newApaar();
    await ApaarRegistry.create({ apaarId: apaar, name: p.name, dob: "2006-07-07", gender: p.gender, status: "active" });
    await enrolStudent(
      { apaarId: apaar, institutionStudentId: "", name: p.name, dob: "2006-07-07", gender: p.gender, parentName: p.parentName, phone: newPhone(), email: "", category: "General", nri: "N", oci: "N", foreignNational: "N", seatType: "regular", programId: "P1", academicYear: "2025-26", admissionDate: "2025-08-20", counsellingRef: "", status: "active" },
      mh3,
      { email: "admissions@nit-nagpur.demo", role: "INSTITUTION" }
    );
  }
  console.log("Planted: 2 over-intake admission attempts blocked at MH-0003");

  // ---------- Planted 6: "Suboth Patel" (same DOB + parent, different APAAR) via the real pipeline ----------
  const mh4 = await loadInst(byAicte("AICTE-MH-0004")._id);
  const subothApaar = newApaar();
  await ApaarRegistry.create({ apaarId: subothApaar, name: "Suboth Patel", dob: "2006-03-14", gender: "M", status: "active" });
  await CounsellingAllotment.create({ apaarId: subothApaar, name: "Suboth Patel", institutionAicteId: mh4.aicteId, programName: mh4.programs[0].name, round: 1, year: "2025-26" });
  const subothRow: StudentRow = { apaarId: subothApaar, institutionStudentId: "MH4-25-0999", name: "Suboth Patel", dob: "2006-03-14", gender: "M", parentName: "Ramesh Patel", phone: newPhone(), email: "suboth.p@example.in", category: "General", nri: "N", oci: "N", foreignNational: "N", seatType: "regular", programId: mh4.programs[0].programId, academicYear: "2025-26", admissionDate: "2025-08-18", counsellingRef: "CAP-2025-55120", status: "active" };
  // free a seat if the program happens to be full
  await SeatToken.updateOne({ institutionId: mh4._id, programId: mh4.programs[0].programId, academicYear: "2025-26", seatType: "regular", status: "consumed" }, { $set: { status: "released" }, $unset: { studentApaarToken: 1 } });
  await processRows([subothRow], mh4, { ...SEED_ACTOR, id: "seed", name: "Seed", permission: "operator", via: "session" } as Actor);
  console.log(`Planted: fuzzy duplicate Subodh Patel${subodh ? "" : " (base missing)"} ≈ Suboth Patel`);

  // ---------- late bulk upload batch (final hour before deadline) ----------
  await UploadBatch.create({ institutionId: rj2._id, uploadedBy: "admissions@jgit.demo", fileName: "final_admissions_2025.xlsx", rowCount: 120, validRows: 118, errorRows: 2, status: "approved", submittedAt: new Date(DEFAULT_RULES.deadlineDate.getTime() - 25 * 60000), approvedAt: new Date(DEFAULT_RULES.deadlineDate.getTime() - 20 * 60000), approvedBy: "principal@jgit.demo", results: [] });

  // ---------- completed transfer: KA-0002 → MH-0001 ----------
  const ka2 = byAicte("AICTE-KA-0002");
  const withScholarship = await ScholarshipRecord.distinct("apaarId");
  const mover = await Student.findOne({ institutionId: ka2._id, academicYear: "2025-26", status: "active", seatType: "regular", apaarId: { $nin: withScholarship } });
  if (mover) {
    const mh1Inst = await loadInst(mh1._id);
    await CounsellingAllotment.create({ apaarId: mover.apaarId, name: mover.name, institutionAicteId: mh1Inst.aicteId, programName: mh1Inst.programs[0].name, round: 3, year: "2025-26" });
    const t = await Transfer.create({ apaarId: mover.apaarId, studentName: mover.name, fromInstitutionId: ka2._id, toInstitutionId: mh1._id, toProgramId: "P1", academicYear: "2025-26", reason: "Family relocated to Pune", status: "requested", requestedAt: new Date("2025-09-20") });
    const fromActor = { id: "seed", name: "KA admin", email: "admin@ka2.demo", role: "INSTITUTION", permission: "admin", institutionId: String(ka2._id), via: "session" } as Actor;
    const toActor = { id: "seed", name: "Prof. Sunita Deshpande", email: "institute@demo", role: "INSTITUTION", permission: "admin", institutionId: String(mh1._id), via: "session" } as Actor;
    await releaseTransfer(t, fromActor);
    await completeTransfer(t, toActor);
    Object.assign(t, { status: "completed", releasedAt: new Date("2025-09-22"), completedAt: new Date("2025-09-25") });
    await t.save();
    console.log(`Completed transfer: ${mover.name} KA-0002 → MH-0001`);
  }

  // ---------- pending consent, open grievance, recorded outcome for the demo student ----------
  const consent = await requestConsent(
    { apaarId: demoStudent.apaarId as string, requesterName: "Infosys Ltd – HR Verification", requesterContact: "919800000001", requesterType: "employer", purpose: "employment", purposeNote: "Offer letter – Systems Engineer", fieldsAllowed: ["name", "institution", "program", "academicYear", "status"], frequency: "until-expiry", validDays: 14 },
    "verifier:919800000001"
  );
  await Grievance.create({ studentApaar: demoStudent.apaarId, institutionId: mh1._id, field: "name", currentValue: "Aarav Sharma", requestedValue: "Aarav Rakesh Sharma", reason: "Full name as per 10th marksheet", status: "open" });
  const grad = await Student.findOne({ status: "graduated", "outcome.type": "placement", "outcome.consentGiven": true });

  // ---------- demo upload file (/public/samples/demo-upload.xlsx) ----------
  const mh1Inst = await loadInst(mh1._id);
  const demoRows: Partial<StudentRow>[] = [];
  const regDocs: Record<string, unknown>[] = [];
  const allotDocs: Record<string, unknown>[] = [];
  const baseRow = (prog: string, nameOverride?: Person) => {
    const p = nameOverride ?? person("Maharashtra");
    return { institutionStudentId: `PIET25${prog}${int(1000, 9999)}`, name: p.name, dob: dobFor("2025-26"), gender: p.gender, parentName: p.parentName, phone: newPhone(), email: `${p.name.toLowerCase().replace(/\s+/g, ".")}@example.in`, category: weighted([["General", 50], ["OBC", 30], ["SC", 12], ["ST", 4], ["EWS", 4]] as [string, number][]), nri: "N", oci: "N", foreignNational: "N", seatType: "regular", programId: prog, academicYear: "2025-26", admissionDate: `2025-08-${pad(int(1, 28))}`, counsellingRef: `CAP-2025-${int(10000, 99999)}`, status: "active" };
  };
  for (let k = 0; k < 22; k++) {
    const prog = k < 20 ? pick(["P1", "P3", "P4"]) : "P2"; // last 2 rows target the full program → blocked by the ledger
    const r = { ...baseRow(prog), apaarId: newApaar() };
    demoRows.push(r);
    regDocs.push({ apaarId: r.apaarId, name: r.name, dob: r.dob, gender: r.gender, status: "active" });
    allotDocs.push({ apaarId: r.apaarId, name: r.name, institutionAicteId: mh1Inst.aicteId, programName: mh1Inst.programs.find((p) => p.programId === prog)!.name, round: 1, year: "2025-26" });
  }
  const badApaars = ["", "", "", "", "", "", "", "", "", "", "12345678901", "1234567890123", "ABCD12345678", "1234-5678-901", "98765432100A", "000", "12 34 56 78 90", "123456789O12", "4567891230", "1e+11"];
  for (const a of badApaars) demoRows.push({ ...baseRow(pick(["P1", "P3", "P4"])), apaarId: a });
  // two extra inconsistencies to showcase other rules
  demoRows.push({ ...baseRow("P1"), apaarId: newApaar(), oci: "Y", foreignNational: "Y", seatType: "fn" });
  demoRows.push({ ...baseRow("P4"), apaarId: newApaar(), foreignNational: "Y", category: "OBC", seatType: "fn" });
  await ApaarRegistry.insertMany(regDocs);
  await CounsellingAllotment.insertMany(allotDocs);
  mkdirSync(join(process.cwd(), "public", "samples"), { recursive: true });
  writeFileSync(join(process.cwd(), "public", "samples", "demo-upload.xlsx"), templateBuffer(mh1Inst.programs.map((p) => ({ id: p.programId, name: p.name })), demoRows));
  console.log(`Demo upload file: ${demoRows.length} rows (20 invalid/missing APAAR, 2 over intake, 2 inconsistent)`);

  // ---------- run all fraud checks (counselling, ghost scholarship, double enrolment, shared contacts, late upload) + risk ----------
  console.log("Running fraud checks and risk scoring…");
  const checks = await runAllChecks();
  await audit({ actor: "system:seed", role: "SYSTEM", action: "seed.complete", entity: "System", after: { students: students.length, institutions: instDocs.length } });

  const counts = await Promise.all([Student.countDocuments(), Institution.countDocuments(), SeatToken.countDocuments({ status: "consumed" })]);
  console.log("\n================ SEED COMPLETE ================");
  console.log(`Students ${counts[0]} · Institutions ${counts[1]} · Seats consumed ${counts[2]} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log("Checks:", JSON.stringify({ counselling: checks.counselling.flagged, ghostScholarships: checks.scholarship.flagged, doubleEnrolled: checks.crossDuplicates.flagged, sharedContacts: checks.sharedContacts.flagged }));
  console.log("\nDemo logins (password Demo@123): admin@aicte.demo · regional@aicte.demo · regulator@aicte.demo · institute@demo · operator@demo · student@demo");
  console.log(`Demo student APAAR: ${demoStudent.apaarId} (WhatsApp +91${demoPhone})`);
  console.log(`Pending consent: ${consent?.consentId} from Infosys – code ${consent?.code} (student replies "YES ${consent?.code}", then employer sends "VERIFY ${demoStudent.apaarId} ${consent?.code}")`);
  if (grad) console.log(`Recorded outcome example: ${grad.name} – ${grad.outcome?.organisation}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
