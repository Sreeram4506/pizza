import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false
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
  atelierConfig: {
    type: Object,
    default: {
      bases: [
        { id: 'thin', name: 'Thin Crust', price: 0, color: '#D4C5A1', desc: 'Crispy & light' },
        { id: 'thick', name: 'Thick Crust', price: 1, color: '#C4A484', desc: 'Chewy & satisfying' },
        { id: 'cheese-burst', name: 'Cheese Burst', price: 2.5, color: '#E6B325', desc: 'Molten cheese edge' },
        { id: 'whole-wheat', name: 'Whole Wheat', price: 1.5, color: '#A67B5B', desc: 'Hearty & wholesome' },
      ],
      sauces: [
        { id: 'tomato', name: 'San Marzano', price: 0, color: '#C1440E', desc: 'Classic Neapolitan' },
        { id: 'bbq', name: 'Smoky BBQ', price: 0.75, color: '#5C3317', desc: 'Sweet & smoky' },
        { id: 'white', name: 'Garlic Cream', price: 1, color: '#E8DFC9', desc: 'Rich & velvety' },
        { id: 'pesto', name: 'Basil Pesto', price: 1.25, color: '#4A7C3F', desc: 'Fresh & aromatic' },
      ],
      toppings: [
        { id: 'pepperoni', name: 'Pepperoni', price: 1.5, emoji: '🍕', category: 'Meat' },
        { id: 'mushrooms', name: 'Wild Mushrooms', price: 1, emoji: '🍄', category: 'Veggie' },
        { id: 'olives', name: 'Kalamata Olives', price: 1.25, emoji: '🫒', category: 'Veggie' },
        { id: 'jalapenos', name: 'Jalapeños', price: 1, emoji: '🌶️', category: 'Spicy' },
        { id: 'bell-peppers', name: 'Bell Peppers', price: 0.75, emoji: '🫑', category: 'Veggie' },
        { id: 'onions', name: 'Caramelized Onion', price: 0.5, emoji: '🧅', category: 'Veggie' },
        { id: 'cheese', name: 'Bufala Mozzarella', price: 2, emoji: '🧀', category: 'Cheese' },
        { id: 'corn', name: 'Sweet Corn', price: 0.75, emoji: '🌽', category: 'Veggie' },
        { id: 'tomatoes', name: 'Cherry Tomatoes', price: 0.75, emoji: '🍅', category: 'Veggie' },
        { id: 'pineapple', name: 'Roasted Pineapple', price: 1, emoji: '🍍', category: 'Sweet' },
      ]
    }
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
