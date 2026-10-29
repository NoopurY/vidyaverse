/** Issues W3C VC Data Model 2.0 credentials for student records: vc+jwt and SD-JWT (vc+sd-jwt), Ed25519. */
import { randomUUID } from "crypto";
import { compactVerify, decodeJwt, SignJWT } from "jose";
import { DEFAULT_DISCLOSED } from "@/lib/constants";
import { Credential, Institution, Student, type StudentDoc } from "@/models";
import { issuerDid, keyId, privateKey, publicJwk, publicKey } from "./keys";
import { makeDisclosure, presentSdJwt, verifySdJwtVc, type StatusChecker } from "./sdjwt";
import { allocateIndex, isRevokedLocal, revokeCredentialsFor, statusListUrl } from "./statuslist";

const STATUS_LABEL: Record<string, string> = {
  active: "Enrolled",
  graduated: "Graduated",
  dropped: "Discontinued",
  transferred: "Transferred out",
};

export async function subjectClaims(s: Pick<StudentDoc, "apaarId" | "name" | "dob" | "institutionId" | "programId" | "academicYear" | "status" | "outcome">) {
  const inst = await Institution.findById(s.institutionId, { name: 1, aicteId: 1, programs: 1 }).lean();
  const program = inst?.programs.find((p) => p.programId === s.programId);
  return {
    apaarId: s.apaarId,
    name: s.name,
    dob: s.dob,
    institution: inst ? `${inst.name} (${inst.aicteId})` : "",
    program: program ? `${program.name} (${program.level})` : s.programId,
    academicYear: s.academicYear,
    status: STATUS_LABEL[s.status ?? "active"] ?? s.status,
    outcome:
      s.outcome?.consentGiven && s.outcome.type && s.outcome.type !== "none"
        ? `${s.outcome.type === "placement" ? "Placed at" : "Higher studies at"} ${s.outcome.organisation} (${s.outcome.year})`
        : "Not declared",
  };
}

export async function issueCredential(student: StudentDoc) {
  await revokeCredentialsFor(student.apaarId); // a fresh issue supersedes older credentials
  const claims = await subjectClaims(student);
  const credentialId = randomUUID();
  const listId = "1";
  const index = await allocateIndex(listId);
  const did = issuerDid();
  const now = new Date();
  const until = new Date(now.getTime() + 365 * 86400_000);
  const credentialStatus = {
    id: `${statusListUrl(listId)}#${index}`,
    type: "BitstringStatusListEntry",
    statusPurpose: "revocation",
    statusListIndex: String(index),
    statusListCredential: statusListUrl(listId),
  };
  const base = {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: `urn:uuid:${credentialId}`,
    type: ["VerifiableCredential", "APAARStudentRecordCredential"],
    issuer: { id: did, name: "All India Council for Technical Education" },
    validFrom: now.toISOString(),
    validUntil: until.toISOString(),
    credentialStatus,
  };
  const key = await privateKey();

  const vcJwt = await new SignJWT({ ...base, credentialSubject: claims })
    .setProtectedHeader({ alg: "EdDSA", typ: "vc+jwt", kid: keyId() })
    .setIssuer(did)
    .setJti(base.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(until.getTime() / 1000))
    .sign(key);

  const disclosures = await Promise.all(Object.entries(claims).map(([k, v]) => makeDisclosure(k, v)));
  const sdPayload = {
    ...base,
    credentialSubject: { _sd: disclosures.map((d) => d.digest).sort() },
    _sd_alg: "sha-256",
  };
  const sdJwtCore = await new SignJWT(sdPayload)
    .setProtectedHeader({ alg: "EdDSA", typ: "vc+sd-jwt", kid: keyId() })
    .setIssuer(did)
    .setJti(base.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(until.getTime() / 1000))
    .sign(key);
  const sdJwt = [sdJwtCore, ...disclosures.map((d) => d.disclosure)].join("~") + "~";

  return Credential.create({
    credentialId,
    studentApaar: student.apaarId,
    studentId: student._id,
    vcJwt,
    sdJwt,
    statusListId: listId,
    statusListIndex: index,
    issuedAt: now,
    expiresAt: until,
    revoked: false,
  });
}

/** Latest live credential for the student's current record (re-issued if missing or superseded) */
export async function currentCredential(student: StudentDoc) {
  const live = await Credential.findOne({ studentApaar: student.apaarId, studentId: student._id, revoked: false }).sort({ issuedAt: -1 });
  if (live && live.expiresAt && live.expiresAt > new Date()) return live;
  return issueCredential(student);
}

/** Server-side status checker that reads the local status list (no HTTP round trip) */
export const localStatusChecker: StatusChecker = async (url, index) => {
  const listId = url.split("/").pop() || "1";
  return { revoked: await isRevokedLocal(listId, index) };
};

export async function verifyPresentation(token: string) {
  return verifySdJwtVc(token, { publicJwk: publicJwk(), expectedIssuer: issuerDid(), statusChecker: localStatusChecker });
}

/** Builds a consent-scoped presentation (only fieldsAllowed are disclosed) and verifies it */
export async function presentAndVerify(student: StudentDoc, fields: string[]) {
  const cred = await currentCredential(student);
  const presentation = presentSdJwt(cred.sdJwt!, fields);
  const result = await verifyPresentation(presentation);
  return { presentation, result, credentialId: cred.credentialId };
}

/** QR payload: SD-JWT presentation with the default disclosed fields */
export async function qrPresentation(student: StudentDoc) {
  const cred = await currentCredential(student);
  return { token: presentSdJwt(cred.sdJwt!, DEFAULT_DISCLOSED), credentialId: cred.credentialId };
}

export async function verifyVcJwt(vcJwt: string) {
  const { payload } = await compactVerify(vcJwt, await publicKey());
  return JSON.parse(new TextDecoder().decode(payload));
}

export const peekJwt = (t: string) => decodeJwt(t.split("~")[0]);

export async function findStudentForCredential(credentialId: string) {
  const c = await Credential.findOne({ credentialId }).lean();
  return c?.studentId ? Student.findById(c.studentId) : null;
}
