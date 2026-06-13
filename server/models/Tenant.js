import mongoose from 'mongoose'

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  subdomain: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  logo: { type: String, default: '' },
  contact: {
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' }
  },
  settings: {
    theme: {
      primary: { type: String, default: '#dc2626' },
      secondary: { type: String, default: '#16a34a' },
      accent: { type: String, default: '#f4a261' }
    },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'America/New_York' },
    businessHours: {
      monday: { open: String, close: String, closed: Boolean },
      tuesday: { open: String, close: String, closed: Boolean },
      wednesday: { open: String, close: String, closed: Boolean },
      thursday: { open: String, close: String, closed: Boolean },
      friday: { open: String, close: String, closed: Boolean },
      saturday: { open: String, close: String, closed: Boolean },
      sunday: { open: String, close: String, closed: Boolean }
    }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'trial', 'expired', 'cancelled'], default: 'trial' },
    trialEndsAt: { type: Date },
    currentPeriodEnd: { type: Date }
  },
  features: {
    maxMenuItems: { type: Number, default: 50 },
    maxCategories: { type: Number, default: 10 },
    analyticsEnabled: { type: Boolean, default: false },
    loyaltyEnabled: { type: Boolean, default: false },
    customDomain: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

export const Tenant = mongoose.model('Tenant', tenantSchema)
