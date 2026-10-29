/**
 * npm run demo — zero-install local demo:
 *   1. creates .env with fresh secrets if it does not exist
 *   2. starts a persistent local MongoDB replica set (data kept in ./.localdb, no MongoDB install needed)
<<<<<<< HEAD
 *   3. seeds the demo data the first time (or always with `npm run demo:reset`)
=======
 *   3. seeds the demo data the first time (or always with `npm run demo -- --reseed`)
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
 *   4. starts the Next.js dev server
 * Press Ctrl+C to stop everything. Data survives restarts.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
<<<<<<< HEAD
import net from "node:net";
=======
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
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
<<<<<<< HEAD
// Anything other than an Atlas/remote URI (e.g. a leftover local test URI) uses the bundled local database
const isRemote = !!configuredUri && /^mongodb\+srv:\/\//.test(configuredUri);
const useLocalDb = !isRemote || process.argv.includes("--local");
=======
const useLocalDb = !configuredUri || configuredUri.includes(`127.0.0.1:${PORT}`) || configuredUri.includes(`localhost:${PORT}`) || process.argv.includes("--local");
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020

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
<<<<<<< HEAD
  console.log(`› Using MONGODB_URI (Atlas) from .env`);
=======
  console.log(`› Using MONGODB_URI from .env`);
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
}

// 3. seed if empty
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 30000 });
await client.connect();
<<<<<<< HEAD
// A reused local database must belong to this copy of the project: another copy has different
// encryption/HMAC secrets, and mixing them makes every login fail.
if (useLocalDb) {
  const meta = client.db().collection("demo_meta");
  const owner = await meta.findOne({ _id: "owner" });
  if (owner && owner.root !== root) {
    console.error(`\n✗ The local demo database on port ${PORT} belongs to another copy of VidyaVerse:\n  ${owner.root}\n  Stop that one first (Ctrl+C in its terminal), then run "npm run demo" here again.\n`);
    await client.close();
    process.exit(1);
  }
  await meta.updateOne({ _id: "owner" }, { $set: { root } }, { upsert: true });
}
=======
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
const users = await client.db().collection("users").estimatedDocumentCount();
await client.close();
if (users === 0 || reseed) {
  console.log(reseed ? "› Re-seeding demo data…" : "› Database is empty – loading demo data…");
  await run([bin("tsx/dist/cli.mjs"), "scripts/seed.ts"], { MONGODB_URI: uri });
<<<<<<< HEAD
  if (useLocalDb) {
    const c = await new MongoClient(uri).connect(); // seeding wipes the database: re-stamp the owner
    await c.db().collection("demo_meta").updateOne({ _id: "owner" }, { $set: { root } }, { upsert: true });
    await c.close();
  }
} else {
  console.log(`✓ Demo data present (${users} users). Use "npm run demo:reset" for a fresh reset.`);
}

// 4. app — on the first free port from 3000, with verification links / QR codes pointing at that same port
const portFree = (p) =>
  new Promise((resolve) => {
    const srv = net.createServer().once("error", () => resolve(false)).once("listening", () => srv.close(() => resolve(true)));
    srv.listen(p);
  });
let appPort = 3000;
while (!(await portFree(appPort))) appPort++;
const configuredDomain = envText.match(/^APP_DOMAIN=(.*)$/m)?.[1]?.trim();
const appDomain = !configuredDomain || configuredDomain.startsWith("localhost") ? `localhost:${appPort}` : configuredDomain;
console.log(`\n› Starting the app → open http://localhost:${appPort}/login\n`);
const app = spawn(node, [bin("next/dist/bin/next"), "dev", "-p", String(appPort)], { stdio: "inherit", env: { ...process.env, MONGODB_URI: uri, APP_DOMAIN: appDomain } });
=======
} else {
  console.log(`✓ Demo data present (${users} users). Use "npm run demo -- --reseed" for a fresh reset.`);
}

// 4. app
console.log("\n› Starting the app → open the URL printed below and go to /login\n");
const app = spawn(node, [bin("next/dist/bin/next"), "dev"], { stdio: "inherit", env: { ...process.env, MONGODB_URI: uri } });
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020

const shutdown = async () => {
  app.kill();
  if (rs) await rs.stop({ doCleanup: false, force: false }).catch(() => {});
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
app.on("exit", shutdown);
