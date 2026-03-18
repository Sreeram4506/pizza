import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  otp: { type: String, required: true },
  token: { type: String }, // Temporary token for password reset
  expiresAt: { type: Date, required: true }
}, { timestamps: true })

// Add index for automatic deletion after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const OTP = mongoose.model('OTP', otpSchema)
