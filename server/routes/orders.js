import { Router } from 'express'
import { Order } from '../models/Order.js'
import { Customer } from '../models/Customer.js'
import { authenticateCustomer } from './auth.js'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { sendOrderConfirmation, sendAdminNotification } from '../utils/email.js'

console.log('Orders route loaded - authenticateCustomer imported:', typeof authenticateCustomer)

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
  console.log('Request headers:', req.headers.authorization)

  // Apply authentication
  let authenticatedUser = null
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      console.log('Token found, verifying...')
      const decoded = jwt.verify(token, config.JWT_SECRET)
      console.log('Token decoded:', decoded)

      if (decoded.role === 'customer') {
        // Find the customer
        const tenantId = req.tenantId
        let customer = null

        if (tenantId) {
          customer = await Customer.findOne({ tenantId, _id: decoded.customerId })
        } else {
          customer = await Customer.findOne({ _id: decoded.customerId })
        }

        if (customer) {
          authenticatedUser = {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            isGuest: false
          }
          console.log('Authentication successful - user:', authenticatedUser)
        }
      }
    }
  } catch (err) {
    console.log('Authentication error:', err.message)
    authenticatedUser = null
  }

  try {
    const tenantId = req.tenantId
    const { items, customerInfo, address, type, payment } = req.body

    console.log('Order request - Authenticated user:', authenticatedUser)
    console.log('Order request - Body:', { items, customerInfo, address, type, payment })

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items required' })
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const modifiersTotal = item.modifiers?.reduce((mSum, m) => mSum + (m.price || 0), 0) || 0
      return sum + (item.price + modifiersTotal) * item.quantity
    }, 0)
    const tax = subtotal * 0.08 // 8% tax
    const deliveryFee = type === 'delivery' ? 3.99 : 0
    const total = subtotal + tax + deliveryFee

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
        if (customerInfo?.pickupDateTime) {
          const pickupTime = new Date(customerInfo.pickupDateTime)
          estimatedReadyAt = new Date(pickupTime.getTime() - 5 * 60 * 1000) // Ready 5 min before pickup
        } else {
          estimatedReadyAt = new Date(now.getTime() + 20 * 60 * 1000) // 20 min default
        }
        estimatedDeliveryAt = null
        estimatedDineInTime = null
        break
      case 'dine_in':
        // If customer provided dineInTime, use it, otherwise default to 45 min
        if (customerInfo?.dineInTime) {
          const dineTime = new Date()
          const [timePart] = customerInfo.dineInTime.split(':')
          dineTime.setHours(parseInt(timePart[0]))
          dineTime.setMinutes(parseInt(timePart[1]))
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
      discount: 0,
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

      const customer = await Customer.findOneAndUpdate(
        { ...(tenantId && { tenantId }), _id: authenticatedUser.id },
        {
          $inc: { orderCount: 1, totalSpent: total },
          $set: {
            lastOrderAt: new Date(),
            isGuest: false
          }
        },
        { new: true }
      )

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
        { upsert: true, new: true }
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
    console.error('Order creation error:', err)
    res.status(500).json({ error: 'Failed to create order' })
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

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { status } = req.body

    const updateData = { status }

    if (status === 'delivered') {
      updateData.actualDeliveredAt = new Date()
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      updateData,
      { new: true }
    )

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Emit WebSocket event to admin room, tenant room, AND the specific order room
    const io = req.app.get('io')
    if (io) {
      io.to('admin:orders').emit('order:update', order)
      io.to(`tenant:${tenantId || 'default'}`).emit('order:update', order)
      io.to(`order:${order._id}`).emit('order:status_update', {
        id: order._id,
        status: order.status,
        message: `Your order is now ${order.status}!`
      })
    }

    res.json(order)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' })
  }
})

// Track order by phone
router.get('/track/:phone', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const phone = req.params.phone.replace(/\D/g, '')

    const order = await Order.findOne({
      tenantId,
      'customerInfo.phone': { $regex: phone },
      status: { $nin: ['delivered', 'cancelled'] }
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
      { new: true }
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
