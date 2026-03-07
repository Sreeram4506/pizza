import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { MenuCategory } from '../models/MenuCategory.js'
import { MenuItem } from '../models/MenuItem.js'
import { verifyAdmin } from '../middleware/auth.js'

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

// Helper function to emit menu updates
const emitMenuUpdate = (req, event, data) => {
  const io = req.app.get('io')
  if (io) {
    io.emit(event, data)
    console.log(`Menu update emitted: ${event}`, data.message || '')
  }
}

// Menu routes

// Get all categories for a tenant
router.get('/categories', async (req, res) => {
  try {
    console.log('GET /api/menu/categories - Request received')
    const tenantId = req.tenantId
    console.log('Tenant ID:', tenantId)

    // For localhost development, get all categories without tenant filter
    let query = {}
    if (tenantId) {
      query.tenantId = tenantId
    }
    query.isActive = true

    const categories = await MenuCategory.find(query)
      .sort({ sortOrder: 1, createdAt: 1 })

    console.log('Categories found:', categories.length, categories)
    res.json(categories)
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Create category
router.post('/categories', verifyAdmin, async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { name, description, sortOrder } = req.body

    const category = new MenuCategory({
      tenantId,
      name,
      description: description || '',
      sortOrder: sortOrder || 0
    })

    await category.save()
    res.status(201).json(category)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// Update category
router.put('/categories/:id', verifyAdmin, async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { name, description, sortOrder, isActive } = req.body

    const category = await MenuCategory.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { name, description, sortOrder, isActive },
      { new: true }
    )

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.json(category)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' })
  }
})

// Delete category
router.delete('/categories/:id', verifyAdmin, async (req, res) => {
  try {
    const tenantId = req.tenantId

    const category = await MenuCategory.findOneAndDelete({
      _id: req.params.id,
      tenantId
    })

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.json({ message: 'Category deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// Get all menu items
router.get('/items', async (req, res) => {
  try {
    console.log('GET /api/menu/items - Request received')
    const tenantId = req.tenantId
    console.log('Tenant ID:', tenantId)

    // For localhost development, get all items without tenant filter
    let query = {}
    if (tenantId) {
      query.tenantId = tenantId
    }
    query.isActive = true

    const items = await MenuItem.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })

    console.log('Menu items found:', items.length, items)
    res.json(items)
  } catch (err) {
    console.error('Failed to fetch items:', err)
    res.status(500).json({ error: 'Failed to fetch items' })
  }
})

// Get items by category
router.get('/items/category/:categoryId', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const items = await MenuItem.find({
      tenantId,
      categoryId: req.params.categoryId,
      available: true,
      isActive: true
    }).sort({ sortOrder: 1 })
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' })
  }
})

// Create menu item with optional image upload
router.post('/items', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { name, description, price, categoryId, available, modifiers, tags, dietary } = req.body

    // Build item data
    const itemData = {
      tenantId,
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
    }

    const item = new MenuItem(itemData)
    await item.save()

    // Populate category for response
    await item.populate('categoryId', 'name')

    // Emit WebSocket event
    emitMenuUpdate(req, 'item_added', {
      type: 'item_added',
      item: item,
      message: `New item "${name}" added to menu`
    })

    res.status(201).json(item)
  } catch (err) {
    console.error('Failed to create menu item:', err)
    res.status(500).json({ error: 'Failed to create item', details: err.message })
  }
})

// Update menu item with optional image upload
router.put('/items/:id', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const tenantId = req.tenantId
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

    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      updateData,
      { new: true }
    ).populate('categoryId', 'name')

    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    // Emit WebSocket event
    emitMenuUpdate(req, 'item_updated', {
      type: 'item_updated',
      item: item,
      message: `Item "${name}" updated`
    })

    res.json(item)
  } catch (err) {
    console.error('Failed to update menu item:', err)
    res.status(500).json({ error: 'Failed to update item', details: err.message })
  }
})

// Delete menu item
router.delete('/items/:id', verifyAdmin, async (req, res) => {
  try {
    const tenantId = req.tenantId

    const item = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      tenantId
    })

    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    // Emit WebSocket event
    emitMenuUpdate(req, 'item_removed', {
      type: 'item_removed',
      itemId: item._id,
      itemName: item.name,
      message: `Item "${item.name}" removed from menu`
    })

    res.json({ message: 'Item deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' })
  }
})

// Toggle item availability
router.patch('/items/:id/availability', verifyAdmin, async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { available } = req.body

    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { available },
      { new: true }
    ).populate('categoryId', 'name')

    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    // Emit WebSocket event
    emitMenuUpdate(req, 'item_updated', {
      type: 'item_updated',
      item: item,
      message: `Item "${item.name}" is now ${available ? 'available' : 'unavailable'}`
    })

    res.json(item)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update availability' })
  }
})

export default router
