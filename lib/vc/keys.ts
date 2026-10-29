import { importJWK, type JWK, type KeyLike } from "jose";
import { env } from "@/lib/env";

const parse = (b64: string) => JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as JWK;

export const issuerDid = () => `did:web:${env.appDomain.replace(":", "%3A")}`;
export const keyId = () => `${issuerDid()}#key-1`;

export function publicJwk(): JWK {
  const { kty, crv, x } = parse(env.signingPublicKey);
  return { kty, crv, x, kid: "key-1", alg: "EdDSA", use: "sig" };
}

let priv: KeyLike | null = null;
export async function privateKey(): Promise<KeyLike> {
  if (priv) return priv;
  priv = (await importJWK(parse(env.signingPrivateKey), "EdDSA")) as KeyLike;
  return priv;
}

let pub: KeyLike | null = null;
export async function publicKey(): Promise<KeyLike> {
  if (pub) return pub;
  pub = (await importJWK(publicJwk(), "EdDSA")) as KeyLike;
  return pub;
}

export function didDocument() {
  const did = issuerDid();
  return {
    "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/jws-2020/v1"],
    id: did,
    verificationMethod: [{ id: keyId(), type: "JsonWebKey2020", controller: did, publicKeyJwk: publicJwk() }],
    assertionMethod: [keyId()],
    authentication: [keyId()],
  };
}
