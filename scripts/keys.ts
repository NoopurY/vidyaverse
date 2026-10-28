/** Generates an Ed25519 signing keypair and all secrets; prints lines to paste into .env */
import { generateKeyPair, exportJWK } from "jose";
import { randomBytes } from "crypto";

async function main() {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA", { crv: "Ed25519", extractable: true });
  const pub = await exportJWK(publicKey);
  const priv = await exportJWK(privateKey);
  const kid = "key-1";
  const b64 = (o: object) => Buffer.from(JSON.stringify({ ...o, kid, alg: "EdDSA" })).toString("base64");
  const lines = [
    `AUTH_SECRET=${randomBytes(32).toString("base64")}`,
    `SIGNING_PRIVATE_KEY=${b64(priv)}`,
    `SIGNING_PUBLIC_KEY=${b64(pub)}`,
    `HMAC_SECRET=${randomBytes(32).toString("hex")}`,
    `FIELD_ENCRYPTION_KEY=${randomBytes(32).toString("base64")}`,
    `WHATSAPP_VERIFY_TOKEN=${randomBytes(12).toString("hex")}`,
    `CRON_SECRET=${randomBytes(16).toString("hex")}`,
  ];
  console.log("# Paste these into .env (or Vercel environment variables)\n" + lines.join("\n"));
}
main();
