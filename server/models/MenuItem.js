import mongoose from 'mongoose'

const modifierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
})

const menuItemSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  available: { type: Boolean, default: true },
  modifiers: [modifierSchema],
  tags: [{ type: String }],
  dietary: {
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    spicy: { type: Boolean, default: false }
  },
  preparationTime: { type: Number, default: 15 },
  sortOrder: { type: Number, default: 0 },
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

menuItemSchema.index({ tenantId: 1, categoryId: 1 })
menuItemSchema.index({ tenantId: 1, available: 1, isActive: 1 })
menuItemSchema.index({ tenantId: 1, isPopular: 1 })

export const MenuItem = mongoose.model('MenuItem', menuItemSchema)
