import { Router } from 'express'
import { Order } from '../models/Order.js'
import { Customer } from '../models/Customer.js'
import { Loyalty, LoyaltyConfig } from '../models/Loyalty.js'
import { optionalVerifyCustomer } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config.js'
import { sendOrderConfirmation, sendAdminNotification } from '../utils/email.js'
import { PricingService } from '../utils/pricing.js'
import { TrackingService } from '../utils/tracking.js'

// Orders route module

const router = Router()

// Get all orders (with filters)
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { status, limit = 50, page = 1 } = req.query

    const query = { tenantId }
    if (status) query.status = status

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// Create new order
router.post('/', async (req, res) => {
  console.log('=== ORDER ROUTE CALLED ===')
  try {
    const tenantId = req.tenantId
    const { items, customerInfo, address, type, payment, tip } = req.body
    
    // Auth info if available from body (since I removed middleware for now)
    const authenticatedUser = req.body.authenticatedUser || null 

    console.log('1. Data validation...')
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Items required' })
    const normalizedType = type || 'delivery'
    const normalizedPayment = { method: payment?.method || 'cash', status: payment?.status || 'pending' }

    // Normalize Items
    const normalizedItems = items.map((item, index) => ({
      itemId: item.itemId || item._id || `custom-${index + 1}`,
      name: item.name,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
      notes: item.notes || ''
    }))

    // Calculate Totals
    console.log('2. Calculating totals...')
    const { subtotal, tax, deliveryFee, total, discount: calcDiscount } = PricingService.calculateTotals(normalizedItems, {
      type: normalizedType,
      tip: Number(tip) || 0
    })

    // Generate Identifiers
    console.log('3. Generating identifiers...')
    const orderNumber = `ORD-${Math.random().toString(16).slice(2, 8).toUpperCase()}`
    const trackingToken = 'TRK-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase()
    const deliveryToken = 'DLV-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase()

    // Loyalty Calculation
    console.log('4. Checking loyalty...')
    let pointsEarned = 0
    try {
      const configQuery = tenantId ? { tenantId } : { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] };
      const loyaltyCfg = await LoyaltyConfig.findOne(configQuery);
      if (authenticatedUser && loyaltyCfg) {
        pointsEarned = Math.floor(total * (loyaltyCfg.pointsPerDollar || 1))
      }
    } catch (e) { console.error('Loyalty lookup failed:', e.message) }

    // Create Order document
    console.log('5. Saving to database...')
    const order = await Order.create({
      tenantId: tenantId || null,
      customerId: authenticatedUser ? authenticatedUser.id : undefined,
      orderNumber,
      trackingToken,
      deliveryToken,
      items: normalizedItems,
      subtotal, tax, deliveryFee, total, discount: calcDiscount,
      pointsEarned,
      status: 'confirmed',
      customerInfo: authenticatedUser ? {
          name: authenticatedUser.name, email: authenticatedUser.email, phone: authenticatedUser.phone
      } : customerInfo,
      address: address || { street: 'Main Street', city: '', zip: '' },
      type: normalizedType, payment: normalizedPayment,
      source: 'website'
    })

    console.log('6. Order created successfully! ID:', order._id)

    // Non-critical updates
    try {
      if (authenticatedUser) {
        await Customer.findByIdAndUpdate(authenticatedUser.id, {
          $inc: { orderCount: 1, totalSpent: total, 'loyalty.points': pointsEarned, 'loyalty.lifetimePoints': pointsEarned },
          $set: { lastOrderAt: new Date(), isGuest: false }
        })
      }
    } catch (e) { console.error('Customer update failed:', e.message) }

    // Send Confirmation Email
    try {
      if (order.customerInfo.email) {
        await sendOrderConfirmation(order, 0, !authenticatedUser)
      }
    } catch (e) { console.error('Email failed:', e.message) }

    res.status(201).json({ 
      success: true, 
      id: order._id, 
      orderNumber: order.orderNumber,
      order: order.toObject() 
    })
  } catch (err) {
    console.error('❌ [ORDER] CRITICAL creation failure:', err)
    res.status(500).json({
      success: false,
      error: 'Order placement failed on server',
      message: err.message
    })
  }
})

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const order = await Order.findOne({ _id: req.params.id, tenantId })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    res.json(order)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// Track order by order number
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const orderInfo = await TrackingService.getPublicTrackingInfo(
      { orderNumber: req.params.orderNumber.toUpperCase() }, 
      tenantId
    )

    if (!orderInfo) {
      return res.status(404).json({ error: 'Order not found' })
    }

    res.json(orderInfo)
  } catch (err) {
    res.status(500).json({ error: 'Failed to track order' })
  }
})

// Track order by tracking token (SECURE SCALABLE APPROACH)
router.get('/tracking/:token', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const orderInfo = await TrackingService.getPublicTrackingInfo(
      { trackingToken: req.params.token },
      tenantId
    )

    if (!orderInfo) {
      return res.status(404).json({ error: 'Tracking info not found' })
    }

    res.json(orderInfo)
  } catch (err) {
    res.status(500).json({ error: 'Failed to track order' })
  }
})

// Removed insecure status update endpoint.
// Use PUT /api/admin/orders/:id/status for status updates (requires admin authentication).

// Track order by phone - changed path to avoid conflict with order number tracking
// Track order by phone - SECURED: Only returns non-sensitive status info
router.get('/track-by-phone/:phone', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const phone = req.params.phone.replace(/\D/g, '')

    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' })
    }

    const orderInfo = await TrackingService.getPublicTrackingInfo(
      { 'customerInfo.phone': phone },
      tenantId
    )

    if (!orderInfo) {
      return res.status(404).json({ error: 'No active order found' })
    }

    res.json(orderInfo)
  } catch (err) {
    console.error('[AUTH] Track by phone error:', err)
    res.status(500).json({ error: 'Failed to track order' })
  }
})

// Cancel order
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, tenantId, status: { $nin: ['delivered', 'cancelled'] } },
      { status: 'cancelled' },
      { returnDocument: 'after' }
    )

    if (!order) {
      return res.status(404).json({ error: 'Order not found or already completed' })
    }

    // Emit WebSocket event to admin room
    const io = req.app.get('io')
    if (io) {
      io.to('admin:orders').emit('order:deleted', order._id)
      io.to(`tenant:${tenantId || 'default'}`).emit('order:update', order)
    }

    res.json({ message: 'Order cancelled', order })
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' })
  }
})

export default router
