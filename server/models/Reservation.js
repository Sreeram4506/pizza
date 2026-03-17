import mongoose from 'mongoose'

const reservationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  guestsCount: { type: Number, required: true },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true })

reservationSchema.index({ tenantId: 1, status: 1 })
reservationSchema.index({ date: 1 })

export const Reservation = mongoose.model('Reservation', reservationSchema)
