import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { Order } from '../models/Order.js'

const router = Router()

// Middleware to verify delivery user
const verifyDelivery = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) return res.status(401).json({ error: 'Access denied' })

        const decoded = jwt.verify(token, config.JWT_SECRET)
        // If they are admin/manager, we can allow them to pretend, but optimally checking role
        req.user = decoded
        next()
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' })
    }
}

// Get active deliveries assigned to the logged-in driver
router.get('/orders', verifyDelivery, async (req, res) => {
    try {
        const tenantId = req.tenantId

        // Find orders where this user is assigned, and status is out_for_delivery
        const orders = await Order.find({
            deliveryPersonId: req.user.id,
            status: 'out_for_delivery',
            ...(tenantId && { tenantId })
        }).sort({ createdAt: -1 })

        res.json(orders)

    } catch (err) {
        console.error('Failed to fetch delivery orders:', err)
        res.status(500).json({ error: 'Failed to fetch delivery orders' })
    }
})

// Mark an order as delivered
router.put('/orders/:id/deliver', verifyDelivery, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const { id } = req.params

        const order = await Order.findOneAndUpdate(
            {
                _id: id,
                deliveryPersonId: req.user.id, // Security: they can only deliver their own assignment
                ...(tenantId && { tenantId })
            },
            {
                status: 'delivered',
                actualDeliveredAt: new Date()
            },
            { new: true }
        )

        if (!order) {
            return res.status(404).json({ error: 'Order not found or not assigned to you' })
        }

        // Emit WebSocket updates
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
        console.error('Failed to mark order delivered:', err)
        res.status(500).json({ error: 'Failed to mark order as delivered' })
    }
})

export default router
