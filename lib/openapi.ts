/** OpenAPI 3.0 description of the public and institution ERP APIs (served at /api/openapi, rendered at /api-docs). */
const ok = (description: string, schema: object = { type: "object" }) => ({ description, content: { "application/json": { schema } } });
const err = { "401": { description: "Unauthenticated" }, "403": { description: "Forbidden (RBAC)" }, "422": { description: "Validation failed" }, "429": { description: "Rate limited" } };
const apaarParam = { name: "apaar", in: "path", required: true, schema: { type: "string", pattern: "^\\d{12}$" } };
const idParam = { name: "id", in: "path", required: true, schema: { type: "string" } };

const StudentRow = {
  type: "object",
  required: ["apaarId", "name", "dob", "gender", "category", "seatType", "programId", "academicYear", "admissionDate"],
  properties: {
    apaarId: { type: "string", example: "100000000001" },
    institutionStudentId: { type: "string" },
    name: { type: "string" },
    dob: { type: "string", format: "date" },
    gender: { type: "string", enum: ["M", "F", "T"] },
    parentName: { type: "string" },
    phone: { type: "string", example: "9876543210" },
    email: { type: "string", format: "email" },
    category: { type: "string", enum: ["General", "SC", "ST", "OBC", "EWS"] },
    nri: { type: "string", enum: ["Y", "N"] },
    oci: { type: "string", enum: ["Y", "N"] },
    foreignNational: { type: "string", enum: ["Y", "N"] },
    seatType: { type: "string", enum: ["regular", "nri", "oci", "fn", "tfw", "other"] },
    programId: { type: "string" },
    academicYear: { type: "string", example: "2025-26" },
    admissionDate: { type: "string", format: "date" },
    counsellingRef: { type: "string" },
    status: { type: "string", enum: ["active", "dropped", "transferred", "graduated"] },
  },
};

export function openApiSpec(serverUrl: string) {
  const erp = [{ bearerAuth: [], apiKey: [] }, { session: [] }];
  return {
    openapi: "3.0.3",
    info: {
      title: "VidyaVerse – APAAR Student Data & Verification API",
      version: "1.0.0",
      description:
        "REST APIs for AICTE-approved institution ERPs and the AICTE portal. ERP clients obtain a token with the OAuth2 client-credentials grant and send it with their X-API-Key. Write endpoints accept an `Idempotency-Key` header; repeated keys return the original response. Student records are versioned (`expectedVersion` for optimistic concurrency).",
    },
    servers: [{ url: serverUrl }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        apiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
        session: { type: "apiKey", in: "cookie", name: "authjs.session-token" },
        oauth2: { type: "oauth2", flows: { clientCredentials: { tokenUrl: "/api/v1/auth/token", scopes: { "students:write": "Create/update students", "students:read": "Read students" } } } },
      },
      parameters: { IdempotencyKey: { name: "Idempotency-Key", in: "header", required: false, schema: { type: "string", maxLength: 100 } } },
      schemas: { StudentRow },
    },
    paths: {
      "/api/v1/auth/token": { post: { tags: ["Auth"], summary: "OAuth2 client credentials → access token", requestBody: { content: { "application/json": { schema: { type: "object", properties: { grant_type: { type: "string", enum: ["client_credentials"] }, client_id: { type: "string" }, client_secret: { type: "string" } } } } } }, responses: { "200": ok("Token"), "401": { description: "invalid_client" } } } },
      "/api/v1/students": {
        get: { tags: ["Students"], summary: "List students (scoped, masked, paginated)", security: erp, parameters: ["q", "status", "programId", "academicYear", "flagged", "page", "limit"].map((n) => ({ name: n, in: "query", schema: { type: "string" } })), responses: { "200": ok("Page of students"), ...err } },
        post: { tags: ["Students"], summary: "Add one student or bulk (validated, seat-ledger enforced)", security: erp, parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }], requestBody: { content: { "application/json": { schema: { oneOf: [{ type: "object", properties: { student: { $ref: "#/components/schemas/StudentRow" } } }, { type: "object", properties: { students: { type: "array", items: { $ref: "#/components/schemas/StudentRow" } } } }] } } } }, responses: { "200": ok("Committed"), "409": { description: "Seat ledger rejected / enrolled elsewhere" }, ...err } },
      },
      "/api/v1/students/{apaar}": {
        get: { tags: ["Students"], summary: "Get student record (audited PII read)", security: erp, parameters: [apaarParam], responses: { "200": ok("Student"), ...err } },
        put: { tags: ["Students"], summary: "Update student (versioned; revokes old credentials)", security: erp, parameters: [apaarParam, { $ref: "#/components/parameters/IdempotencyKey" }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { expectedVersion: { type: "integer" }, status: { type: "string" }, programId: { type: "string" } } } } } }, responses: { "200": ok("Updated"), "409": { description: "Version conflict / no seat" }, ...err } },
      },
      "/api/v1/students/{apaar}/history": { get: { tags: ["Students"], summary: "Time-travel: record as of a date", security: erp, parameters: [apaarParam, { name: "asOf", in: "query", schema: { type: "string", format: "date" } }], responses: { "200": ok("History") } } },
      "/api/v1/uploads": { post: { tags: ["Uploads"], summary: "Validate rows (no commit); creates draft batch", security: erp, requestBody: { content: { "application/json": { schema: { type: "object", properties: { fileName: { type: "string" }, rows: { type: "array", items: { $ref: "#/components/schemas/StudentRow" } } } } } } }, responses: { "200": ok("Per-row validation with fix hints") } } },
      "/api/v1/uploads/{id}/submit": { post: { tags: ["Uploads"], summary: "Submit draft for approval", security: erp, parameters: [idParam], responses: { "200": ok("Submitted") } } },
      "/api/v1/uploads/{id}/approve": { post: { tags: ["Uploads"], summary: "Institution admin approves (commit) or rejects", security: [{ session: [] }], parameters: [idParam], requestBody: { content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["approve", "reject"] } } } } } }, responses: { "200": ok("Commit summary") } } },
      "/api/v1/institutions": { get: { tags: ["Institutions"], summary: "Institutions with live metrics", security: [{ session: [] }], responses: { "200": ok("List") } } },
      "/api/v1/institutions/{id}": { get: { tags: ["Institutions"], summary: "Institution detail", security: [{ session: [] }], parameters: [idParam], responses: { "200": ok("Detail") } } },
      "/api/v1/programs/{id}/ledger": { get: { tags: ["Seat ledger"], summary: "Approved / consumed / remaining seats", security: erp, parameters: [idParam, { name: "institutionId", in: "query", schema: { type: "string" } }, { name: "year", in: "query", schema: { type: "string" } }], responses: { "200": ok("Ledger") } } },
      "/api/v1/transfers": { post: { tags: ["Transfers"], summary: "Request a transfer (new institution)", security: [{ session: [] }], responses: { "200": ok("Requested") } } },
      "/api/v1/transfers/{id}": { patch: { tags: ["Transfers"], summary: "release | complete | reject", security: [{ session: [] }], parameters: [idParam], responses: { "200": ok("Updated") } } },
      "/api/v1/consent": { post: { tags: ["Consent"], summary: "Verifier requests consent (public, rate-limited)", requestBody: { content: { "application/json": { schema: { type: "object", properties: { apaarId: { type: "string" }, requesterName: { type: "string" }, requesterContact: { type: "string" }, requesterType: { type: "string", enum: ["employer", "institution", "regulator", "other"] }, purpose: { type: "string", enum: ["employment", "higher-studies", "regulatory", "other"] }, fieldsAllowed: { type: "array", items: { type: "string" } } } } } } }, responses: { "200": ok("Request sent") } } },
      "/api/v1/consent/{id}": { patch: { tags: ["Consent"], summary: "Student approve | reject | revoke", security: [{ session: [] }], parameters: [idParam], responses: { "200": ok("Updated") } } },
      "/api/v1/verify": { post: { tags: ["Verification"], summary: "Verify with APAAR + consent code, or a credential/QR token", requestBody: { content: { "application/json": { schema: { oneOf: [{ type: "object", properties: { apaarId: { type: "string" }, code: { type: "string" } } }, { type: "object", properties: { credential: { type: "string" } } }] } } } }, responses: { "200": ok("Checks + disclosed fields"), "429": { description: "Rate limited" } } } },
      "/api/v1/status-list/{id}": { get: { tags: ["Verification"], summary: "Bitstring Status List credential (vc+jwt)", parameters: [idParam], responses: { "200": { description: "application/vc+jwt" } } } },
      "/api/v1/credentials/{apaar}/issue": { post: { tags: ["Credentials"], summary: "Issue W3C VC (vc+jwt + SD-JWT)", security: [{ session: [] }], parameters: [apaarParam], responses: { "200": ok("Credential") } } },
      "/api/v1/credentials/{apaar}/pdf": { get: { tags: ["Credentials"], summary: "Signed PDF record", security: [{ session: [] }], parameters: [apaarParam], responses: { "200": { description: "application/pdf" } } } },
      "/api/v1/certificate-data/{apaar}": { get: { tags: ["Certificates"], summary: "APAAR + institution student ID + QR token (degree-awarding only)", security: erp, parameters: [apaarParam, { name: "format", in: "query", schema: { type: "string", enum: ["json", "pdf"] } }], responses: { "200": ok("Certificate data") } } },
      "/api/v1/reports/{type}": { get: { tags: ["Reports"], summary: "Reports as JSON / CSV / PDF", security: [{ session: [] }], parameters: [{ name: "type", in: "path", required: true, schema: { type: "string", enum: ["state-enrolment", "program-intake", "category-split", "flagged-institutions", "cross-duplicates", "outcomes", "accreditation", "yoy-trends"] } }, ...["format", "year", "state", "region", "discipline", "institutionType"].map((n) => ({ name: n, in: "query", schema: { type: "string" } }))], responses: { "200": ok("Report") } } },
      "/api/v1/search": { post: { tags: ["AICTE"], summary: "Natural-language search (whitelisted filter)", security: [{ session: [] }], responses: { "200": ok("Results") } } },
      "/api/v1/alerts": { get: { tags: ["AICTE"], summary: "Alerts feed", security: [{ session: [] }], responses: { "200": ok("Alerts") } } },
      "/api/v1/alerts/{id}": { patch: { tags: ["AICTE"], summary: "acknowledge | resolve", security: [{ session: [] }], parameters: [idParam], responses: { "200": ok("Updated") } } },
      "/api/v1/grievances": { post: { tags: ["Students"], summary: "Student correction request", security: [{ session: [] }], responses: { "200": ok("Created") } } },
      "/api/v1/grievances/{id}": { patch: { tags: ["Students"], summary: "Update grievance status", security: [{ session: [] }], parameters: [idParam], responses: { "200": ok("Updated") } } },
      "/api/v1/rules": { get: { tags: ["AICTE"], summary: "Rules engine", security: [{ session: [] }], responses: { "200": ok("Rules") } }, put: { tags: ["AICTE"], summary: "Update rules (audited)", security: [{ session: [] }], responses: { "200": ok("Saved") } } },
      "/api/v1/audit": { get: { tags: ["AICTE"], summary: "Append-only audit log", security: [{ session: [] }], responses: { "200": ok("Entries") } } },
      "/api/v1/audit/verify-chain": { get: { tags: ["AICTE"], summary: "Verify SHA-256 hash chain", security: [{ session: [] }], responses: { "200": ok("Result") } } },
      "/api/mock/apaar/{id}": { get: { tags: ["Mock"], summary: "Mock APAAR/DigiLocker lookup", parameters: [idParam], responses: { "200": ok("Exists") } } },
      "/api/whatsapp/webhook": { get: { tags: ["WhatsApp"], summary: "Webhook verification", responses: { "200": { description: "Challenge" } } }, post: { tags: ["WhatsApp"], summary: "Incoming messages (HMAC-checked when live)", responses: { "200": ok("Processed") } } },
      "/.well-known/did.json": { get: { tags: ["Verification"], summary: "Issuer DID document (did:web)", responses: { "200": ok("DID document") } } },
    },
    "x-webhooks": {
      "intake.breach": { description: "POSTed to the institution webhook URL with header X-VidyaVerse-Signature: sha256=HMAC(body, webhookSecret)" },
    },
  };
}
