import mongoose, { Schema, InferSchemaType, Model } from "mongoose";
import { SEAT_TYPES } from "./Institution";

export const CATEGORIES = ["General", "SC", "ST", "OBC", "EWS"] as const;
export const NATIONALITY = ["Indian", "NRI", "OCI", "FN"] as const;
export const STUDENT_STATUS = ["active", "dropped", "transferred", "graduated"] as const;

const HistorySchema = new Schema(
  { version: Number, changedBy: String, changedAt: Date, diff: Schema.Types.Mixed, snapshot: Schema.Types.Mixed },
  { _id: false }
);

const StudentSchema = new Schema(
  {
    apaarId: { type: String, required: true, index: true },
    apaarToken: { type: String, required: true, index: true },
    institutionStudentId: String,
    name: { type: String, required: true },
    nameNormalised: { type: String, index: true },
    dob: { type: String, required: true, index: true }, // YYYY-MM-DD
    gender: { type: String, enum: ["M", "F", "T"] },
    parentName: String, // encrypted
    parentHash: String,
    phone: String, // encrypted
    phoneHash: { type: String, index: true },
    email: String, // encrypted
    emailHash: { type: String, index: true },
    category: { type: String, enum: CATEGORIES },
    nationalityStatus: { type: String, enum: NATIONALITY, default: "Indian" },
    seatType: { type: String, enum: SEAT_TYPES, default: "regular" },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    programId: { type: String, required: true, index: true },
    academicYear: { type: String, required: true, index: true },
    admissionDate: String,
    counsellingRef: String,
    status: { type: String, enum: STUDENT_STATUS, default: "active", index: true },
    outcome: {
      type: { type: String, enum: ["placement", "higher-studies", "none"], default: "none" },
      organisation: String,
      year: Number,
      consentGiven: { type: Boolean, default: false },
    },
    batchId: { type: Schema.Types.ObjectId, ref: "UploadBatch" },
    version: { type: Number, default: 1 },
    history: [HistorySchema],
  },
  { timestamps: true }
);
// One record per APAAR per institution: a transfer (or a planted double enrolment) creates a second document
// at another institution, so global uniqueness of apaarId is enforced per institution and checked across
// institutions through apaarToken by the validation engine and the seat ledger.
StudentSchema.index({ apaarId: 1, institutionId: 1 }, { unique: true });
StudentSchema.index({ institutionId: 1, programId: 1, academicYear: 1, status: 1 });

export type StudentDoc = InferSchemaType<typeof StudentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export const Student: Model<StudentDoc> = mongoose.models.Student || mongoose.model("Student", StudentSchema);
