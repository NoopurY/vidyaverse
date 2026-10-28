/** Browser-side (offline-capable) verification of QR credentials with a cached issuer public key. */
import { compactVerify, importJWK, type JWK, type KeyLike } from "jose";
import { browserGunzip, readStatusBit, verifySdJwtVc, type StatusChecker } from "./sdjwt";

const CACHE_KEY = "vv-issuer-did";

type DidDoc = { id: string; verificationMethod: { id: string; publicKeyJwk: JWK }[] };

export async function issuerKey(): Promise<{ did: string; jwk: JWK; fromCache: boolean }> {
  try {
    const res = await fetch("/.well-known/did.json", { cache: "no-store" });
    if (res.ok) {
      const doc = (await res.json()) as DidDoc;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(doc));
      } catch {}
      return { did: doc.id, jwk: doc.verificationMethod[0].publicKeyJwk, fromCache: false };
    }
  } catch {}
  const cached = (() => {
    try {
      return localStorage.getItem(CACHE_KEY);
    } catch {
      return null;
    }
  })();
  if (!cached) throw new Error("You are offline and the AICTE public key has not been cached yet. Open this page once while online.");
  const doc = JSON.parse(cached) as DidDoc;
  return { did: doc.id, jwk: doc.verificationMethod[0].publicKeyJwk, fromCache: true };
}

const statusChecker =
  (jwk: JWK): StatusChecker =>
  async (url, index) => {
    const path = new URL(url).pathname; // always fetch from this origin
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    const key = (await importJWK(jwk, "EdDSA")) as KeyLike;
    const { payload } = await compactVerify((await res.text()).trim(), key);
    const vc = JSON.parse(new TextDecoder().decode(payload));
    return { revoked: await readStatusBit(vc.credentialSubject.encodedList, index, browserGunzip) };
  };

export function extractToken(input: string) {
  const s = input.trim();
  const m = s.match(/vc=([^&\s]+)/);
  return m ? decodeURIComponent(m[1]) : s;
}

export async function verifyInBrowser(input: string) {
  const token = extractToken(input);
  const { did, jwk, fromCache } = await issuerKey();
  const result = await verifySdJwtVc(token, { publicJwk: jwk, expectedIssuer: did, statusChecker: statusChecker(jwk) });
  const offline = fromCache || result.checks.some((c) => c.key === "status" && /offline|unreachable/i.test(c.detail ?? ""));
  return { result, offline, token };
}
