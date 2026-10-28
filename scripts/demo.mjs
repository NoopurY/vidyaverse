/**
 * npm run demo — zero-install local demo:
 *   1. creates .env with fresh secrets if it does not exist
 *   2. starts a persistent local MongoDB replica set (data kept in ./.localdb, no MongoDB install needed)
 *   3. seeds the demo data the first time (or always with `npm run demo -- --reseed`)
 *   4. starts the Next.js dev server
 * Press Ctrl+C to stop everything. Data survives restarts.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

const root = process.cwd();
const PORT = 27018;
const DB_URI = `mongodb://127.0.0.1:${PORT}/vidyaverse?replicaSet=vv`;
const reseed = process.argv.includes("--reseed");
const node = process.execPath;
const bin = (p) => join(root, "node_modules", p);

const run = (args, env) =>
  new Promise((resolve, reject) => {
    const child = spawn(node, args, { stdio: "inherit", env: { ...process.env, ...env } });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${args.join(" ")} exited with ${code}`))));
  });

// 1. .env
if (!existsSync(join(root, ".env"))) {
  console.log("› Creating .env with fresh secrets…");
  await run([bin("tsx/dist/cli.mjs"), "scripts/keys.ts", "--write", `--mongo=${DB_URI}`]);
}
const envText = readFileSync(join(root, ".env"), "utf8");
const configuredUri = envText.match(/^MONGODB_URI=(.*)$/m)?.[1]?.trim();
const useLocalDb = !configuredUri || configuredUri.includes(`127.0.0.1:${PORT}`) || configuredUri.includes(`localhost:${PORT}`) || process.argv.includes("--local");

// 2. database
let rs = null;
let uri = configuredUri;
// a local database left running (e.g. terminal closed without Ctrl+C) is simply reused
const alreadyRunning = useLocalDb && (await new MongoClient(DB_URI, { serverSelectionTimeoutMS: 3000 }).connect().then((c) => c.close().then(() => true)).catch(() => false));
if (alreadyRunning) {
  uri = DB_URI;
  console.log(`✓ Reusing local MongoDB already running at ${uri}`);
} else if (useLocalDb) {
  const dbPath = join(root, ".localdb");
  mkdirSync(dbPath, { recursive: true });
  console.log("› Starting local MongoDB (data in ./.localdb)… first run downloads MongoDB once (~70 MB)");
  rs = await MongoMemoryReplSet.create({
    binary: { version: "7.0.14" },
    replSet: { count: 1, name: "vv", storageEngine: "wiredTiger" },
    instanceOpts: [{ port: PORT, dbPath }],
  });
  uri = DB_URI;
  console.log(`✓ MongoDB ready at ${uri}`);
} else {
  console.log(`› Using MONGODB_URI from .env`);
}

// 3. seed if empty
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 30000 });
await client.connect();
const users = await client.db().collection("users").estimatedDocumentCount();
await client.close();
if (users === 0 || reseed) {
  console.log(reseed ? "› Re-seeding demo data…" : "› Database is empty – loading demo data…");
  await run([bin("tsx/dist/cli.mjs"), "scripts/seed.ts"], { MONGODB_URI: uri });
} else {
  console.log(`✓ Demo data present (${users} users). Use "npm run demo -- --reseed" for a fresh reset.`);
}

// 4. app
console.log("\n› Starting the app → open the URL printed below and go to /login\n");
const app = spawn(node, [bin("next/dist/bin/next"), "dev"], { stdio: "inherit", env: { ...process.env, MONGODB_URI: uri } });

const shutdown = async () => {
  app.kill();
  if (rs) await rs.stop({ doCleanup: false, force: false }).catch(() => {});
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
app.on("exit", shutdown);
