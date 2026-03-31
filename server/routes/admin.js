import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { uploadToCloudinary } from '../utils/cloudinary.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Order } from '../models/Order.js'
import { Customer } from '../models/Customer.js'
import { User } from '../models/User.js'
import { MenuCategory } from '../models/MenuCategory.js'
import { MenuItem } from '../models/MenuItem.js'
import { Settings } from '../models/Settings.js'
import { EmailCampaign } from '../models/EmailCampaign.js'
import { PromotionalBanner } from '../models/PromotionalBanner.js'
import { Loyalty, LoyaltyConfig } from '../models/Loyalty.js'
import { config } from '../config.js'
import { sendMarketingEmail, sendReservationConfirmation, sendCateringConfirmation } from '../utils/email.js'
import { verifyAdmin } from '../middleware/auth.js'
import { isConnected } from '../utils/database.js'
import { Catering } from '../models/Catering.js'
import { Reservation } from '../models/Reservation.js'
import { ImageService } from '../utils/image.js'
import { ExternalPlatformService } from '../utils/externalPlatforms.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

const emitPromotionalBannerUpdate = (req, eventName, payload) => {
    const io = req.app.get('io')
    if (!io) return

    io.emit(eventName, payload)
    io.emit('promotional_banners_updated', {
        type: eventName,
        banner: payload
    })
}

// Configure multer for image uploads dynamically (Cloudinary vs Local)
const isCloudStorage = !!(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME)
const storage = isCloudStorage 
    ? multer.memoryStorage() 
    : multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '../uploads/menu'))
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, 'menu-' + uniqueSuffix + path.extname(file.originalname))
        }
    })

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false)
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

// Admin credentials and JWT Secret from config
// Admin credentials from config
const ADMIN_USER = () => config.adminUsername
const ADMIN_PASS_HASH = bcrypt.hashSync(config.adminPassword, 10)

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' })
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files.' })
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Unexpected file field.' })
        }
    }
    if (err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message })
    }
    next(err)
}

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' })
        }

        const adminUser = ADMIN_USER()
        const adminHash = ADMIN_PASS_HASH

        if (username === adminUser && bcrypt.compareSync(password, adminHash)) {
            const token = jwt.sign({ role: 'admin' }, config.JWT_SECRET, { expiresIn: '1d' })
            return res.json({ token })
        }

        res.status(401).json({ error: 'Invalid credentials' })
    } catch (err) {
        console.error('[ADMIN LOGIN] CRITICAL ERROR:', err)
        res.status(500).json({ error: 'Internal server error during login', details: err.message })
    }
})

// Get all orders
router.get('/orders', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        let query = {}

        // Only add tenantId filter if it exists (for production)
        if (tenantId) {
            query.tenantId = tenantId
        }

        const orders = await Order.find(query)
            .populate('deliveryPersonId', 'name phone email')
            .sort({ createdAt: -1 })
            .limit(100)
        res.json(orders)
    } catch (err) {
        console.error('Failed to fetch orders:', err)
        res.status(500).json({ error: 'Failed to fetch orders' })
    }
})

// Update order status
router.put('/orders/:id/status', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const { status } = req.body

        const updateData = { status }
        if (status === 'delivered' || status === 'completed') {
            updateData.actualDeliveredAt = new Date()
        }

        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, ...(tenantId && { tenantId }) },
            updateData,
            { returnDocument: 'after' }
        )

        if (!order) {
            return res.status(404).json({ error: 'Order not found' })
        }

        // Award loyalty points if status is completed/delivered
        if (order.status === 'completed' || order.status === 'delivered') {
            try {
                const loyaltyConfig = await LoyaltyConfig.findOne({ ...(tenantId && { tenantId }) })
                if (loyaltyConfig?.enabled && order.total > 0) {
                    const phone = order.customerInfo?.phone
                    const customer = await Customer.findOne({
                        ...(tenantId && { tenantId }),
                        $or: [
                            ...(order.customerId ? [{ _id: order.customerId }] : []),
                            ...(phone ? [{ phone }] : [])
                        ]
                    })

                    if (customer) {
                        const pointsToAward = Math.floor(order.total * (loyaltyConfig.pointsPerDollar || 1))

                        // Check if already awarded (simple check - though better to track in order)
                        // Implementation note: Ideally we mark order as 'points_awarded: true'
                        // Since we don't have that field yet, we'll check if a transaction exists for this orderId
                        const existingTransaction = await Loyalty.findOne({
                            customerId: customer._id,
                            'transactions.orderId': order._id
                        })

                        if (!existingTransaction && pointsToAward > 0) {
                            customer.loyalty.points += pointsToAward
                            customer.loyalty.lifetimePoints += pointsToAward
                            await customer.save()

                            let loyalty = await Loyalty.findOne({ customerId: customer._id })
                            if (!loyalty) loyalty = new Loyalty({ tenantId: tenantId || customer.tenantId, customerId: customer._id })

                            loyalty.points += pointsToAward
                            loyalty.lifetimePoints += pointsToAward
                            loyalty.transactions.push({
                                type: 'earned',
                                points: pointsToAward,
                                orderId: order._id,
                                description: `Points earned from order #${order.orderNumber}`
                            })
                            await loyalty.save()
                            console.log(`[LOYALTY] Awarded ${pointsToAward} points to ${customer.name}`)
                        }
                    }
                }
            } catch (loyaltyErr) {
                console.error('[LOYALTY ERROR] Failed to award points:', loyaltyErr.message)
            }
        }

        // Emit WebSocket events
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
        
        // Sync with external platforms
        if (order.externalOrderId) {
            await ExternalPlatformService.updateStatus(order)
        }

        res.json(order)
    } catch (err) {
        console.error('Failed to update status:', err)
        res.status(500).json({ error: 'Failed to update status' })
    }
})

// Assign delivery driver to order
router.put('/orders/:id/assign', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const { id } = req.params
        const { deliveryPersonId } = req.body

        const order = await Order.findOneAndUpdate(
            { _id: id, ...(tenantId && { tenantId }) },
            { deliveryPersonId, status: 'out_for_delivery' },
            { returnDocument: 'after' }
        ).populate('deliveryPersonId', 'name phone')

        if (!order) {
            return res.status(404).json({ error: 'Order not found' })
        }

        const io = req.app.get('io')
        if (io) {
            io.to('admin:orders').emit('order:update', order)
            io.to(`tenant:${tenantId || 'default'}`).emit('order:update', order)
        }
        
        // Sync with external platforms
        if (order.externalOrderId) {
            await ExternalPlatformService.updateStatus(order)
        }

        res.json(order)
    } catch (err) {
        console.error('Failed to assign driver:', err)
        res.status(500).json({ error: 'Failed to assign driver' })
    }
})

// Get delivery role users
router.get('/delivery-users', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        let query = { role: 'delivery' }

        if (tenantId) {
            query.tenantId = tenantId
        }

        const drivers = await User.find(query).select('name phone email isActive')
        res.json(drivers)
    } catch (err) {
        console.error('Failed to fetch delivery users:', err)
        res.status(500).json({ error: 'Failed to fetch delivery users' })
    }
})

// Cancel/Delete order
router.delete('/orders/:id', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const { id } = req.params

        const order = await Order.findOneAndDelete({ _id: id, ...(tenantId && { tenantId }) })
        if (!order) {
            return res.status(404).json({ error: 'Order not found' })
        }

        const io = req.app.get('io')
        if (io) {
            io.to('admin:orders').emit('order:deleted', id)
        }

        res.json({ message: 'Order deleted successfully' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete order' })
    }
})

// Get registered users
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        let query = {}

        // Only add tenantId filter if it exists (for production)
        if (tenantId) {
            query.tenantId = tenantId
        }

        const customers = await Customer.find(query)
            .select('name email phone createdAt orderCount totalSpent loyalty lastOrderAt isGuest')
            .sort({ createdAt: -1 })
            .limit(100)
        res.json(customers)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' })
    }
})

// Comprehensive analytics
router.get('/analytics', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        let query = {}

        // Only add tenantId filter if it exists (for production)
        if (tenantId) {
            query.tenantId = tenantId
        }

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        // Aggregated stats (replaces looping)
        const orderStats = await Order.aggregate([
            { $match: { ...query, status: { $nin: ['cancelled'] } } },
            { 
               $group: { 
                 _id: null, 
                 totalRevenue: { $sum: '$total' },
                 totalTips: { $sum: '$tip' },
                 totalCashRevenue: { $sum: { $cond: [{ $eq: ['$payment.method', 'cash'] }, '$total', 0] } },
                 totalCardRevenue: { $sum: { $cond: [{ $in: ['$payment.method', ['card', 'online']] }, '$total', 0] } }
               } 
            }
        ])
        const stats = orderStats[0] || { totalRevenue: 0, totalTips: 0, totalCashRevenue: 0, totalCardRevenue: 0 }
        
        // Today's orders
        const todayOrdersQuery = { ...query, createdAt: { $gte: today }, status: { $nin: ['cancelled'] } }
        const todayStats = await Order.aggregate([
            { $match: todayOrdersQuery },
            { $group: { _id: null, count: { $sum: 1 }, totalRevenue: { $sum: '$total' } } }
        ])
        const todayData = todayStats[0] || { count: 0, totalRevenue: 0 }

        // Pending orders
        const pendingOrders = await Order.countDocuments({ ...query, status: 'pending' })
        const totalOrders = await Order.countDocuments(query)

        // Active customers (customers with orders)
        const activeCustomers = await Customer.countDocuments({ ...query, orderCount: { $gt: 0 } })

        // Average order value
        const avgOrderValue = totalOrders > 0 ? stats.totalRevenue / totalOrders : 0

        // Popular items Aggregation
        const popularItems = await Order.aggregate([
            { $match: { ...query, status: { $nin: ['cancelled'] } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.name', count: { $sum: { $ifNull: ['$items.quantity', 1] } } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { name: '$_id', count: 1, _id: 0 } }
        ])

        // Recent orders
        const recentOrders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(10)

        res.json({
            totalRevenue: stats.totalRevenue,
            totalCashRevenue: stats.totalCashRevenue,
            totalCardRevenue: stats.totalCardRevenue,
            totalTips: stats.totalTips,
            totalOrders,
            todayOrders: todayData.count,
            todayRevenue: todayData.totalRevenue,
            activeCustomers,
            pendingOrders,
            avgOrderValue,
            popularItems,
            recentOrders
        })
    } catch (err) {
        console.error('Failed to fetch analytics:', err)
        res.status(500).json({ error: 'Failed to fetch analytics' })
    }
})

// Send Offers (Direct)
router.post('/send-offers', verifyAdmin, async (req, res) => {
    const { emails, subject, message } = req.body

    try {
        const tenantId = req.tenantId
        let target = emails

        if (!target || target.length === 0) {
            // If No tenantId (localhost), search all. Otherwise search by tenant.
            const query = tenantId ? { tenantId } : {}
            const customers = await Customer.find(query)
            target = customers.map(c => ({ email: c.email, name: c.name })).filter(c => c.email)
        } else {
            // Assume emails is an array of strings
            target = emails.map(e => ({ email: e, name: 'Valued Customer' }))
        }

        console.log(`Sending marketing emails via backend utility...`)

        const sendPromises = target.map(t => sendMarketingEmail(t.email, subject, message, t.name))
        const results = await Promise.allSettled(sendPromises)

        const successCount = results.filter(r => r.status === 'fulfilled').length
        res.json({ success: true, message: `Emails sent successfully to ${successCount} customers.` })
    } catch (err) {
        console.error('Marketing email failed', err)
        res.status(500).json({ success: false, error: 'Failed to send emails' })
    }
})

// Menu Category Management
router.get('/menu/categories', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        let query = {}

        // Only add tenantId filter if it exists (for production)
        if (tenantId) {
            query.tenantId = tenantId
        }

        const categories = await MenuCategory.find(query)
            .sort({ sortOrder: 1, createdAt: 1 })
        res.json(categories)
    } catch (err) {
        console.error('Failed to fetch categories:', err)
        res.status(500).json({ error: 'Failed to fetch categories' })
    }
})

router.post('/menu/categories', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const { name, description, sortOrder } = req.body

        const category = new MenuCategory({
            ...(tenantId && { tenantId }),
            name,
            description: description || '',
            sortOrder: sortOrder || 0
        })

        await category.save()

        // Emit WebSocket event
        const io = req.app.get('io')
        if (io) {
            io.emit('menu_updated', {
                type: 'category_added',
                category: category,
                message: `New category "${name}" added`
            })
        }

        res.status(201).json(category)
    } catch (err) {
        console.error('Failed to create category:', err)
        res.status(500).json({ error: 'Failed to create category' })
    }
})

router.put('/menu/categories/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const { name, description, sortOrder } = req.body

        const category = await MenuCategory.findByIdAndUpdate(
            id,
            { name, description: description || '', sortOrder: sortOrder || 0 },
            { returnDocument: 'after' }
        )

        if (!category) {
            return res.status(404).json({ error: 'Category not found' })
        }

        res.json(category)
    } catch (err) {
        console.error('Failed to update category:', err)
        res.status(500).json({ error: 'Failed to update category' })
    }
})

router.delete('/menu/categories/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const category = await MenuCategory.findByIdAndDelete(id)

        if (!category) {
            return res.status(404).json({ error: 'Category not found' })
        }

        res.json({ message: 'Category deleted successfully' })
    } catch (err) {
        console.error('Failed to delete category:', err)
        res.status(500).json({ error: 'Failed to delete category' })
    }
})

// Menu Item Management
router.get('/menu/items', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        let query = {}

        // Only add tenantId filter if it exists (for production)
        if (tenantId) {
            query.tenantId = tenantId
        }

        const items = await MenuItem.find(query)
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
        res.json(items)
    } catch (err) {
        console.error('Failed to fetch menu items:', err)
        res.status(500).json({ error: 'Failed to fetch menu items' })
    }
})

router.post('/menu/items', verifyAdmin, handleMulterError, upload.single('image'), async (req, res) => {
    try {
        console.log('POST /menu/items - Request received')
        console.log('Body:', req.body)
        console.log('File:', req.file)

        const tenantId = req.tenantId
        const { name, description, price, categoryId, available, modifiers, tags, dietary, image, isLoyaltyItem, loyaltyCost } = req.body

        // Build item data
        const itemData = {
            ...(tenantId && { tenantId }),
            name,
            description: description || '',
            price: parseFloat(price),
            categoryId,
            available: available !== 'false' && available !== false,
            modifiers: modifiers ? JSON.parse(modifiers) : [],
            tags: tags ? JSON.parse(tags) : [],
            dietary: dietary ? JSON.parse(dietary) : {},
            isLoyaltyItem: isLoyaltyItem === 'true' || isLoyaltyItem === true,
            loyaltyCost: loyaltyCost ? parseInt(loyaltyCost) : 0
        }

        // Add image path if uploaded (Cloud vs Local)
        if (req.file) {
            if (req.file.buffer) {
                // Cloudinary upload
                itemData.image = await uploadToCloudinary(req.file.buffer, 'pizzablast/menu')
            } else {
                // Local upload fallback
                itemData.image = ImageService.getStoredPath(req.file, 'menu')
            }
            console.log('Image saved:', itemData.image)
        } else if (typeof image === 'string' && image.startsWith('/uploads/menu/')) {
            itemData.image = ImageService.getPublicUrl(image)
        }

        console.log('Creating item with data:', itemData)

        const item = new MenuItem(itemData)
        await item.save()

        console.log('Item saved successfully:', item)

        // Emit WebSocket event
        const io = req.app.get('io')
        if (io) {
            io.emit('item_added', {
                type: 'item_added',
                item: item,
                message: `New item "${name}" added to menu`
            })
        }

        res.status(201).json(item)
    } catch (err) {
        console.error('Failed to create menu item:', err)
        res.status(500).json({ error: 'Failed to create menu item', details: err.message })
    }
})

router.put('/menu/items/:id', verifyAdmin, handleMulterError, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params
        const { name, description, price, categoryId, available, modifiers, tags, dietary, image, isLoyaltyItem, loyaltyCost } = req.body

        // Build update data
        const updateData = {
            name,
            description: description || '',
            price: parseFloat(price),
            categoryId,
            available: available !== 'false' && available !== false,
            modifiers: modifiers ? JSON.parse(modifiers) : [],
            tags: tags ? JSON.parse(tags) : [],
            dietary: dietary ? JSON.parse(dietary) : {},
            isLoyaltyItem: isLoyaltyItem === 'true' || isLoyaltyItem === true,
            loyaltyCost: loyaltyCost ? parseInt(loyaltyCost) : 0
        }

        // Handle image update securely 
        if (req.file) {
            if (req.file.buffer) {
                updateData.image = await uploadToCloudinary(req.file.buffer, 'pizzablast/menu')
            } else {
                updateData.image = ImageService.getStoredPath(req.file, 'menu')
            }
            console.log('Image updated:', updateData.image)
        } else if (typeof image === 'string') {
            updateData.image = image
        }

        const item = await MenuItem.findByIdAndUpdate(
            id,
            updateData,
            { returnDocument: 'after' }
        )

        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' })
        }

        // Emit WebSocket event
        const io = req.app.get('io')
        if (io) {
            io.emit('item_updated', {
                type: 'item_updated',
                item: item,
                message: `Item "${name}" updated`
            })
        }

        res.json(item)
    } catch (err) {
        console.error('Failed to update menu item:', err)
        res.status(500).json({ error: 'Failed to update menu item', details: err.message })
    }
})

router.delete('/menu/items/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const item = await MenuItem.findByIdAndDelete(id)

        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' })
        }

        // Emit WebSocket event
        const io = req.app.get('io')
        if (io) {
            io.emit('item_removed', {
                type: 'item_removed',
                itemName: item.name,
                itemId: id,
                message: `Item "${item.name}" removed from menu`
            })
        }

        res.json({ message: 'Menu item deleted successfully' })
    } catch (err) {
        console.error('Failed to delete menu item:', err)
        res.status(500).json({ error: 'Failed to delete menu item' })
    }
})

// Public Settings (no auth required)
router.get('/public/settings', async (req, res, next) => {
    try {
        const tenantId = req.tenantId
        console.log('GET /admin/public/settings - Request received')
        console.log('Tenant ID:', tenantId)

        let settings
        if (tenantId) {
            settings = await Settings.findOne({ tenantId })
        } else {
            // Mock settings if DB is down
            if (!isConnected) {
                console.warn('⚠️ [SETTINGS] FALLBACK: Serving mock settings because Database is disconnected.')
                return res.json({
                    restaurantName: 'Restaurant Name',
                    email: 'contact@example.com',
                    phone: '+1 (555) 000-0000',
                    address: 'Main Street, City, State',
                    currency: 'USD',
                    timezone: 'UTC'
                })
            }
            settings = await Settings.findOne({ tenantId: null }) || await Settings.findOne({ tenantId: { $exists: false } })
        }

        if (!settings) {
            settings = {
                restaurantName: 'Pizza Blast',
                email: 'contact@pizzablast.com',
                phone: '+1 (555) 123-4567',
                address: '123 Pizza Plaza, New York, NY 10001',
                currency: 'USD',
                timezone: 'America/New_York'
            }
        }

        console.log('Public settings found:', settings)
        res.json(settings)
    } catch (err) {
        next(err)
    }
})

// Public API for restaurant stats (no auth)
router.get('/public/stats', async (req, res, next) => {
    try {
        const tenantId = req.tenantId
        const query = tenantId ? { tenantId } : {}
        
        if (!isConnected) {
            return res.json({
                orders: 450,
                customers: 120,
                experienceYears: 12
            })
        }

        const [orderCount, customerCount] = await Promise.all([
            Order.countDocuments(query),
            Customer.countDocuments(query)
        ])
        
        res.json({
            orders: orderCount,
            customers: customerCount,
            experienceYears: 12 // Hardcoded but could be from settings
        })
    } catch (err) {
        next(err)
    }
})

// Settings Management (admin only)
router.get('/settings', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        console.log('GET /admin/settings - Request received')
        console.log('Tenant ID:', tenantId)

        let settings
        if (tenantId) {
            settings = await Settings.findOne({ tenantId })
        } else {
            settings = await Settings.findOne({ tenantId: null }) || await Settings.findOne({ tenantId: { $exists: false } })
        }

        if (!settings) {
            settings = {
                restaurantName: 'Pizza Blast',
                email: 'contact@pizzablast.com',
                phone: '+1 (555) 123-4567',
                address: '123 Pizza Plaza, New York, NY 10001',
                currency: 'USD',
                timezone: 'America/New_York'
            }
        }

        console.log('Settings found:', settings)
        res.json(settings)
    } catch (err) {
        console.error('Failed to fetch settings:', err)
        res.status(500).json({ error: 'Failed to fetch settings' })
    }
})

router.post('/settings', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        console.log('POST /admin/settings - Request received')
        console.log('Tenant ID:', tenantId)
        console.log('Settings data:', req.body)

        const { restaurantName, email, phone, address, currency, timezone, atelierConfig } = req.body
        
        const settingsData = {
            ...(tenantId && { tenantId }),
            restaurantName,
            email,
            phone,
            address,
            currency,
            timezone,
            atelierConfig,
            updatedAt: new Date()
        }

        console.log('Settings data to save:', settingsData)

        let settings
        if (tenantId) {
            settings = await Settings.findOneAndUpdate(
                { tenantId },
                { $set: settingsData },
                { upsert: true, returnDocument: 'after' }
            )
            console.log('Settings saved to database:', settings)
        } else {
            settings = await Settings.findOneAndUpdate(
                { tenantId: null },
                { $set: settingsData },
                { upsert: true, returnDocument: 'after' }
            )
            console.log('Settings saved (global mode):', settings)
        }

        // Emit WebSocket event for real-time updates
        const io = req.app.get('io')
        if (io) {
            io.emit('settings_updated', settings)
            console.log('WebSocket event emitted: settings_updated')
        }

        console.log('Final settings response:', settings)
        res.json(settings)
    } catch (err) {
        console.error('Failed to save settings:', err)
        res.status(500).json({ error: 'Failed to save settings' })
    }
})

// Email Campaign Management
router.get('/email-campaigns', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        console.log('GET /admin/email-campaigns - Request received')

        let campaigns
        if (tenantId) {
            campaigns = await EmailCampaign.find({ tenantId }).sort({ createdAt: -1 })
        } else {
            // Return actual campaigns from database
            campaigns = await EmailCampaign.find({}).sort({ createdAt: -1 })
        }

        console.log(`Email campaigns found: ${campaigns.length} for tenant: ${tenantId || 'global'}`)
        res.json(campaigns)
    } catch (err) {
        console.error('Failed to fetch email campaigns:', err)
        res.status(500).json({ error: 'Failed to fetch email campaigns' })
    }
})

router.post('/email-campaigns', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const { name, subject, message, template, recipients, sendNow } = req.body
        console.log(`[CAMPAIGN] Attempting to create campaign: "${name}" for tenant: ${tenantId || 'global'}. Recipients: ${recipients?.length || 0}`)

        if (!name || !subject || !message) {
            console.warn('[CAMPAIGN] Validation failed: Missing name, subject, or message')
            return res.status(400).json({ error: 'Missing required campaign fields (name, subject, message)' })
        }

        const campaignData = {
            ...(tenantId && { tenantId }),
            name,
            subject,
            message,
            template: template || 'custom',
            recipients: recipients || [],
            status: sendNow ? 'sent' : 'draft',
            sentAt: sendNow ? new Date() : null,
            stats: { totalRecipients: recipients?.length || 0 }
        }

        const campaign = await EmailCampaign.create(campaignData)

        if (sendNow && recipients?.length > 0) {
            console.log(`Processing "Send Now" for campaign: ${name}`)
            const sendPromises = recipients.map(r => sendMarketingEmail(r.email, subject, message, r.name, template))

            const results = await Promise.allSettled(sendPromises)
            const delivered = results.filter(r => r.status === 'fulfilled').length
            const failed = results.filter(r => r.status === 'rejected')

            if (failed.length > 0) {
                console.error(`${failed.length} emails failed to send. First error:`, failed[0].reason)
            }
            console.log(`Campaign processing complete: ${delivered} delivered, ${failed.length} failed`)

            campaign.stats.delivered = delivered
            campaign.stats.sent = recipients.length
            campaign.status = 'sent'
            await campaign.save()
        }

        res.json(campaign)
    } catch (err) {
        console.error('CRITICAL [CAMPAIGN ERROR]:', err)
        res.status(500).json({ 
            error: 'Failed to process campaign', 
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        })
    }
})

router.get('/customers/list', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        console.log('GET /admin/customers/list - Request received')

        let customers
        if (tenantId) {
            customers = await Customer.find({ tenantId }).select('_id name email phone createdAt loyalty totalSpent')
        } else {
            // Return actual customers from the database, even without a tenant filter
            customers = await Customer.find({}).select('_id name email phone createdAt loyalty totalSpent')
        }

        console.log('Customers found:', customers.length)
        res.json(customers)
    } catch (err) {
        console.error('Failed to fetch customers:', err)
        res.status(500).json({ error: 'Failed to fetch customers' })
    }
})

// Promotional Banners Management
router.get('/promotional-banners', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        console.log('GET /admin/promotional-banners - Request received')

        const query = tenantId ? { tenantId } : {}
        const banners = await PromotionalBanner.find(query).sort({ priority: -1, createdAt: -1 })

        console.log('Promotional banners found:', banners.length)
        res.json(banners)
    } catch (err) {
        console.error('Failed to fetch promotional banners:', err)
        res.status(500).json({ error: 'Failed to fetch promotional banners' })
    }
})

router.post('/promotional-banners', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        console.log('POST /admin/promotional-banners - Request received')
        console.log('Banner data:', req.body)

        const {
            title,
            subtitle,
            description,
            imageUrl,
            backgroundColor,
            textColor,
            buttonText,
            buttonLink,
            position,
            size,
            startDate,
            endDate,
            priority,
            targetAudience
        } = req.body

        const bannerData = {
            ...(tenantId && { tenantId }),
            title,
            subtitle,
            description,
            imageUrl: imageUrl || '',
            backgroundColor: backgroundColor || '#FF6B6B',
            textColor: textColor || '#FFFFFF',
            buttonText,
            buttonLink,
            position: position || 'top',
            size: size || 'medium',
            startDate: startDate || new Date(),
            endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            priority: priority || 1,
            targetAudience: targetAudience || ['all'],
            status: 'active'
        }

        const banner = await PromotionalBanner.create(bannerData)

        console.log('Promotional banner created:', banner)
        emitPromotionalBannerUpdate(req, 'promotional_banner_created', banner)
        res.json(banner)
    } catch (err) {
        console.error('Failed to create promotional banner:', err)
        res.status(500).json({ error: 'Failed to create promotional banner' })
    }
})

router.put('/promotional-banners/:id', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const { id } = req.params
        console.log('PUT /admin/promotional-banners/:id - Request received')

        const updateData = {
            ...req.body,
            updatedAt: new Date()
        }

        const query = tenantId ? { _id: id, tenantId } : { _id: id }
        const banner = await PromotionalBanner.findOneAndUpdate(
            query,
            updateData,
            { new: true }
        )

        if (!banner) {
            return res.status(404).json({ error: 'Banner not found' })
        }

        console.log('Promotional banner updated:', banner)
        emitPromotionalBannerUpdate(req, 'promotional_banner_updated', banner)
        res.json(banner)
    } catch (err) {
        console.error('Failed to update promotional banner:', err)
        res.status(500).json({ error: 'Failed to update promotional banner' })
    }
})

router.delete('/promotional-banners/:id', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const { id } = req.params
        console.log('DELETE /admin/promotional-banners/:id - Request received')

        const query = tenantId ? { _id: id, tenantId } : { _id: id }
        const result = await PromotionalBanner.findOneAndDelete(query)

        if (!result) {
            return res.status(404).json({ error: 'Banner not found' })
        }

        console.log('Promotional banner deleted:', id)
        emitPromotionalBannerUpdate(req, 'promotional_banner_deleted', { _id: id })
        res.json({ message: 'Banner deleted successfully' })
    } catch (err) {
        console.error('Failed to delete promotional banner:', err)
        res.status(500).json({ error: 'Failed to delete promotional banner' })
    }
})

// Public API for active banners (no auth required)
router.get('/public/promotional-banners', async (req, res) => {
    try {
        const tenantId = req.tenantId
        console.log('GET /admin/public/promotional-banners - Request received')

        if (!isConnected) {
            return res.json([
                {
                    _id: 'b1',
                    title: 'Grand Opening (Mock)',
                    subtitle: '50% Off Your First Pizza',
                    description: 'Use code MOCK50 at checkout',
                    backgroundColor: '#C1440E',
                    textColor: '#FFFFFF',
                    buttonText: 'Order Now',
                    buttonLink: '/menu',
                    position: 'top',
                    isActive: true
                }
            ])
        }

        const baseQuery = tenantId ? { tenantId } : {}
        const banners = await PromotionalBanner.find({
            ...baseQuery,
            status: 'active',
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        }).sort({ priority: -1 })

        console.log('Active promotional banners found:', banners.length)
        res.json(banners)
    } catch (err) {
        console.error('Failed to fetch active promotional banners:', err)
        res.status(500).json({ error: 'Failed' })
    }
})

// Track banner click (public)
router.post('/promotional-banners/:id/click', async (req, res) => {
    try {
        const { id } = req.params
        // We don't necessarily need tenantId here if IDs are unique, 
        // but it's safer to include it if we can extract it.
        const banner = await PromotionalBanner.findByIdAndUpdate(
            id,
            { $inc: { clicks: 1 } },
            { new: true }
        )
        if (!banner) return res.status(404).json({ error: 'Banner not found' })
        res.json({ success: true, clicks: banner.clicks })
    } catch (err) {
        res.status(500).json({ error: 'Failed to track click' })
    }
})

// Catering Request Management
router.get('/catering', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        let query = {}
        if (tenantId) query.tenantId = tenantId

        const requests = await Catering.find(query)
            .sort({ eventDate: 1, createdAt: -1 })
        res.json(requests)
    } catch (err) {
        console.error('Failed to fetch catering requests:', err)
        res.status(500).json({ error: 'Failed to fetch catering requests' })
    }
})

router.patch('/catering/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const tenantId = req.tenantId
        const updateData = req.body

        const request = await Catering.findOneAndUpdate(
            { _id: id, ...(tenantId && { tenantId }) },
            updateData,
            { returnDocument: 'after' }
        )

        if (!request) return res.status(404).json({ error: 'Catering request not found' })

        // Send confirmation email if status changed to confirmed
        if (updateData.status === 'confirmed') {
            await sendCateringConfirmation(request)
        }

        res.json(request)
    } catch (err) {
        console.error('Failed to update catering request:', err)
        res.status(500).json({ error: 'Failed to update catering request' })
    }
})

router.delete('/catering/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const tenantId = req.tenantId

        const request = await Catering.findOneAndDelete({ _id: id, ...(tenantId && { tenantId }) })
        if (!request) return res.status(404).json({ error: 'Catering request not found' })

        res.json({ message: 'Catering request deleted successfully' })
    } catch (err) {
        console.error('Failed to delete catering request:', err)
        res.status(500).json({ error: 'Failed to delete catering request' })
    }
})

// Reservation Management
router.get('/reservations', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        let query = {}
        if (tenantId) query.tenantId = tenantId

        const reservations = await Reservation.find(query)
            .sort({ date: 1, createdAt: -1 })
        res.json(reservations)
    } catch (err) {
        console.error('Failed to fetch reservations:', err)
        res.status(500).json({ error: 'Failed to fetch reservations' })
    }
})

router.patch('/reservations/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const tenantId = req.tenantId
        const updateData = req.body

        const reservation = await Reservation.findOneAndUpdate(
            { _id: id, ...(tenantId && { tenantId }) },
            updateData,
            { returnDocument: 'after' }
        )

        if (!reservation) return res.status(404).json({ error: 'Reservation not found' })

        // Send confirmation email if status changed to confirmed
        if (updateData.status === 'confirmed') {
            await sendReservationConfirmation(reservation)
        }

        res.json(reservation)
    } catch (err) {
        console.error('Failed to update reservation:', err)
        res.status(500).json({ error: 'Failed to update reservation' })
    }
})

router.delete('/reservations/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const tenantId = req.tenantId

        const reservation = await Reservation.findOneAndDelete({ _id: id, ...(tenantId && { tenantId }) })
        if (!reservation) return res.status(404).json({ error: 'Reservation not found' })

        res.json({ message: 'Reservation deleted successfully' })
    } catch (err) {
        console.error('Failed to delete reservation:', err)
        res.status(500).json({ error: 'Failed to delete reservation' })
    }
})

// Loyalty Configuration CRUD
router.get('/loyalty-config', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const query = tenantId ? { tenantId } : { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] }
        let config = await LoyaltyConfig.findOne(query)
        
        if (!config) {
            config = new LoyaltyConfig({ tenantId: tenantId || undefined })
            await config.save()
        }
        
        res.json(config)
    } catch (err) {
        console.error('Failed to fetch loyalty config:', err)
        res.status(500).json({ error: 'Failed to fetch loyalty config' })
    }
})

router.post('/loyalty-config', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const updateData = req.body
        
        const query = tenantId ? { tenantId } : { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] }
        const config = await LoyaltyConfig.findOneAndUpdate(
            query,
            { ...updateData, updatedAt: new Date() },
            { upsert: true, new: true, runValidators: true }
        )
        
        res.json(config)
    } catch (err) {
        console.error('Failed to update loyalty config:', err)
        res.status(500).json({ error: 'Failed to update loyalty config' })
    }
})

router.post('/loyalty-config/rewards', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const rewardData = req.body
        
        const query = tenantId ? { tenantId } : { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] }
        const config = await LoyaltyConfig.findOne(query)
        
        if (!config) return res.status(404).json({ error: 'Loyalty config not found' })
        
        config.rewards.push(rewardData)
        await config.save()
        
        res.json(config)
    } catch (err) {
        res.status(500).json({ error: 'Failed to add reward' })
    }
})

router.delete('/loyalty-config/rewards/:rewardId', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        const { rewardId } = req.params
        
        const query = tenantId ? { tenantId } : { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] }
        const config = await LoyaltyConfig.findOne(query)
        
        if (!config) return res.status(404).json({ error: 'Loyalty config not found' })
        
        config.rewards = config.rewards.filter(r => r._id.toString() !== rewardId)
        await config.save()
        
        res.json(config)
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete reward' })
    }
})

export default router
