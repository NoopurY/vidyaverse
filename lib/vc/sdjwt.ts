/**
 * Minimal SD-JWT (IETF selective disclosure) + VC verification. Isomorphic: runs on the server and in the
 * browser (offline QR verification with a cached public key). Uses only jose + WebCrypto.
 */
import { base64url, compactVerify, importJWK, type JWK, type KeyLike } from "jose";

const enc = new TextEncoder();
const dec = new TextDecoder();

async function sha256b64url(s: string) {
  const buf = await globalThis.crypto.subtle.digest("SHA-256", enc.encode(s));
  return base64url.encode(new Uint8Array(buf));
}

export async function makeDisclosure(name: string, value: unknown) {
  const salt = base64url.encode(globalThis.crypto.getRandomValues(new Uint8Array(16)));
  const disclosure = base64url.encode(enc.encode(JSON.stringify([salt, name, value])));
  return { disclosure, digest: await sha256b64url(disclosure), name };
}

export function splitSdJwt(token: string) {
  const parts = token.trim().split("~");
  return { jwt: parts[0], disclosures: parts.slice(1).filter(Boolean) };
}

export function decodeDisclosure(d: string): { salt: string; name: string; value: unknown } {
  const [salt, name, value] = JSON.parse(dec.decode(base64url.decode(d)));
  return { salt, name, value };
}

/** Builds a presentation that reveals only the allowed claim names */
export function presentSdJwt(sdJwt: string, allowed: string[]) {
  const { jwt, disclosures } = splitSdJwt(sdJwt);
  const keep = disclosures.filter((d) => allowed.includes(decodeDisclosure(d).name));
  return [jwt, ...keep].join("~") + "~";
}

export type Check = { key: string; label: string; ok: boolean; detail?: string };
export type VerifyResult = {
  valid: boolean;
  checks: Check[];
  disclosed: Record<string, unknown>;
  credentialId?: string;
  issuer?: string;
  issuedAt?: string;
  expiresAt?: string;
  statusListCredential?: string;
  statusListIndex?: number;
};

export type StatusChecker = (statusListCredential: string, index: number) => Promise<{ revoked: boolean } | null>;

/** Verifies an SD-JWT VC presentation: signature, issuer DID, validity period, status list, disclosure digests. */
export async function verifySdJwtVc(
  token: string,
  opts: { publicJwk: JWK; expectedIssuer: string; statusChecker?: StatusChecker; now?: Date }
): Promise<VerifyResult> {
  const checks: Check[] = [];
  const disclosed: Record<string, unknown> = {};
  const { jwt, disclosures } = splitSdJwt(token);
  let payload: Record<string, any>;
  let header: Record<string, any>;
  try {
    const key = (await importJWK(opts.publicJwk, "EdDSA")) as KeyLike;
    const res = await compactVerify(jwt, key);
    payload = JSON.parse(dec.decode(res.payload));
    header = res.protectedHeader as Record<string, any>;
    checks.push({ key: "signature", label: "Digital signature (Ed25519) valid", ok: true });
  } catch {
    checks.push({ key: "signature", label: "Digital signature (Ed25519) valid", ok: false, detail: "Signature does not verify" });
    return { valid: false, checks, disclosed };
  }

  const issuer = typeof payload.issuer === "string" ? payload.issuer : payload.issuer?.id ?? payload.iss;
  const issuerOk = issuer === opts.expectedIssuer && String(header.kid ?? "").startsWith(opts.expectedIssuer);
  checks.push({ key: "issuer", label: "Issuer is AICTE (did:web)", ok: issuerOk, detail: issuer });

  const now = (opts.now ?? new Date()).getTime();
  const validFrom = payload.validFrom ? Date.parse(payload.validFrom) : 0;
  const validUntil = payload.validUntil ? Date.parse(payload.validUntil) : Infinity;
  const timeOk = now >= validFrom - 60_000 && now <= validUntil;
  checks.push({ key: "expiry", label: "Within validity period (not expired)", ok: timeOk, detail: payload.validUntil });

  const sd: string[] = payload.credentialSubject?._sd ?? [];
  let digestsOk = true;
  for (const d of disclosures) {
    const digest = await sha256b64url(d);
    if (!sd.includes(digest)) {
      digestsOk = false;
      continue;
    }
    const { name, value } = decodeDisclosure(d);
    disclosed[name] = value;
  }
  checks.push({
    key: "disclosures",
    label: "Disclosed fields untampered (SD-JWT)",
    ok: digestsOk,
    detail: `${Object.keys(disclosed).length} field(s) disclosed`,
  });

  const st = payload.credentialStatus;
  let statusOk = false;
  let statusDetail = "No status entry";
  if (st?.statusListCredential && opts.statusChecker) {
    const r = await opts.statusChecker(st.statusListCredential, Number(st.statusListIndex)).catch(() => null);
    if (r === null) statusDetail = "Status list unreachable (offline)";
    else {
      statusOk = !r.revoked;
      statusDetail = r.revoked ? "Credential has been revoked or superseded" : "Active";
    }
  }
  checks.push({ key: "status", label: "Not revoked (Bitstring Status List)", ok: statusOk, detail: statusDetail });

  return {
    valid: checks.every((c) => c.ok),
    checks,
    disclosed,
    credentialId: payload.id,
    issuer,
    issuedAt: payload.validFrom,
    expiresAt: payload.validUntil,
    statusListCredential: st?.statusListCredential,
    statusListIndex: st ? Number(st.statusListIndex) : undefined,
  };
}

/** Reads bit `index` (MSB-first) from a gzip'ed, base64url ('u' multibase) Bitstring Status List */
export async function readStatusBit(encodedList: string, index: number, gunzip: (b: Uint8Array) => Promise<Uint8Array>) {
  const raw = encodedList.startsWith("u") ? encodedList.slice(1) : encodedList;
  const bytes = await gunzip(base64url.decode(raw));
  const byte = bytes[Math.floor(index / 8)];
  return ((byte >> (7 - (index % 8))) & 1) === 1;
}

/** Browser gunzip via DecompressionStream */
export async function browserGunzip(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([data]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
