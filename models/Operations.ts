import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const UploadBatchSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    uploadedBy: String,
    fileName: String,
    rowCount: Number,
    validRows: Number,
    errorRows: Number,
    rowsEnc: String, // AES-GCM encrypted JSON of parsed rows (contains PII)
    results: Schema.Types.Mixed, // per-row issue summary (no PII)
    status: { type: String, enum: ["draft", "submitted", "approved", "rejected"], default: "draft" },
    submittedAt: Date,
    approvedBy: String,
    approvedAt: Date,
    commitSummary: Schema.Types.Mixed,
    lateUpload: { type: Boolean, default: false },
    idempotencyKey: String,
  },
  { timestamps: true }
);
export type UploadBatchDoc = InferSchemaType<typeof UploadBatchSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date };
export const UploadBatch: Model<UploadBatchDoc> =
  mongoose.models.UploadBatch || mongoose.model("UploadBatch", UploadBatchSchema);

const TransferSchema = new Schema(
  {
    apaarId: { type: String, required: true, index: true },
    studentName: String,
    fromInstitutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    toInstitutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    toProgramId: String,
    academicYear: String,
    reason: String,
    status: { type: String, enum: ["requested", "released", "completed", "rejected"], default: "requested" },
    requestedAt: Date,
    releasedAt: Date,
    completedAt: Date,
    rejectedAt: Date,
  },
  { timestamps: true }
);
export type TransferDoc = InferSchemaType<typeof TransferSchema> & { _id: mongoose.Types.ObjectId };
export const Transfer: Model<TransferDoc> = mongoose.models.Transfer || mongoose.model("Transfer", TransferSchema);

const ValidationIssueSchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    severity: { type: String, enum: ["high", "medium", "low"], required: true },
    studentApaar: { type: String, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student" },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", index: true },
    region: String,
    batchId: { type: Schema.Types.ObjectId, ref: "UploadBatch" },
    rowNumber: Number,
    field: String,
    details: String,
    fixHint: String,
    meta: Schema.Types.Mixed,
    status: { type: String, enum: ["open", "resolved", "overridden"], default: "open", index: true },
    resolution: String,
    resolvedBy: String,
    dedupeKey: { type: String, index: true },
  },
  { timestamps: true }
);
export type ValidationIssueDoc = InferSchemaType<typeof ValidationIssueSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};
export const ValidationIssue: Model<ValidationIssueDoc> =
  mongoose.models.ValidationIssue || mongoose.model("ValidationIssue", ValidationIssueSchema);

const AlertSchema = new Schema(
  {
    type: { type: String, required: true },
    severity: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", index: true },
    region: { type: String, index: true },
    message: { type: String, required: true },
    channelsSent: [String],
    status: { type: String, enum: ["open", "acknowledged", "resolved"], default: "open", index: true },
    acknowledgedBy: String,
    acknowledgedAt: Date,
    resolvedBy: String,
  },
  { timestamps: true }
);
export type AlertDoc = InferSchemaType<typeof AlertSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date };
export const Alert: Model<AlertDoc> = mongoose.models.Alert || mongoose.model("Alert", AlertSchema);

const NotificationSchema = new Schema(
  {
    channel: { type: String, default: "whatsapp" },
    to: String,
    from: String,
    message: String,
    direction: { type: String, enum: ["in", "out"] },
    status: { type: String, default: "mock-delivered" },
  },
  { timestamps: true }
);
export type NotificationDoc = InferSchemaType<typeof NotificationSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date };
export const Notification: Model<NotificationDoc> =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

const GrievanceSchema = new Schema(
  {
    studentApaar: { type: String, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", index: true },
    field: String,
    currentValue: String,
    requestedValue: String,
    reason: String,
    status: { type: String, enum: ["open", "institution-fixed", "aicte-approved", "rejected"], default: "open" },
    remarks: String,
  },
  { timestamps: true }
);
export type GrievanceDoc = InferSchemaType<typeof GrievanceSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date };
export const Grievance: Model<GrievanceDoc> = mongoose.models.Grievance || mongoose.model("Grievance", GrievanceSchema);

const RulesSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true },
    quotaLimits: { nri: Number, oci: Number, fn: Number, tfw: Number, other: Number },
    fuzzyThreshold: Number,
    riskWeights: {
      intakeBreach: Number,
      crossDuplicate: Number,
      counsellingMismatch: Number,
      scholarshipMismatch: Number,
      sharedContact: Number,
      yoyJump: Number,
      fullFillHighForeign: Number,
      lateUpload: Number,
      openIssues: Number,
    },
    deadlineDate: Date,
    ghostSharedContactThreshold: Number,
    yoyJumpThreshold: Number,
    updatedBy: String,
  },
  { timestamps: true }
);
export type RulesDoc = InferSchemaType<typeof RulesSchema>;
export const Rules: Model<RulesDoc> = mongoose.models.Rules || mongoose.model("Rules", RulesSchema);

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
export const RateLimit: Model<InferSchemaType<typeof RateLimitSchema>> =
  mongoose.models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);

const IdempotencySchema = new Schema({
  key: { type: String, required: true, unique: true },
  response: Schema.Types.Mixed,
  status: Number,
  expiresAt: { type: Date, index: { expires: 0 } },
});
export const IdempotencyRecord: Model<InferSchemaType<typeof IdempotencySchema>> =
  mongoose.models.IdempotencyRecord || mongoose.model("IdempotencyRecord", IdempotencySchema);
