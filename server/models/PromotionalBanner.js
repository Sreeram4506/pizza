import mongoose from 'mongoose'

const promotionalBannerSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  backgroundColor: {
    type: String,
    default: '#FF6B6B'
  },
  textColor: {
    type: String,
    default: '#FFFFFF'
  },
  buttonText: {
    type: String,
    trim: true
  },
  buttonLink: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    enum: ['top', 'middle', 'bottom', 'hero'],
    default: 'top'
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'full'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'expired'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  targetAudience: [{
    type: String,
    enum: ['all', 'new_customers', 'returning_customers', 'vip_customers']
  }],
  clicks: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes for better performance
promotionalBannerSchema.index({ tenantId: 1, status: 1 })
promotionalBannerSchema.index({ tenantId: 1, isActive: 1, priority: -1 })
promotionalBannerSchema.index({ startDate: 1, endDate: 1 })

export const PromotionalBanner = mongoose.model('PromotionalBanner', promotionalBannerSchema)
