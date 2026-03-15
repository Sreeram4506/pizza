import { Router } from 'express'
import { Order } from '../models/Order.js'
import { Customer } from '../models/Customer.js'
import { Loyalty, LoyaltyConfig } from '../models/Loyalty.js'
import { optionalVerifyCustomer } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config.js'
import { sendOrderConfirmation, sendAdminNotification } from '../utils/email.js'

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

  // Apply authentication (handled by optionalVerifyCustomer)
  let authenticatedUser = null
  if (req.customerId && req.customerRole === 'customer') {
    // Attempt to locate customer profile
    const customer = await Customer.findById(req.customerId)
    if (customer) {
      authenticatedUser = {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isGuest: false
      }
    }
  }

  try {
    const tenantId = req.tenantId
    const { items, customerInfo, address, type, payment, pickupDateTime, dineInTime, appliedReward } = req.body

    console.log('Order request - Authenticated user:', authenticatedUser)
    console.log('Order request - Body:', { items, customerInfo, address, type, payment })

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items required' })
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.price) || 0
      const quantity = Number(item.quantity) || 1
      const modifiersTotal = item.modifiers?.reduce((mSum, m) => mSum + (Number(m.price) || 0), 0) || 0
      return sum + (price + modifiersTotal) * quantity
    }, 0)
    const tax = subtotal * 0.08 // 8% tax
    const deliveryFee = type === 'delivery' ? 3.99 : 0
    let discount = 0
    let usedRewardCost = 0
    let usedRewardName = ''

    // Process Loyalty Reward
    if (appliedReward && authenticatedUser) {
      const configQuery = tenantId ? { tenantId } : { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] };
      const config = await LoyaltyConfig.findOne(configQuery);
      if (config) {
        const reward = config.rewards.find(r => r._id.toString() === appliedReward);

        // Validate customer has enough points
        const customerData = await Customer.findById(authenticatedUser.id);
        const currentPoints = customerData?.loyalty?.points || 0;

        if (reward && currentPoints >= reward.pointsCost) {
          usedRewardCost = reward.pointsCost;
          usedRewardName = reward.name;
          if (reward.discountType === 'percentage') {
            discount = subtotal * (reward.discountValue / 100);
          } else {
            discount = reward.discountValue;
          }
        }
      }
    }

    const total = Math.max(0, subtotal - discount) + tax + deliveryFee

    // Use authenticated user info or provided customerInfo
    let finalCustomerInfo
    if (authenticatedUser) {
      finalCustomerInfo = {
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        phone: authenticatedUser.phone
      }
      console.log('Using authenticated user info:', finalCustomerInfo)
    } else if (customerInfo) {
      finalCustomerInfo = customerInfo
      console.log('Using provided customer info:', finalCustomerInfo)
    } else {
      return res.status(400).json({ error: 'Customer information required' })
    }

    // Calculate time estimates based on order type
    const now = new Date()
    let estimatedReadyAt, estimatedDeliveryAt, estimatedDineInTime

    switch (type || 'delivery') {
      case 'delivery':
        estimatedReadyAt = new Date(now.getTime() + 25 * 60 * 1000) // 25 min for prep
        estimatedDeliveryAt = new Date(now.getTime() + 40 * 60 * 1000) // 40 min total (25 prep + 15 delivery)
        estimatedDineInTime = null
        break
      case 'pickup':
        // If customer provided pickupDateTime, use it, otherwise default to 20 min
        if (pickupDateTime) {
          const pickupTime = new Date(pickupDateTime)
          estimatedReadyAt = new Date(pickupTime.getTime() - 5 * 60 * 1000) // Ready 5 min before pickup
        } else {
          estimatedReadyAt = new Date(now.getTime() + 20 * 60 * 1000) // 20 min default
        }
        estimatedDeliveryAt = null
        estimatedDineInTime = null
        break
      case 'dine_in':
        // If customer provided dineInTime, use it, otherwise default to 45 min
        if (dineInTime) {
          const dineTime = new Date()
          const [hours, minutes] = dineInTime.split(':')
          dineTime.setHours(parseInt(hours))
          dineTime.setMinutes(parseInt(minutes))
          estimatedReadyAt = new Date(dineTime.getTime() - 30 * 60 * 1000) // Ready 30 min before dine
          estimatedDineInTime = dineTime
        } else {
          estimatedReadyAt = new Date(now.getTime() + 15 * 60 * 1000) // 15 min default
          estimatedDineInTime = new Date(now.getTime() + 45 * 60 * 1000) // 45 min default
        }
        estimatedDeliveryAt = null
        break
      default:
        estimatedReadyAt = new Date(now.getTime() + 30 * 60 * 1000) // default 30 min
        estimatedDeliveryAt = null
        estimatedDineInTime = null
    }

    const order = new Order({
      tenantId: tenantId || undefined,
      customerId: authenticatedUser ? authenticatedUser.id : undefined,
      orderNumber: `ORD-${uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase()}`,
      items: items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        modifiers: item.modifiers || [],
        notes: item.notes || ''
      })),
      subtotal,
      tax,
      deliveryFee: type === 'delivery' ? 3.99 : 0,
      discount,
      total,
      status: 'confirmed',
      customerInfo: finalCustomerInfo,
      address: address || { street: 'Pickup', city: '', zip: '' },
      type: type || 'delivery',
      payment: payment || { method: 'cash', status: 'pending' },
      estimatedReadyAt,
      estimatedDeliveryAt,
      estimatedDineInTime
    })

    await order.save()

    // Update customer stats
    if (authenticatedUser) {
      // Authenticated user - update their existing record
      console.log('Updating authenticated customer:', authenticatedUser.name)

      const updateQuery = {
        $inc: { orderCount: 1, totalSpent: total },
        $set: {
          lastOrderAt: new Date(),
          isGuest: false
        }
      }

      if (usedRewardCost > 0) {
        if (!updateQuery.$inc) updateQuery.$inc = {}
        updateQuery.$inc['loyalty.points'] = -usedRewardCost
      }

      const customer = await Customer.findOneAndUpdate(
        { ...(tenantId && { tenantId }), _id: authenticatedUser.id },
        updateQuery,
        { returnDocument: 'after' }
      )

      if (usedRewardCost > 0) {
        let loyalty = await Loyalty.findOne({ tenantId: tenantId || null, customerId: customer._id })
        if (!loyalty) {
          loyalty = new Loyalty({ tenantId: tenantId || null, customerId: customer._id })
        }
        loyalty.points = (loyalty.points || 0) - usedRewardCost
        loyalty.transactions.push({
          type: 'redeemed',
          points: -usedRewardCost,
          description: `Used reward: ${usedRewardName}`
        })
        await loyalty.save()
      }

      console.log('Authenticated customer updated:', customer._id, customer.name, 'Order count:', customer.orderCount)
    } else if (customerInfo?.phone) {
      // Guest user - create or update guest record
      console.log('Creating/updating guest customer:', customerInfo.phone, customerInfo.name)

      const customer = await Customer.findOneAndUpdate(
        { ...(tenantId && { tenantId }), phone: customerInfo.phone },
        {
          $inc: { orderCount: 1, totalSpent: total },
          $set: {
            lastOrderAt: new Date(),
            name: customerInfo.name,
            email: customerInfo.email || '',
            isGuest: true
          },
          $setOnInsert: {
            loyalty: { points: 0, lifetimePoints: 0, tier: 'bronze' },
            isActive: true
          }
        },
        { upsert: true, returnDocument: 'after' }
      )

      console.log('Guest customer updated/created:', customer._id, customer.name, 'Order count:', customer.orderCount)
    }

    // Send order confirmation email (non-blocking)
    if (order.customerInfo.email) {
      sendOrderConfirmation(order).catch(err => console.error('Customer email failed:', err))
    }

    // Notify admin (non-blocking)
    sendAdminNotification(order).catch(err => console.error('Admin email failed:', err))

    // Emit WebSocket event to admin room
    const io = req.app.get('io')
    if (io) {
      io.to('admin:orders').emit('order:new', order)
      io.to(`tenant:${tenantId || 'default'}`).emit('order:new', order)
    }

    res.status(201).json(order)
  } catch (err) {
    console.error('CRITICAL Order creation error:', err)
    console.error('Error Stack:', err.stack)
    res.status(500).json({
      error: 'Failed to create order',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
    const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase(), ...(tenantId && { tenantId }) })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    res.json(order)
  } catch (err) {
    res.status(500).json({ error: 'Failed to track order' })
  }
})

// Removed insecure status update endpoint.
// Use PUT /api/admin/orders/:id/status for status updates (requires admin authentication).

// Track order by phone - changed path to avoid conflict with order number tracking
router.get('/track-by-phone/:phone', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const phone = req.params.phone.replace(/\D/g, '')

    const order = await Order.findOne({
      ...(tenantId && { tenantId }),
      'customerInfo.phone': { $regex: phone },
      status: { $nin: ['delivered', 'completed', 'cancelled'] }
    }).sort({ createdAt: -1 })

    if (!order) {
      return res.status(404).json({ error: 'No active order found' })
    }

    res.json(order)
  } catch (err) {
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
