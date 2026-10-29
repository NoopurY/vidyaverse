import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { env } from "./env";

let keyCache: Buffer | null = null;
function fieldKey(): Buffer {
  if (keyCache) return keyCache;
  const raw = env.fieldKey;
  const buf = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("FIELD_ENCRYPTION_KEY must be 32 bytes (base64 or hex)");
  return (keyCache = buf);
}

/** AES-256-GCM field encryption. Output: v1.<iv>.<tag>.<ciphertext> (base64url) */
export function encrypt(plain: string | undefined | null): string | undefined {
  if (plain === undefined || plain === null || plain === "") return undefined;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", fieldKey(), iv);
  const ct = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(".");
}

export function decrypt(enc: string | undefined | null): string | undefined {
  if (!enc) return undefined;
  const [v, iv, tag, ct] = enc.split(".");
  if (v !== "v1") return undefined;
  try {
    const d = createDecipheriv("aes-256-gcm", fieldKey(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
  } catch {
    return undefined;
  }
}

export function hmac(value: string, purpose = "apaar"): string {
  return createHmac("sha256", env.hmacSecret).update(`${purpose}:${value}`).digest("hex");
}

/** Tokenised APAAR used in analytics, the seat ledger and cross-institution checks */
export const apaarToken = (apaar: string) => hmac(apaar.trim(), "apaar");
export const contactHash = (v?: string | null) => (v ? hmac(v.trim().toLowerCase().replace(/[\s-]/g, ""), "contact") : undefined);
export const parentHash = (v?: string | null) => (v ? hmac(v.trim().toLowerCase().replace(/\s+/g, " "), "parent") : undefined);

/** Short, non-reversible reference shown to other institutions ("Already enrolled elsewhere (ref ID)") */
export const refId = (token: string) => `REF-${token.slice(0, 8).toUpperCase()}`;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function randomCode(digits = 6) {
  return String(randomInt(0, 10 ** digits)).padStart(digits, "0");
}

export function randomId(prefix: string, bytes = 8) {
  return `${prefix}-${randomBytes(bytes).toString("hex")}`;
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function encryptJson(obj: unknown) {
  return encrypt(JSON.stringify(obj));
}
export function decryptJson<T>(enc?: string | null): T | undefined {
  const s = decrypt(enc);
  return s ? (JSON.parse(s) as T) : undefined;
}
