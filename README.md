# VidyaVerse : APAAR Student Data & Verification Portal (AICTE)

AICTE-approved institutions submit student-level data keyed by **APAAR ID**. The portal validates it, prevents fraud with a **digital seat ledger**, stores it in a central repository, gives AICTE real-time monitoring and analytics, and lets authorised stakeholders verify records **only with the student's consent** – using W3C Verifiable Credentials.

```
Institution → Student Data Upload → APAAR Validation → Data Verification → AICTE Central Repository → Analytics & Monitoring → Authorised Verification
```

**Stack:** Next.js 14 (App Router, TypeScript) · MongoDB Atlas + Mongoose · Auth.js (credentials + OTP, JWT, RBAC) · Tailwind + shadcn-style components (Radix) · Recharts · react-simple-maps · react-force-graph-2d · SheetJS · zod · jose (Ed25519, VC-JWT, SD-JWT) · pdf-lib · qrcode · SWR (10 s polling) · Vercel Cron.

---

## 0. Quick start (one command, no MongoDB install)

Requirements: Node.js ≥ 18.18.

```bash
npm install
```

```bash
npm run demo
```

`npm run demo` does everything:
1. Creates `.env` with fresh secrets if it doesn't exist.
2. Starts a local MongoDB whose data lives in `./.localdb`. The first run downloads MongoDB once (about 70 MB); after that it works offline.
3. Loads the demo data if the database is empty.
4. Starts the app on the first free port from 3000 and prints the login URL. Verification links and QR codes use that same port.

On the login page, click any role under **One-click demo login**. The OTP is filled in for you, so press *Verify & sign in*. Stop with **Ctrl+C**; data is kept for next time.

- **Fresh demo data** (do this just before presenting): stop with Ctrl+C, then run `npm run demo:reset`.
- **Health check:** `/api/health` should return `{"ok":true,"db":true,"seeded":true}`.

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Invalid email or password" | Check the browser shows **this** app at the URL `npm run demo` printed (another app may hold port 3000). Password is `Demo@123`. A yellow banner on the login page means the database is down or empty. |
| "belongs to another copy of VidyaVerse" | Another copy of the project is running its demo database. Stop it (Ctrl+C in its terminal), then rerun here. |
| "Account locked after 5 failed attempts" | Wait 15 minutes, or run `npm run demo:reset` |
| A page is slow the first time | Normal in dev mode; open each page once before the demo |

## Promises → where they are in the portal

| # | Promise | Where to show it |
| --- | --- | --- |
| 1 | Institutions upload student data via Excel, web form or ERP API | Institution → **Upload** (Excel/CSV drag-and-drop), Students → **Add student** (web form), `POST /api/v1/students` with OAuth2 token + `X-API-Key` (keys under Institution → Settings; docs at `/api-docs`) |
| 2 | Records are auto-validated and stored in the AICTE central repository | Upload → *Validate & save draft*: APAAR format and registry match, duplicates, intake, inconsistencies, cross-institution and fuzzy checks; Approve commits to the central repository |
| 3 | OAuth2, JWT, OTP 2FA, role-based access, AES-256 | `POST /api/v1/auth/token` (client credentials → JWT), Auth.js JWT sessions, OTP step at login, six roles enforced in middleware and in every API, AES-256-GCM for phone, email and parent name |
| 4 | AICTE monitors admissions; verifiers verify only with student consent | AICTE dashboard (map, KPIs, live alerts, risk), **Verify a Student** and WhatsApp `VERIFY` both fail until the student approves; revoking works immediately |
| 5 | Every approved seat is a token | **Seat Ledger** / Admission Monitoring: one token per approved seat; admission beyond intake is blocked and alerted |
| 6 | Institution risk score and smart duplicate matching | High-risk table with reasons; Anomalies & Alerts → **Duplicate Review** (phonetic Jaro-Winkler + DOB + parent) |
| 7 | W3C credential with a unique QR for each credential | Student → **My Record**: QR + credential ID; VC Data Model 2.0, Ed25519, `did:web`, SD-JWT, Bitstring Status List. A record change issues a new credential and the old QR fails |
| 8 | Excel template and regional languages for tier-3 colleges | Template with dropdowns + Instructions sheet; UI in English / हिंदी / मराठी; *Help me fix* explains each error in English, Hindi or Marathi |
| 9 | Outcome tracking | Student → **Outcomes** (with consent), institution bulk outcome upload, AICTE outcome rates and Accreditation report |

## 1. Manual setup (your own MongoDB / Atlas)

Use a MongoDB **replica set** (MongoDB Atlas free tier works).

```bash
npm install
```

```bash
npm run setup
```

`npm run setup` writes a `.env` with fresh secrets (if none exists). Set `MONGODB_URI` in it to your Atlas connection string, then:

```bash
npm run seed
```

```bash
npm run dev
```

With an Atlas (`mongodb+srv://`) URI in `.env`, `npm run demo` uses Atlas instead of the local database.

### Environment variables (`.env.example`)

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string (Atlas recommended) |
| `AUTH_SECRET` | Auth.js session secret; also derives the ERP token key |
| `SIGNING_PRIVATE_KEY` / `SIGNING_PUBLIC_KEY` | Ed25519 JWKs (base64) for VCs, SD-JWT, consent artefacts |
| `HMAC_SECRET` | APAAR tokenisation (`apaarToken`) and contact hashes |
| `FIELD_ENCRYPTION_KEY` | 32-byte key for AES-256-GCM (phone, email, parent name) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | Meta WhatsApp Cloud API; leave empty for **MOCK** mode |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | Optional OpenAI-compatible LLM (AI error assistant, NL search); rule-based fallback otherwise |
| `APP_DOMAIN` | Public host, used for `did:web` and verification links (e.g. `vidyaverse.vercel.app`) |
| `CRON_SECRET` | Protects `/api/cron/*` (Vercel sends it automatically) |
| `DEMO_MODE` | `true` shows the mock OTP in a toast in production (demo deployments only) |

### Scripts

- `npm run dev`: development server
- `npm run seed`: resets the database and loads demo data (≈50 institutions, ≈5,000 students over 2 years, planted frauds) and writes `public/samples/demo-upload.xlsx`
- `npm run keys`: generates the keypair and secrets
- `npm run build:map`: rebuilds `public/maps/india-states.topo.json` from `@svg-maps/india` (CC-BY-4.0)
- `npm run typecheck`, `npm run build`

---

## 2. Deploy to Vercel + MongoDB Atlas

1. **Atlas**: create a free cluster → Database Access: add a user → Network Access: allow `0.0.0.0/0` (or Vercel IPs) → copy the `mongodb+srv://…` connection string and add a database name, e.g. `/vidyaverse`.
2. Run `npm run keys` locally and keep the output.
3. Push this folder to GitHub. In **Vercel → New Project**, import the repo (set *Root Directory* to `vidyaverse` if it lives in a monorepo). Framework: Next.js.
4. In **Settings → Environment Variables**, add every variable from the table and `DEMO_MODE=true` for a demo. `APP_DOMAIN` is optional: without it the app uses Vercel's production domain.
5. Deploy, then open `/api/health` and expect `"ok":true`. `vercel.json` runs the three cron jobs once a day, which the free Hobby plan allows. On Pro, change `risk-recompute` and `consent-expiry` to hourly. "Run checks now" on the AICTE dashboard runs everything on demand.
6. Seed the Atlas database from your machine: put the Atlas `MONGODB_URI` and the same secrets in `.env`, then run `npm run seed`. The secrets must match Vercel's, because encrypted fields and tokens depend on them.
7. Optional: WhatsApp live mode. Set the Meta variables and point the Meta webhook to `https://<domain>/api/whatsapp/webhook`, using `WHATSAPP_VERIFY_TOKEN`.

---

## 3. Roles & demo logins (password `Demo@123`)

| Login | Role | Sees |
| --- | --- | --- |
| `admin@aicte.demo` | AICTE HQ (`full`) | Everything, rules engine |
| `regional@aicte.demo` | Regional officer (`regional`, Western) | Auto-filtered to Maharashtra + Gujarat |
| `regulator@aicte.demo` | Regulator (`readonly`) | Aggregated dashboards & reports only, no PII |
| `institute@demo` | Institution admin (Pune Institute of Engineering & Technology) | Own data; approves uploads; users & API keys |
| `operator@demo` | Institution operator | Upload & edit, no approval |
| `student@demo` | Student (Aarav Sharma) | Own record, consent, access log |

AICTE and institution logins require an OTP (mock SMS: shown as a toast in dev and printed in the server console). Accounts lock for 15 minutes after 5 failed attempts. Admin sessions end after 15 minutes idle.

---

## 4. Five-minute demo script

1. **Upload with instant errors.** Log in as `institute@demo` → **Upload** → *Sample file* (or drag `public/samples/demo-upload.xlsx`). 44 rows are read in the browser, and 22 are highlighted (20 invalid/missing APAAR, 2 inconsistent). Click **Help me fix** for plain-language EN/हिंदी hints, e.g. *"Row 24: APAAR missing → ask the student to generate it on DigiLocker"*.
2. **Seat ledger blocks over-intake.** Click **Validate & save draft**: the server adds registry, duplicate and intake checks, and the 2 rows for program P2 (already full) show *No regular seat left*. Click **Submit**, then **Approve**: 20 students are committed and 2 are blocked by the ledger. A WhatsApp alert goes to the institution and the AICTE dashboard alert appears at the same moment (bell + live feed; see the WhatsApp Simulator, persona *Institution*).
3. **AICTE dashboard.** Log in as `admin@aicte.demo`. Click a state on the India map to drill down (state → institutions → detail). The **High-risk institutions** table shows *Jodhpur Global Institute of Technology* (enrolment up >200%, 100% fill with high NRI/FN share, late bulk upload). **Alerts & Flags** shows:
   - *Validation Issues*: **No counselling allotment** (15 students at UP-0002/KA-0001), **Possible ghost student** (10 scholarships at Warangal), **Enrolled elsewhere** (5 students double-enrolled in GJ-0001 and GJ-0004)
   - *Duplicate Review*: *Subodh Patel ≈ Suboth Patel* (same DOB and parent); mark it *Same person* or *Different person*
   - *Fraud Graph*: the red cluster of 8 students sharing one phone number (Noida)

   **Run checks now** re-runs every check and recomputes risk.
4. **Natural-language search.** Type *"Show colleges in Maharashtra exceeding intake in CSE"* in the top bar. The query becomes a whitelisted filter (state = Maharashtra, discipline = CSE, exceedingIntake = true) and returns a results table.
5. **Employer verification.** In the **WhatsApp Simulator**, choose *Student (Aarav Sharma)*: the pending Infosys consent request is visible. Reply `YES <code>` (code printed by the seed and shown in the message). Switch to *Employer* and send `VERIFY <APAAR> <CODE>`: the reply shows the disclosed fields with all 5 checks ✓. Then, as `student@demo` → **My Record**, copy the QR/verification link (or download the signed PDF and scan its QR) and open **Verify a Student → Scan/Paste QR**. It shows a green **Verified by AICTE** seal, every check ✓ (signature, issuer DID, expiry, SD-JWT disclosures, status list), verified in the browser with the cached public key.
6. **Revoke.** As the student, open **Consent** → **Revoke** (or WhatsApp `REVOKE <consent ID>`). The same `VERIFY` now replies *Not authorised: consent revoked*.
7. **Tamper-proof audit.** As AICTE, open **Audit Log** → **Verify Chain**: *Chain intact ✓*. Try **Time-travel view** with the demo APAAR and a past date.

---

## 5. How the key features work

| Feature | Where |
| --- | --- |
| Digital Seat Ledger (one token per approved seat; atomic `findOneAndUpdate` inside a transaction) | `lib/ledger.ts`, `lib/students.ts#enrolStudent` |
| Validation engine (12-digit APAAR, registry match, duplicates, intake, inconsistencies, cross-institution, fuzzy Jaro-Winkler + phonetic) | `lib/validation/*` |
| Fraud checks (counselling, scholarship ghosts, double enrolment, shared contacts, late uploads, ghost pattern) and risk/compliance scores with reasons | `lib/checks.ts` |
| W3C VC 2.0 (vc+jwt), SD-JWT selective disclosure, Bitstring Status List, did:web | `lib/vc/*`, `/.well-known/did.json`, `/api/status-list/:id` |
| DEPA-style signed consent artefacts, purpose + expiry enforced server-side | `lib/consent.ts` |
| SHA-256 hash-chained, append-only audit log + chain verification | `lib/audit.ts`, `models/Trust.ts` |
| WhatsApp adapter (Cloud API / MOCK) and bot | `lib/whatsapp/*`, `/api/whatsapp/webhook` |
| Natural-language search over a whitelisted filter | `lib/search.ts` |
| Reports (CSV / PDF) | `lib/reports.ts`, `lib/pdf.ts` |
| OpenAPI | `/api-docs` (Swagger UI), `/api/openapi` |

**Security:** bcrypt passwords, OTP second factor, lockout, 15-minute admin idle timeout, HTTP-only cookies, same-origin CSRF check for cookie-authenticated mutations, zod on every input, CSP/HSTS/X-Frame-Options/nosniff/Referrer-Policy headers, Mongo-backed rate limiting (login, verify, consent, webhook, public APIs), HMAC-tokenised APAAR for cross-institution checks (institutions only ever see `Already enrolled elsewhere (REF-…)`), AES-256-GCM field encryption with hashes for matching, PII masking, no Aadhaar, audit entry for every write and every PII read, RBAC in middleware **and** in every API route.

**ERP integration:** `POST /api/v1/auth/token` (client credentials) → `Authorization: Bearer <token>` + `X-API-Key`. Write endpoints accept `Idempotency-Key`; records are versioned (`expectedVersion`). Webhooks are signed with `X-VidyaVerse-Signature: sha256=HMAC(body, webhookSecret)`. Generate credentials under Institution → Settings.

**Mock connectors:** `lib/apaar.ts` defines an `ApaarConnector` interface. The mock reads the seeded registry (`/api/mock/apaar/:id`); swap in a DigiLocker implementation without changing callers. Counselling (JoSAA/CAP) and NSP scholarship data are seeded mock collections.

**Map data:** India state outlines © @svg-maps/india (CC-BY-4.0), converted to planar TopoJSON. The emblem and AICTE logo in the header are placeholders; replace them with official artwork as per usage guidelines.
