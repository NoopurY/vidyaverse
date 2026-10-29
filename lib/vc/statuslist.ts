/** W3C Bitstring Status List: server-side allocation, revocation and the signed status list credential. */
import { gzipSync, gunzipSync } from "zlib";
import { base64url, SignJWT } from "jose";
import { env } from "@/lib/env";
import { Credential, StatusList } from "@/models";
import { issuerDid, keyId, privateKey } from "./keys";

const SIZE = 131072; // 16KB minimum per spec (herd privacy)

const encodeBits = (bits: Uint8Array) => "u" + base64url.encode(gzipSync(bits));
const decodeBits = (s: string) => new Uint8Array(gunzipSync(Buffer.from(base64url.decode(s.startsWith("u") ? s.slice(1) : s))));

export const statusListUrl = (listId: string) => `${env.appUrl}/api/status-list/${listId}`;

async function ensureList(listId = "1") {
  const existing = await StatusList.findOne({ listId });
  if (existing) return existing;
  try {
    return await StatusList.create({ listId, bitstring: encodeBits(new Uint8Array(SIZE / 8)), nextIndex: 0, size: SIZE, updatedAt: new Date() });
  } catch {
    return (await StatusList.findOne({ listId }))!;
  }
}

export async function allocateIndex(listId = "1") {
  await ensureList(listId);
  const doc = await StatusList.findOneAndUpdate({ listId }, { $inc: { nextIndex: 1 } }, { new: false });
  return doc!.nextIndex;
}

/** Sets the revocation bit with optimistic concurrency (retries if another writer updated the list). */
export async function setRevoked(listId: string, index: number) {
  for (let i = 0; i < 6; i++) {
    const doc = await ensureList(listId);
    const bits = decodeBits(doc.bitstring);
    bits[Math.floor(index / 8)] |= 1 << (7 - (index % 8));
    const res = await StatusList.updateOne(
      { listId, updatedAt: doc.updatedAt },
      { $set: { bitstring: encodeBits(bits), updatedAt: new Date() } }
    );
    if (res.modifiedCount === 1) return;
  }
  throw new Error("Could not update status list");
}

export async function isRevokedLocal(listId: string, index: number) {
  const doc = await ensureList(listId);
  const bits = decodeBits(doc.bitstring);
  return ((bits[Math.floor(index / 8)] >> (7 - (index % 8))) & 1) === 1;
}

/** Revokes all live credentials of a student record (on status change / correction / re-issue). */
export async function revokeCredentialsFor(apaarId: string) {
  const creds = await Credential.find({ studentApaar: apaarId, revoked: false });
  for (const c of creds) {
    await setRevoked(c.statusListId ?? "1", c.statusListIndex!);
    c.revoked = true;
    await c.save();
  }
  return creds.length;
}

/** BitstringStatusListCredential secured as vc+jwt */
export async function statusListCredentialJwt(listId: string) {
  const doc = await ensureList(listId);
  const url = statusListUrl(listId);
  const now = new Date();
  return new SignJWT({
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: url,
    type: ["VerifiableCredential", "BitstringStatusListCredential"],
    issuer: issuerDid(),
    validFrom: now.toISOString(),
    credentialSubject: { id: `${url}#list`, type: "BitstringStatusList", statusPurpose: "revocation", encodedList: doc.bitstring },
  })
    .setProtectedHeader({ alg: "EdDSA", typ: "vc+jwt", kid: keyId() })
    .setIssuer(issuerDid())
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(await privateKey());
}
