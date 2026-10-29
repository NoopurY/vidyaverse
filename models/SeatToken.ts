import mongoose, { Schema, InferSchemaType, Model } from "mongoose";
import { SEAT_TYPES } from "./Institution";

const SeatTokenSchema = new Schema({
  institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
  programId: { type: String, required: true },
  academicYear: { type: String, required: true },
  seatType: { type: String, enum: SEAT_TYPES, required: true },
  seatNo: { type: Number, required: true },
  status: { type: String, enum: ["available", "consumed", "released"], default: "available" },
  studentApaarToken: { type: String, index: true },
  consumedAt: Date,
});
SeatTokenSchema.index({ institutionId: 1, programId: 1, academicYear: 1, seatType: 1, status: 1 });
SeatTokenSchema.index({ institutionId: 1, programId: 1, academicYear: 1, seatType: 1, seatNo: 1 }, { unique: true });

export type SeatTokenDoc = InferSchemaType<typeof SeatTokenSchema> & { _id: mongoose.Types.ObjectId };
export const SeatToken: Model<SeatTokenDoc> = mongoose.models.SeatToken || mongoose.model("SeatToken", SeatTokenSchema);
