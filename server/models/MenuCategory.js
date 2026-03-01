import mongoose from 'mongoose'

const menuCategorySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  image: { type: String, default: '' }
}, { timestamps: true })

// Index for tenant-scoped categories
menuCategorySchema.index({ tenantId: 1, sortOrder: 1 })
menuCategorySchema.index({ tenantId: 1, isActive: 1 })

export const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema)
