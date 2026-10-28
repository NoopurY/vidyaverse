/**
 * npm run keys            → prints an Ed25519 signing keypair and all secrets (paste into .env / Vercel)
 * npm run setup           → same, but writes a ready-to-use .env (only if .env does not exist yet)
 */
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { generateKeyPair, exportJWK } from "jose";
import { randomBytes } from "crypto";

export async function generateSecrets() {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA", { crv: "Ed25519", extractable: true });
  const pub = await exportJWK(publicKey);
  const priv = await exportJWK(privateKey);
  const b64 = (o: object) => Buffer.from(JSON.stringify({ ...o, kid: "key-1", alg: "EdDSA" })).toString("base64");
  return [
    `AUTH_SECRET=${randomBytes(32).toString("base64")}`,
    `SIGNING_PRIVATE_KEY=${b64(priv)}`,
    `SIGNING_PUBLIC_KEY=${b64(pub)}`,
    `HMAC_SECRET=${randomBytes(32).toString("hex")}`,
    `FIELD_ENCRYPTION_KEY=${randomBytes(32).toString("base64")}`,
    `WHATSAPP_VERIFY_TOKEN=${randomBytes(12).toString("hex")}`,
    `CRON_SECRET=${randomBytes(16).toString("hex")}`,
  ];
}

async function main() {
  const lines = await generateSecrets();
  if (process.argv.includes("--write")) {
    const file = join(process.cwd(), ".env");
    if (existsSync(file)) {
      console.log(".env already exists – left unchanged (delete it first to regenerate secrets).");
      return;
    }
    const uri = process.argv.find((a) => a.startsWith("--mongo="))?.slice(8) ?? "mongodb://127.0.0.1:27018/vidyaverse?replicaSet=vv";
    writeFileSync(
      file,
      [`MONGODB_URI=${uri}`, ...lines, "APP_DOMAIN=localhost:3000", "DEMO_MODE=true", "WHATSAPP_TOKEN=", "WHATSAPP_PHONE_ID=", "LLM_API_KEY=", ""].join("\n")
    );
    console.log("Created .env with fresh secrets.");
    return;
  }
  console.log("# Paste these into .env (or Vercel environment variables)\n" + lines.join("\n"));
}

if (require.main === module) main();
