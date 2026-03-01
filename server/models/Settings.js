import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  restaurantName: {
    type: String,
    default: 'Pizza Blast'
  },
  email: {
    type: String,
    default: 'contact@pizzablast.com'
  },
  phone: {
    type: String,
    default: '+1 (555) 123-4567'
  },
  address: {
    type: String,
    default: '123 Pizza Plaza, New York, NY 10001'
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },
  timezone: {
    type: String,
    enum: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
    default: 'America/New_York'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Create compound index for tenantId + updatedAt
settingsSchema.index({ tenantId: 1, updatedAt: -1 })

export const Settings = mongoose.model('Settings', settingsSchema)
