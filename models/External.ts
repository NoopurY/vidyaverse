/** Mock external registries: JoSAA/CAP counselling, NSP scholarships, APAAR/DigiLocker */
import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const CounsellingAllotmentSchema = new Schema({
  apaarId: { type: String, index: true },
  name: String,
  institutionAicteId: { type: String, index: true },
  programName: String,
  round: Number,
  year: String,
});
export const CounsellingAllotment: Model<InferSchemaType<typeof CounsellingAllotmentSchema>> =
  mongoose.models.CounsellingAllotment || mongoose.model("CounsellingAllotment", CounsellingAllotmentSchema);

const ScholarshipRecordSchema = new Schema({
  apaarId: { type: String, index: true },
  name: String,
  institutionAicteId: { type: String, index: true },
  scheme: String,
  amount: Number,
  year: String,
});
export const ScholarshipRecord: Model<InferSchemaType<typeof ScholarshipRecordSchema>> =
  mongoose.models.ScholarshipRecord || mongoose.model("ScholarshipRecord", ScholarshipRecordSchema);

const ApaarRegistrySchema = new Schema({
  apaarId: { type: String, unique: true },
  name: String,
  dob: String,
  gender: String,
  status: { type: String, enum: ["active", "inactive"], default: "active" },
});
export const ApaarRegistry: Model<InferSchemaType<typeof ApaarRegistrySchema>> =
  mongoose.models.ApaarRegistry || mongoose.model("ApaarRegistry", ApaarRegistrySchema);
