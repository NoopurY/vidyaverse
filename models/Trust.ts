import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const ConsentSchema = new Schema(
  {
    consentId: { type: String, required: true, unique: true },
    dataPrincipal: { type: String, required: true, index: true }, // student APAAR
    dataFiduciary: { type: String, default: "AICTE" },
    requesterName: { type: String, required: true },
    requesterContact: String,
    requesterType: { type: String, enum: ["employer", "institution", "regulator", "other"], required: true },
    purpose: { type: String, enum: ["employment", "higher-studies", "regulatory", "other"], required: true },
    purposeNote: String,
    fieldsAllowed: [String],
    frequency: { type: String, enum: ["one-time", "until-expiry"], default: "until-expiry" },
    code: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "revoked", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true },
    signature: String,
    usedCount: { type: Number, default: 0 },
    history: [{ _id: false, status: String, at: Date, by: String, channel: String }],
  },
  { timestamps: true }
);
export type ConsentDoc = InferSchemaType<typeof ConsentSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date };
export const Consent: Model<ConsentDoc> = mongoose.models.Consent || mongoose.model("Consent", ConsentSchema);

const CredentialSchema = new Schema({
  credentialId: { type: String, required: true, unique: true },
  studentApaar: { type: String, required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student" },
  vcJwt: String,
  sdJwt: String,
  statusListId: { type: String, default: "1" },
  statusListIndex: Number,
  issuedAt: Date,
  expiresAt: Date,
  revoked: { type: Boolean, default: false },
});
export type CredentialDoc = InferSchemaType<typeof CredentialSchema> & { _id: mongoose.Types.ObjectId };
export const Credential: Model<CredentialDoc> =
  mongoose.models.Credential || mongoose.model("Credential", CredentialSchema);

const StatusListSchema = new Schema({
  listId: { type: String, required: true, unique: true },
  bitstring: { type: String, required: true }, // base64url(gzip(bits))
  nextIndex: { type: Number, default: 0 },
  size: { type: Number, default: 131072 },
  updatedAt: Date,
});
export const StatusList: Model<InferSchemaType<typeof StatusListSchema>> =
  mongoose.models.StatusList || mongoose.model("StatusList", StatusListSchema);

const VerificationLogSchema = new Schema({
  who: String,
  channel: { type: String, enum: ["web", "whatsapp", "qr", "api"] },
  studentApaar: { type: String, index: true },
  consentId: String,
  result: String,
  timestamp: { type: Date, default: Date.now, index: true },
});
export const VerificationLog: Model<InferSchemaType<typeof VerificationLogSchema>> =
  mongoose.models.VerificationLog || mongoose.model("VerificationLog", VerificationLogSchema);

const AuditLogSchema = new Schema({
  seq: { type: Number, required: true, unique: true },
  actor: String,
  role: String,
  action: { type: String, required: true },
  entity: String,
  entityId: String,
  before: Schema.Types.Mixed,
  after: Schema.Types.Mixed,
  ip: String,
  timestamp: { type: Date, required: true },
  prevHash: String,
  hash: { type: String, required: true },
});
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ actor: 1 });
// Append-only: any update or delete through the model layer is rejected
const blocked = [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
  "replaceOne",
] as const;
for (const op of blocked) {
  AuditLogSchema.pre(op, function () {
    throw new Error("AuditLog is append-only");
  });
}
export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & { _id: mongoose.Types.ObjectId };
export const AuditLog: Model<AuditLogDoc> = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
