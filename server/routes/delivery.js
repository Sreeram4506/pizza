import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { Order } from '../models/Order.js'
import { User } from '../models/User.js'
import { ExternalPlatformService } from '../utils/externalPlatforms.js'

const router = Router()

// Middleware to verify delivery user
const verifyDelivery = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) return res.status(401).json({ error: 'Access denied' })

        const decoded = jwt.verify(token, config.JWT_SECRET)
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

router.get('/stats', verifyDelivery, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const query = {
            deliveryPersonId: req.user.id,
            status: 'delivered',
            ...(tenantId && { tenantId })
        }
        const deliveredOrders = await Order.find(query)
        const totalEarnings = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        res.json({
            deliveredCount: deliveredOrders.length,
            totalEarnings,
            avgDeliveryTime: 24
        })
    } catch (err) {
        console.error('Failed to fetch delivery stats:', err)
        res.status(500).json({ error: 'Failed' })
    }
})

// Mark an order as delivered
router.put('/orders/:id/deliver', verifyDelivery, async (req, res) => {
    try {
        const { deliveryNotes } = req.body
        const tenantId = req.tenantId
        const order = await Order.findOneAndUpdate(
            {
                _id: req.params.id,
                deliveryPersonId: req.user.id,
                ...(tenantId && { tenantId })
            },
            {
                status: 'delivered',
                actualDeliveredAt: new Date(),
                deliveryNotes: deliveryNotes || ''
            },
            { returnDocument: 'after' }
        )
        if (!order) return res.status(404).json({ error: 'Order not found' })

        const io = req.app.get('io')
        if (io) {
            io.to('admin:orders').emit('order:update', order)
            io.to(`tenant:${tenantId || 'default'}`).emit('order:update', order)
            io.to(`order:${order._id}`).emit('order:status_update', { id: order._id, status: 'delivered' })
        }
        
        // Sync with external platforms
        if (order.externalOrderId) {
            await ExternalPlatformService.updateStatus(order)
        }
        res.json(order)
    } catch (err) {
        console.error('Failed to mark order delivered:', err)
        res.status(500).json({ error: 'Failed' })
    }
})

// Update driver's live location
router.post('/orders/:id/location', verifyDelivery, async (req, res) => {
    try {
        const { lat, lng } = req.body
        const tenantId = req.tenantId
        const order = await Order.findOneAndUpdate(
            { 
                _id: req.params.id, 
                deliveryPersonId: req.user.id,
                status: 'out_for_delivery',
                ...(tenantId && { tenantId })
            },
            { 
                'driverLocation.lat': lat,
                'driverLocation.lng': lng,
                'driverLocation.updatedAt': new Date()
            },
            { returnDocument: 'after' }
        )
        if (!order) return res.status(404).json({ error: 'Active order not found' })

        const io = req.app.get('io')
        if (io) io.to(`order:${order._id}`).emit('order:driver_location', { lat, lng, updatedAt: new Date() })
        res.json({ success: true })
    } catch (err) {
        console.error('Failed to update driver location:', err)
        res.status(500).json({ error: 'Failed' })
    }
})

// ==========================================
// 🚚 3RD PARTY / MAGIC LINK DRIVER ROUTES
// (No Login Required - Authorized by Token)
// ==========================================

// Get order via delivery token
router.get('/token/:token', async (req, res) => {
    try {
        const order = await Order.findOne({ 
            deliveryToken: req.params.token,
            status: { $nin: ['delivered', 'cancelled'] }
        })
        if (!order) return res.status(404).json({ error: 'Order not found' })
        res.json(order)
    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

// Mark as delivered via token
router.put('/token/:token/deliver', async (req, res) => {
    try {
        const { deliveryNotes } = req.body
        const order = await Order.findOneAndUpdate(
            { deliveryToken: req.params.token },
            { 
                status: 'delivered', 
                actualDeliveredAt: new Date(),
                deliveryNotes: deliveryNotes || ''
            },
            { returnDocument: 'after' }
        )
        if (!order) return res.status(404).json({ error: 'Order not found' })

        const io = req.app.get('io')
        if (io) {
            io.to(`order:${order._id}`).emit('order:status_update', { id: order._id, status: 'delivered' })
            io.to('admin:orders').emit('order:update', order)
        }
        
        // Sync with external platforms
        if (order.externalOrderId) {
            await ExternalPlatformService.updateStatus(order)
        }
        res.json({ success: true, order })
    } catch (err) {
        res.status(500).json({ error: 'Failed' })
    }
})

// Update GPS via token
router.post('/token/:token/location', async (req, res) => {
    try {
        const { lat, lng } = req.body
        const order = await Order.findOneAndUpdate(
            { deliveryToken: req.params.token, status: 'out_for_delivery' },
            { 'driverLocation.lat': lat, 'driverLocation.lng': lng, 'driverLocation.updatedAt': new Date() }
        )
        if (!order) return res.status(404).json({ error: 'Active delivery not found' })

        const io = req.app.get('io')
        if (io) io.to(`order:${order._id}`).emit('order:driver_location', { lat, lng, updatedAt: new Date() })
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed' })
    }
})

// Update driver's availability status (Online/Offline)
router.put('/status', verifyDelivery, async (req, res) => {
    try {
        const { isActive } = req.body
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { isActive: !!isActive },
            { new: true }
        ).select('isActive name')

        if (!user) return res.status(404).json({ error: 'User not found' })

        res.json({ success: true, isActive: user.isActive })
    } catch (err) {
        console.error('Failed to update driver status:', err)
        res.status(500).json({ error: 'Failed to update status' })
    }
})

export default router
