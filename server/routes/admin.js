import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Order } from '../models/Order.js'
import { Customer } from '../models/Customer.js'
import { MenuCategory } from '../models/MenuCategory.js'
import { MenuItem } from '../models/MenuItem.js'
import { Settings } from '../models/Settings.js'
import { EmailCampaign } from '../models/EmailCampaign.js'
import { PromotionalBanner } from '../models/PromotionalBanner.js'
import { config } from '../config.js'
import { sendMarketingEmail } from '../utils/email.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// Configure multer for image uploads
const storage = multer.diskStorage({
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
const ADMIN_PASS_HASH = () => bcrypt.hashSync(config.adminPassword, 10)
// Removed static JWT_SECRET constant to use config.JWT_SECRET directly

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
    const { username, password } = req.body

    if (username === ADMIN_USER() && bcrypt.compareSync(password, ADMIN_PASS_HASH())) {
        const token = jwt.sign({ role: 'admin' }, config.JWT_SECRET, { expiresIn: '1d' })
        return res.json({ token })
    }

    res.status(401).json({ error: 'Invalid credentials' })
})

// Middleware to verify Admin JWT
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
        console.log('verifyAdmin: No token provided');
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET)
        req.user = decoded
        next()
    } catch (err) {
        console.error('verifyAdmin: Token verification failed:', err.message);
        res.status(401).json({ error: 'Invalid token' })
    }
}

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
            .sort({ createdAt: -1 })
            .limit(50)
        res.json(orders)
    } catch (err) {
        console.error('Failed to fetch orders:', err)
        res.status(500).json({ error: 'Failed to fetch orders' })
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
            .select('name email phone createdAt orderCount')
            .sort({ createdAt: -1 })
            .limit(50)
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

        // Total orders and revenue
        const totalOrders = await Order.countDocuments(query)
        const allOrders = await Order.find({ ...query, status: { $nin: ['cancelled'] } })
        const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0)

        // Today's orders
        const todayOrdersQuery = { ...query, createdAt: { $gte: today }, status: { $nin: ['cancelled'] } }
        const todayOrders = await Order.find(todayOrdersQuery)
        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0)

        // Pending orders
        const pendingOrders = await Order.countDocuments({ ...query, status: 'confirmed' })

        // Active customers (customers with orders)
        const activeCustomers = await Customer.countDocuments({ ...query, orderCount: { $gt: 0 } })

        // Average order value
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Popular items
        const itemCounts = {}
        allOrders.forEach(order => {
            order.items.forEach(item => {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
            })
        })

        const popularItems = Object.entries(itemCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        // Recent orders
        const recentOrders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(10)

        res.json({
            totalRevenue,
            totalOrders,
            todayOrders: todayOrders.length,
            todayRevenue,
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
        const tenantId = req.tenantId || 'default'
        let target = emails

        if (!target || target.length === 0) {
            const customers = await Customer.find({ tenantId })
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
            { new: true }
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
        const { name, description, price, categoryId, available, modifiers, tags, dietary } = req.body

        // Build item data
        const itemData = {
            ...(tenantId && { tenantId }),
            name,
            description: description || '',
            price: parseFloat(price),
            categoryId,
            available: available !== false,
            modifiers: modifiers ? JSON.parse(modifiers) : [],
            tags: tags ? JSON.parse(tags) : [],
            dietary: dietary ? JSON.parse(dietary) : {}
        }

        // Add image path if uploaded
        if (req.file) {
            itemData.image = `/uploads/menu/${req.file.filename}`
            console.log('Image saved:', itemData.image)
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
        const { name, description, price, categoryId, available, modifiers, tags, dietary } = req.body

        // Build update data
        const updateData = {
            name,
            description: description || '',
            price: parseFloat(price),
            categoryId,
            available: available !== false,
            modifiers: modifiers ? JSON.parse(modifiers) : [],
            tags: tags ? JSON.parse(tags) : [],
            dietary: dietary ? JSON.parse(dietary) : {}
        }

        // Add image path if new image uploaded
        if (req.file) {
            updateData.image = `/uploads/menu/${req.file.filename}`
        }

        const item = await MenuItem.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
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
router.get('/public/settings', async (req, res) => {
    try {
        const tenantId = req.tenantId
        console.log('GET /admin/public/settings - Request received')
        console.log('Tenant ID:', tenantId)

        let settings
        if (tenantId) {
            settings = await Settings.findOne({ tenantId })
        } else {
            // For localhost development, return default settings
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
        console.error('Failed to fetch public settings:', err)
        res.status(500).json({ error: 'Failed to fetch settings' })
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
            // For localhost development, return default settings
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

        const { restaurantName, email, phone, address, currency, timezone } = req.body

        const settingsData = {
            ...(tenantId && { tenantId }),
            restaurantName,
            email,
            phone,
            address,
            currency,
            timezone,
            updatedAt: new Date()
        }

        console.log('Settings data to save:', settingsData)

        let settings
        if (tenantId) {
            settings = await Settings.findOneAndUpdate(
                { tenantId },
                { $set: settingsData },
                { upsert: true, new: true }
            )
            console.log('Settings saved to database:', settings)
        } else {
            // For localhost development, just return success
            settings = settingsData
            console.log('Settings saved (localhost mode):', settings)
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
            // Return real campaigns from database (no tenant filter)
            campaigns = await EmailCampaign.find({}).sort({ createdAt: -1 })
        }

        console.log('Email campaigns found:', campaigns.length)
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
            const sendPromises = recipients.map(r => sendMarketingEmail(r.email, subject, message, r.name))
            // We fire and forget or at least don't block the initial response
            Promise.allSettled(sendPromises).then(results => {
                const delivered = results.filter(r => r.status === 'fulfilled').length
                const failed = results.filter(r => r.status === 'rejected')
                if (failed.length > 0) {
                    console.error(`${failed.length} emails failed to send. First error:`, failed[0].reason)
                }
                console.log(`Campaign processing complete: ${delivered} delivered, ${failed.length} failed`)
                EmailCampaign.findByIdAndUpdate(campaign._id, {
                    'stats.delivered': delivered,
                    'stats.sent': recipients.length
                }).exec().catch(err => console.error('Background update fail:', err))
            })
        }

        res.json(campaign)
    } catch (err) {
        console.error('Failed to create/send campaign:', err)
        res.status(500).json({ error: 'Failed to process campaign' })
    }
})

router.get('/customers/list', verifyAdmin, async (req, res) => {
    try {
        const tenantId = req.tenantId
        console.log('GET /admin/customers/list - Request received')

        let customers
        if (tenantId) {
            customers = await Customer.find({ tenantId }).select('_id name email phone createdAt')
        } else {
            // Return actual customers from the database, even without a tenant filter
            customers = await Customer.find({}).select('_id name email phone createdAt')
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

        let banners
        if (tenantId) {
            banners = await PromotionalBanner.find({ tenantId }).sort({ priority: -1, createdAt: -1 })
        } else {
            // For localhost development, return mock banners
            banners = [
                {
                    _id: 'mock1',
                    title: 'Weekend Special',
                    subtitle: '50% Off All Pizzas',
                    description: 'Get 50% off on all pizzas this weekend only!',
                    imageUrl: '',
                    backgroundColor: '#FF6B6B',
                    textColor: '#FFFFFF',
                    buttonText: 'Order Now',
                    buttonLink: '/menu',
                    position: 'top',
                    size: 'large',
                    status: 'active',
                    startDate: new Date('2024-01-15'),
                    endDate: new Date('2024-01-17'),
                    priority: 5,
                    targetAudience: ['all'],
                    clicks: 45,
                    impressions: 1250,
                    isActive: true,
                    createdAt: new Date('2024-01-15')
                },
                {
                    _id: 'mock2',
                    title: 'New Menu Item',
                    subtitle: 'Try Our BBQ Chicken Pizza',
                    description: 'Smoky BBQ chicken with fresh vegetables',
                    imageUrl: '',
                    backgroundColor: '#4ECDC4',
                    textColor: '#FFFFFF',
                    buttonText: 'Learn More',
                    buttonLink: '/menu',
                    position: 'middle',
                    size: 'medium',
                    status: 'active',
                    startDate: new Date('2024-01-20'),
                    endDate: new Date('2024-02-20'),
                    priority: 3,
                    targetAudience: ['all'],
                    clicks: 23,
                    impressions: 890,
                    isActive: true,
                    createdAt: new Date('2024-01-20')
                }
            ]
        }

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

        let banner
        if (tenantId) {
            banner = await PromotionalBanner.create(bannerData)
        } else {
            // For localhost development, create mock banner
            banner = {
                _id: 'mock_' + Date.now(),
                ...bannerData,
                clicks: 0,
                impressions: 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        }

        console.log('Promotional banner created:', banner)
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

        let banner
        if (tenantId) {
            banner = await PromotionalBanner.findOneAndUpdate(
                { _id: id, tenantId },
                updateData,
                { new: true }
            )
        } else {
            // For localhost development, just return success
            banner = { _id: id, ...updateData }
        }

        if (!banner) {
            return res.status(404).json({ error: 'Banner not found' })
        }

        console.log('Promotional banner updated:', banner)
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

        let result
        if (tenantId) {
            result = await PromotionalBanner.findOneAndDelete({ _id: id, tenantId })
        } else {
            // For localhost development, just return success
            result = { _id: id }
        }

        if (!result) {
            return res.status(404).json({ error: 'Banner not found' })
        }

        console.log('Promotional banner deleted:', id)
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

        let banners
        if (tenantId) {
            banners = await PromotionalBanner.find({
                tenantId,
                status: 'active',
                isActive: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            }).sort({ priority: -1 })
        } else {
            // For localhost development, return mock active banners
            banners = [
                {
                    _id: 'mock1',
                    title: 'Weekend Special',
                    subtitle: '50% Off All Pizzas',
                    description: 'Get 50% off on all pizzas this weekend only!',
                    imageUrl: '',
                    backgroundColor: '#FF6B6B',
                    textColor: '#FFFFFF',
                    buttonText: 'Order Now',
                    buttonLink: '/menu',
                    position: 'middle',
                    size: 'large',
                    priority: 5
                }
            ]
        }

        console.log('Active promotional banners found:', banners.length)
        res.json(banners)
    } catch (err) {
        console.error('Failed to fetch active promotional banners:', err)
        res.status(500).json({ error: 'Failed to fetch active promotional banners' })
    }
})

export default router
