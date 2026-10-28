import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

export const SEAT_TYPES = ["regular", "nri", "oci", "fn", "tfw", "other"] as const;
export type SeatType = (typeof SEAT_TYPES)[number];
export const SUPERNUMERARY_TYPES = ["nri", "oci", "fn", "tfw", "other"] as const;
export type SupernumeraryType = (typeof SUPERNUMERARY_TYPES)[number];

const ProgramSchema = new Schema(
  {
    programId: { type: String, required: true },
    name: { type: String, required: true },
    level: { type: String, enum: ["UG", "PG", "Diploma"], default: "UG" },
    discipline: { type: String, required: true },
    approvedIntake: { type: Number, required: true },
    supernumeraryApproved: {
      nri: { type: Number, default: 0 },
      oci: { type: Number, default: 0 },
      fn: { type: Number, default: 0 },
      tfw: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const InstitutionSchema = new Schema(
  {
    aicteId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    state: { type: String, required: true, index: true },
    district: String,
    region: { type: String, required: true, index: true },
    address: String,
    type: { type: String, enum: ["Government", "Private", "Deemed", "Autonomous"], default: "Private" },
    isDegreeAwarding: { type: Boolean, default: false },
    affiliatedUniversityId: String,
    contactPhone: String,
    webhookUrl: String,
    webhookSecret: String,
    apiClientId: { type: String, index: true, sparse: true },
    apiClientSecretHash: String,
    apiKeyHash: String,
    apiKeyPrefix: String,
    programs: [ProgramSchema],
    complianceScore: { type: Number, default: 100 },
    riskScore: { type: Number, default: 0 },
    riskReasons: [String],
    badge: { type: String, enum: ["green", "amber", "red"], default: "green" },
    accreditation: { nba: Boolean, naacGrade: String },
  },
  { timestamps: true }
);

export type ProgramDoc = InferSchemaType<typeof ProgramSchema>;
export type InstitutionDoc = InferSchemaType<typeof InstitutionSchema> & { _id: mongoose.Types.ObjectId };
export const Institution: Model<InstitutionDoc> =
  mongoose.models.Institution || mongoose.model("Institution", InstitutionSchema);
