import mongoose from 'mongoose'

const emailCampaignSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  template: {
    type: String,
    enum: ['promotion', 'newsletter', 'announcement', 'custom'],
    default: 'custom'
  },
  recipients: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    email: String,
    name: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'],
      default: 'pending'
    },
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    error: String
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'],
    default: 'draft'
  },
  scheduledAt: Date,
  sentAt: Date,
  completedAt: Date,
  stats: {
    totalRecipients: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
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
emailCampaignSchema.index({ tenantId: 1, status: 1 })
emailCampaignSchema.index({ tenantId: 1, createdAt: -1 })
emailCampaignSchema.index({ 'recipients.customerId': 1 })

export const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema)
