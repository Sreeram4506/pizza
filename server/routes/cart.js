import { Router } from 'express'
import { Cart } from '../models/Cart.js'
import { MenuItem } from '../models/MenuItem.js'

const router = Router()

// Get customer's cart
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const customerId = req.customerId // From auth middleware
    
    if (!customerId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    let cart = await Cart.findOne({ tenantId, customerId })
    
    if (!cart) {
      cart = new Cart({ tenantId, customerId, items: [] })
      await cart.save()
    }
    
    res.json(cart)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart' })
  }
})

// Add item to cart
router.post('/items', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const customerId = req.customerId
    const { itemId, quantity, modifiers, notes } = req.body
    
    if (!customerId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    // Get item details
    const item = await MenuItem.findOne({ _id: itemId, tenantId, available: true })
    if (!item) {
      return res.status(404).json({ error: 'Item not found or unavailable' })
    }
    
    let cart = await Cart.findOne({ tenantId, customerId })
    
    if (!cart) {
      cart = new Cart({ tenantId, customerId, items: [] })
    }
    
    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(i => 
      i.itemId.toString() === itemId && 
      JSON.stringify(i.modifiers) === JSON.stringify(modifiers)
    )
    
    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity
    } else {
      // Add new item
      cart.items.push({
        itemId: item._id,
        name: item.name,
        price: item.price,
        quantity,
        modifiers: modifiers || [],
        notes: notes || '',
        image: item.image
      })
    }
    
    await cart.save()
    res.json(cart)
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item' })
  }
})

// Update item quantity
router.put('/items/:itemId', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const customerId = req.customerId
    const { quantity } = req.body
    
    if (!customerId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const cart = await Cart.findOne({ tenantId, customerId })
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }
    
    const itemIndex = cart.items.findIndex(i => i._id.toString() === req.params.itemId)
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' })
    }
    
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1)
    } else {
      cart.items[itemIndex].quantity = quantity
    }
    
    await cart.save()
    res.json(cart)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' })
  }
})

// Remove item from cart
router.delete('/items/:itemId', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const customerId = req.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const cart = await Cart.findOne({ tenantId, customerId })
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }
    
    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId)
    await cart.save()
    
    res.json(cart)
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item' })
  }
})

// Clear cart
router.delete('/', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const customerId = req.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    await Cart.findOneAndDelete({ tenantId, customerId })
    res.json({ message: 'Cart cleared' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' })
  }
})

// Merge local cart with database cart (on login)
router.post('/merge', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const customerId = req.customerId
    const { localItems } = req.body
    
    if (!customerId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    let cart = await Cart.findOne({ tenantId, customerId })
    
    if (!cart) {
      cart = new Cart({ tenantId, customerId, items: [] })
    }
    
    // Merge local items with database cart
    for (const localItem of localItems) {
      const existingItemIndex = cart.items.findIndex(i => 
        i.itemId.toString() === localItem.itemId && 
        JSON.stringify(i.modifiers) === JSON.stringify(localItem.modifiers)
      )
      
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += localItem.quantity
      } else {
        cart.items.push(localItem)
      }
    }
    
    await cart.save()
    res.json(cart)
  } catch (err) {
    res.status(500).json({ error: 'Failed to merge cart' })
  }
})

// Apply promo code
router.post('/promo', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const customerId = req.customerId
    const { promoCode } = req.body
    
    if (!customerId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    // TODO: Validate promo code against PromoCode model
    // For now, return success with mock discount
    const discount = promoCode === 'PIZZA20' ? 0.20 : 0
    
    res.json({ promoCode, discount, valid: discount > 0 })
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply promo' })
  }
})

export default router
