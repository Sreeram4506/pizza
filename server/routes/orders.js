import { Router } from 'express'
import { Order } from '../models/Order.js'
import { Customer } from '../models/Customer.js'
import { User } from '../models/User.js'
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
router.post('/', optionalVerifyCustomer, async (req, res) => {
  console.log('=== ORDER ROUTE CALLED ===')
  try {
    const tenantId = req.tenantId
    const { items, customerInfo, address, type, payment, tip } = req.body
    
    // Auth info if available from middleware
    const authenticatedId = req.customerId || null 

    console.log('1. Data validation...')
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Items required' })
    const normalizedType = type || 'delivery'
    const normalizedPayment = { method: payment?.method || 'cash', status: payment?.status || 'pending' }

    // Normalize Items
    const normalizedItems = items.map((item, index) => ({
      itemId: item.itemId || item._id || `custom-${index + 1}`,
      name: item.name,
      price: item.isPointsRedemption ? 0 : (Number(item.price) || 0),
      quantity: Number(item.quantity) || 1,
      modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
      isPointsRedemption: item.isPointsRedemption || false,
      pointsCost: item.pointsCost || 0,
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
    let pointsRedeemed = 0
    
    // Calculate totals for loyalty
    pointsRedeemed = normalizedItems.reduce((sum, item) => sum + (item.isPointsRedemption ? (item.pointsCost * item.quantity) : 0), 0)
    pointsEarned = Math.floor(total * 0.05)

    if (authenticatedId && pointsRedeemed > 0) {
      const customer = await Customer.findById(authenticatedId)
      if (!customer || (customer.loyalty?.points || 0) < pointsRedeemed) {
        return res.status(400).json({ error: 'Insufficient loyalty points' })
      }
    }

    // 4.5 Automatic Driver Assignment (New Logic requested by user)
    let autoAssignedDriver = null
    if (normalizedType === 'delivery') {
      try {
        const driverQuery = { role: 'delivery', isActive: true, ...(tenantId && { tenantId }) }
        autoAssignedDriver = await User.findOne(driverQuery)
        console.log(autoAssignedDriver ? `[AUTO-DISPATCH] Assigned driver: ${autoAssignedDriver.name}` : '[AUTO-DISPATCH] No active drivers found.')
      } catch (e) {
        console.error('[AUTO-DISPATCH] Error during lookup:', e.message)
      }
    }

    // Create Order document
    console.log('5. Saving to database...')
    const order = await Order.create({
      tenantId: tenantId || null,
      customerId: authenticatedId,
      deliveryPersonId: autoAssignedDriver ? autoAssignedDriver._id : undefined,
      orderNumber,
      trackingToken,
      deliveryToken,
      items: normalizedItems,
      subtotal, tax, deliveryFee, total, discount: calcDiscount,
      pointsEarned: authenticatedId ? pointsEarned : 0,
      pointsRedeemed: authenticatedId ? pointsRedeemed : 0,
      status: autoAssignedDriver ? 'preparing' : 'confirmed', // Speed up flow
      customerInfo: authenticatedId ? {
          ...customerInfo, // Keep what was sent (name/phone)
          email: req.customerEmail || customerInfo.email
      } : customerInfo,
      address: address || { street: 'Main Street', city: '', zip: '' },
      type: normalizedType, payment: normalizedPayment,
      source: 'website'
    })

    console.log('6. Order created successfully! ID:', order._id)

    // Notify Driver if auto-assigned (Future enhancement: WhatsApp/SMS)
    const io = req.app.get('io')
    if (io && autoAssignedDriver) {
      io.to('admin:orders').emit('order:new', order) // Still notify kitchen
      // Special event for drivers could go here
    }

    // Non-critical updates
    try {
      if (authenticatedId) {
        const pointsDiff = pointsEarned - pointsRedeemed
        await Customer.findByIdAndUpdate(authenticatedId, {
          $inc: { 
            orderCount: 1, 
            totalSpent: total, 
            'loyalty.points': pointsDiff, 
            'loyalty.lifetimePoints': pointsEarned 
          },
          $set: { lastOrderAt: new Date(), isGuest: false }
        })
      }
    } catch (e) { console.error('Customer update failed:', e.message) }

    // Send Confirmation Email
    try {
      if (order.customerInfo.email) {
        await sendOrderConfirmation(order, 0, !authenticatedId)
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
