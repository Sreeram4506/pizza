import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  modifiers: [{
    name: String,
    price: Number
  }],
  notes: { type: String, default: '' }
})

const orderSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false }, // Made optional for localhost
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  orderNumber: { type: String, required: true, unique: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'], 
    default: 'confirmed' 
  },
  type: { 
    type: String, 
    enum: ['delivery', 'pickup', 'dine_in'], 
    required: true 
  },
  customerInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' }
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    zip: { type: String, default: '' },
    instructions: { type: String, default: '' }
  },
  payment: {
    method: { type: String, enum: ['cash', 'card', 'online'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String, default: '' }
  },
  estimatedReadyAt: { type: Date },
  actualDeliveredAt: { type: Date },
  notes: { type: String, default: '' },
  source: { type: String, enum: ['website', 'app', 'phone', 'in_person'], default: 'website' }
}, { timestamps: true })

orderSchema.index({ tenantId: 1, status: 1 })
orderSchema.index({ tenantId: 1, createdAt: -1 })
orderSchema.index({ tenantId: 1, customerId: 1 })

export const Order = mongoose.model('Order', orderSchema)
