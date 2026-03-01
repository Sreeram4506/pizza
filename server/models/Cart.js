import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  modifiers: [{
    name: String,
    price: Number
  }],
  notes: { type: String, default: '' },
  image: { type: String, default: '' }
})

const cartSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [cartItemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  promoCode: { type: String, default: '' },
  discount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, { timestamps: true })

cartSchema.index({ tenantId: 1, customerId: 1 }, { unique: true })
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

cartSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => {
    const modifiersTotal = item.modifiers.reduce((mSum, m) => mSum + (m.price || 0), 0)
    return sum + (item.price + modifiersTotal) * item.quantity
  }, 0)
  this.total = this.subtotal + this.tax + this.deliveryFee - this.discount
  this.lastUpdated = new Date()
  next()
})

export const Cart = mongoose.model('Cart', cartSchema)
