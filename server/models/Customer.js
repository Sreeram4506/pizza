import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false },
  name: { type: String, required: true },
  email: { type: String, lowercase: true, required: false },
  phone: { type: String, required: true },
  passwordHash: { type: String },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    zip: { type: String, default: '' }
  },
  preferences: {
    dietary: [{ type: String }],
    allergies: [{ type: String }],
    favoriteItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }]
  },
  loyalty: {
    points: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
    lastActivity: { type: Date }
  },
  orderCount: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrderAt: { type: Date },
  isGuest: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  marketingConsent: { type: Boolean, default: false }
}, { timestamps: true })

customerSchema.index({ tenantId: 1, email: 1 })
customerSchema.index({ tenantId: 1, phone: 1 })
customerSchema.index({ tenantId: 1, loyaltyPoints: -1 })

export const Customer = mongoose.model('Customer', customerSchema)
