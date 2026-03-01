import mongoose from 'mongoose'

const rewardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  pointsCost: { type: Number, required: true, min: 0 },
  discountValue: { type: Number, default: 0 },
  discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  minimumOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date }
})

const loyaltyTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['earned', 'redeemed', 'bonus', 'expired'], required: true },
  points: { type: Number, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rewardId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
})

const loyaltySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  points: { type: Number, default: 0 },
  lifetimePoints: { type: Number, default: 0 },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  transactions: [loyaltyTransactionSchema],
  rewards: [{
    rewardId: { type: mongoose.Schema.Types.ObjectId },
    name: String,
    redeemed: { type: Boolean, default: false },
    redeemedAt: { type: Date },
    expiresAt: { type: Date }
  }],
  lastActivity: { type: Date }
}, { timestamps: true })

// Configuration schema for tenant loyalty settings
const loyaltyConfigSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
  enabled: { type: Boolean, default: true },
  pointsPerDollar: { type: Number, default: 1 },
  welcomeBonus: { type: Number, default: 50 },
  tiers: {
    bronze: { minPoints: { type: Number, default: 0 }, multiplier: { type: Number, default: 1 } },
    silver: { minPoints: { type: Number, default: 500 }, multiplier: { type: Number, default: 1.25 } },
    gold: { minPoints: { type: Number, default: 1000 }, multiplier: { type: Number, default: 1.5 } },
    platinum: { minPoints: { type: Number, default: 2500 }, multiplier: { type: Number, default: 2 } }
  },
  rewards: [rewardSchema]
}, { timestamps: true })

loyaltySchema.index({ tenantId: 1, customerId: 1 }, { unique: true })
loyaltySchema.index({ tenantId: 1, points: -1 })

export const Loyalty = mongoose.model('Loyalty', loyaltySchema)
export const LoyaltyConfig = mongoose.model('LoyaltyConfig', loyaltyConfigSchema)
