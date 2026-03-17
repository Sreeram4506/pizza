import mongoose from 'mongoose'

const cateringSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventTime: { type: String, required: true },
  guestsCount: { type: Number, required: true },
  eventType: { 
    type: String, 
    enum: ['corporate', 'private', 'wedding', 'other'], 
    default: 'other' 
  },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true })

cateringSchema.index({ tenantId: 1, status: 1 })
cateringSchema.index({ eventDate: 1 })

export const Catering = mongoose.model('Catering', cateringSchema)
