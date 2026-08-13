import { Router } from 'express'
import { Order } from '../models/Order.js'
import { User } from '../models/User.js'
import { PricingService } from '../utils/pricing.js'
import crypto from 'crypto'

const router = Router()

// Builds a webhook signature-verification middleware for a given platform.
// Fails closed (rejects the request) if the platform secret is missing in
// production, rather than silently skipping verification.
function verifyWebhookSignature(headerName, envVar) {
  return (req, res, next) => {
    const signature = req.headers[headerName]
    if (!signature) return res.status(401).json({ error: 'No signature' })

    const clientSecret = process.env[envVar]
    if (!clientSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error(`${envVar} is not configured; rejecting webhook request`)
        return res.status(500).json({ error: 'Webhook not configured' })
      }
      return next() // Not configured in dev - skip verification
    }

    const hmac = crypto.createHmac('sha256', clientSecret)
    const digest = hmac.update(JSON.stringify(req.body)).digest('hex')

    const signatureBuffer = Buffer.from(signature)
    const digestBuffer = Buffer.from(digest)
    const isValid = signatureBuffer.length === digestBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, digestBuffer)

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
    next()
  }
}

const verifyUberEats = verifyWebhookSignature('x-uber-signature', 'UBER_EATS_CLIENT_SECRET')
const verifyGrubhub = verifyWebhookSignature('x-grubhub-signature', 'GRUBHUB_CLIENT_SECRET')

// Uber Eats Webhook
router.post('/ubereats', verifyUberEats, async (req, res) => {
  console.log('=== UBER EATS WEBHOOK CALLED ===', req.body)
  try {
    const { order_id, store_id, cart, customer, delivery_info } = req.body
    
    // Map Uber Eats data to our Order model
    const items = cart.items.map(item => ({
      itemId: item.id,
      name: item.title,
      price: item.price / 100, // Assuming Uber sends in cents
      quantity: item.quantity,
      modifiers: item.selected_options ? item.selected_options.map(opt => ({
        name: opt.title,
        price: opt.price / 100
      })) : [],
      notes: item.special_instructions || ''
    }))

    const orderNumber = `UBER-${order_id.substring(0, 6).toUpperCase()}`
    const trackingToken = 'TRK-UBER-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    const deliveryToken = 'DLV-UBER-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    // Auto-assign driver
    const driverQuery = { role: 'delivery', isActive: true }
    const autoAssignedDriver = await User.findOne(driverQuery)

    const order = await Order.create({
      externalOrderId: order_id,
      externalPlatform: 'ubereats',
      source: 'ubereats',
      orderNumber,
      trackingToken,
      deliveryToken,
      items,
      subtotal: cart.subtotal / 100,
      tax: cart.tax / 100,
      deliveryFee: cart.delivery_fee / 100,
      total: cart.total / 100,
      status: 'confirmed',
      type: 'delivery',
      customerInfo: {
        name: `${customer.first_name} ${customer.last_name}`,
        phone: customer.phone_number,
        email: customer.email || ''
      },
      address: {
        street: delivery_info.destination.address_line_1,
        city: delivery_info.destination.city,
        zip: delivery_info.destination.postal_code,
        instructions: delivery_info.destination.instructions || ''
      },
      payment: {
        method: 'online',
        status: 'paid'
      },
      deliveryPersonId: autoAssignedDriver ? autoAssignedDriver._id : undefined
    })

    // Notify via Socket.io
    const io = req.app.get('io')
    if (io) {
      io.to('admin:orders').emit('order:new', order)
    }

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Uber Eats Webhook Error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Grubhub Webhook
router.post('/grubhub', verifyGrubhub, async (req, res) => {
  console.log('=== GRUBHUB WEBHOOK CALLED ===', req.body)
  try {
    const { id, order_number, cart, customer, address_info } = req.body
    
    const items = cart.items.map(item => ({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      modifiers: item.options ? item.options.map(opt => ({
        name: opt.name,
        price: opt.price
      })) : [],
      notes: item.instructions || ''
    }))

    const orderNumber = `GRUB-${order_number || id.substring(0, 6).toUpperCase()}`
    const trackingToken = 'TRK-GRUB-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    const deliveryToken = 'DLV-GRUB-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    const driverQuery = { role: 'delivery', isActive: true }
    const autoAssignedDriver = await User.findOne(driverQuery)

    const order = await Order.create({
      externalOrderId: id,
      externalPlatform: 'grubhub',
      source: 'grubhub',
      orderNumber,
      trackingToken,
      deliveryToken,
      items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      deliveryFee: cart.delivery_fee,
      total: cart.total,
      status: 'confirmed',
      type: 'delivery',
      customerInfo: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || ''
      },
      address: {
        street: address_info.street,
        city: address_info.city,
        zip: address_info.zip,
        instructions: address_info.notes || ''
      },
      payment: {
        method: 'online',
        status: 'paid'
      },
      deliveryPersonId: autoAssignedDriver ? autoAssignedDriver._id : undefined
    })

    const io = req.app.get('io')
    if (io) {
      io.to('admin:orders').emit('order:new', order)
    }

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Grubhub Webhook Error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
