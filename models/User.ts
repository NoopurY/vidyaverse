import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

export const ROLES = ["AICTE_ADMIN", "INSTITUTION", "STUDENT"] as const;
export type Role = (typeof ROLES)[number];

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    // AICTE_ADMIN: full | regional | readonly ; INSTITUTION: admin | operator ; STUDENT: self
    permission: { type: String, required: true },
    region: String,
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", index: true },
    studentApaar: String,
    phone: String, // AES-256-GCM encrypted
    failedLogins: { type: Number, default: 0 },
    lockedUntil: Date,
    lastLogin: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };
export const User: Model<UserDoc> = mongoose.models.User || mongoose.model("User", UserSchema);

const OtpChallengeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  otpHash: String,
  otpRequired: { type: Boolean, default: true },
  attempts: { type: Number, default: 0 },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
export const OtpChallenge: Model<InferSchemaType<typeof OtpChallengeSchema>> =
  mongoose.models.OtpChallenge || mongoose.model("OtpChallenge", OtpChallengeSchema);
