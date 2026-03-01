import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  email: { type: String, required: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['owner', 'manager', 'staff', 'kitchen'], 
    default: 'staff' 
  },
  permissions: [{ type: String }],
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date }
}, { timestamps: true })

// Compound index for email within tenant
userSchema.index({ tenantId: 1, email: 1 }, { unique: true })

export const User = mongoose.model('User', userSchema)
