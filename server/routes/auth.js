import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Customer } from '../models/Customer.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'pizza-blast-secret-2024'

// Register customer
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    // For localhost development, skip tenant requirement
    const tenantId = req.tenantId
    const key = email.toLowerCase()

    // Check if user already exists (only if tenant exists)
    let existingUser = null
    if (tenantId) {
      existingUser = await Customer.findOne({ tenantId, email: key })
      if (existingUser) return res.status(409).json({ error: 'User already exists' })
    } else {
      // For localhost, check without tenant
      existingUser = await Customer.findOne({ email: key })
      if (existingUser) return res.status(409).json({ error: 'User already exists' })
    }

    const hash = bcrypt.hashSync(password, 10)
    const customer = new Customer({
      tenantId: tenantId || undefined, // Don't set tenantId for localhost
      name: name || 'Unknown User',
      email: key,
      phone: phone || '0000000000',
      passwordHash: hash
    })

    await customer.save()

    const token = jwt.sign({
      role: 'customer',
      email: key,
      id: customer._id,
      customerId: customer._id
    }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    })
  } catch (err) {
    console.error('Registration error:', err)
    res.status(500).json({ error: 'Failed to register user' })
  }
})

// Customer login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    // For localhost development, skip tenant requirement
    const tenantId = req.tenantId
    const key = email.toLowerCase()

    // Find customer (with or without tenant)
    let customer = null
    if (tenantId) {
      customer = await Customer.findOne({ tenantId, email: key })
    } else {
      customer = await Customer.findOne({ email: key })
    }

    if (!customer) return res.status(404).json({ error: 'User not found' })

    if (!bcrypt.compareSync(password, customer.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({
      role: 'customer',
      email: key,
      id: customer._id,
      customerId: customer._id
    }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Failed to login' })
  }
})

// Customer authentication middleware
export const authenticateCustomer = async (req, res, next) => {
  console.log('=== AUTHENTICATION MIDDLEWARE CALLED ===')
  try {
    console.log('Auth middleware - Request headers:', req.headers.authorization)
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      console.log('No token provided - continuing as guest')
      req.user = null
      return next()
    }

    console.log('Token found, verifying...')
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('Token decoded:', decoded)

    if (decoded.role !== 'customer') {
      console.log('Not a customer token - continuing as guest')
      req.user = null
      return next()
    }

    // Find the customer
    const tenantId = req.tenantId
    let customer = null

    if (tenantId) {
      customer = await Customer.findOne({ tenantId, _id: decoded.customerId })
    } else {
      customer = await Customer.findOne({ _id: decoded.customerId })
    }

    if (!customer) {
      console.log('Customer not found - continuing as guest')
      req.user = null
      return next()
    }

    req.user = {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      isGuest: false
    }

    console.log('Authentication successful - user:', req.user)
    next()
  } catch (err) {
    console.log('Authentication error:', err.message)
    // Invalid token - continue as guest
    req.user = null
    next()
  }
}

// Simple rate limiting store (in production, use Redis)
const rateLimitStore = new Map()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 5 // Max 5 attempts per window

const checkRateLimit = (key) => {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, [])
  }

  const requests = rateLimitStore.get(key)
  // Remove old requests
  const validRequests = requests.filter(time => time > windowStart)
  rateLimitStore.set(key, validRequests)

  return validRequests.length < MAX_REQUESTS
}

const addRateLimitAttempt = (key) => {
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, [])
  }
  rateLimitStore.get(key).push(Date.now())
}

// Quick Auth endpoint - combines login and register
router.post('/quick-auth', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    // Input validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and a number' })
    }

    // Rate limiting based on email
    const rateLimitKey = `quick-auth:${email.toLowerCase()}`
    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' })
    }
    addRateLimitAttempt(rateLimitKey)

    const tenantId = req.tenantId
    const key = email.toLowerCase()

    // Sanitize inputs
    const sanitizedName = name.trim().replace(/[<>]/g, '').substring(0, 100)
    const sanitizedPhone = phone ? phone.trim().replace(/[<>]/g, '').substring(0, 20) : '0000000000'

    // Find existing customer
    let customer = null
    if (tenantId) {
      customer = await Customer.findOne({ tenantId, email: key })
    } else {
      customer = await Customer.findOne({ email: key })
    }

    if (customer) {
      // Existing user - verify password
      if (!bcrypt.compareSync(password, customer.passwordHash)) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Generate token
      const token = jwt.sign({
        role: 'customer',
        email: key,
        id: customer._id,
        customerId: customer._id
      }, JWT_SECRET, { expiresIn: '7d' })

      return res.json({
        token,
        user: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        isNewUser: false
      })
    } else {
      // New user - register
      const hash = bcrypt.hashSync(password, 10)
      const newCustomer = new Customer({
        tenantId: tenantId || undefined,
        name: sanitizedName,
        email: key,
        phone: sanitizedPhone,
        passwordHash: hash
      })

      await newCustomer.save()

      // Generate token
      const token = jwt.sign({
        role: 'customer',
        email: key,
        id: newCustomer._id,
        customerId: newCustomer._id
      }, JWT_SECRET, { expiresIn: '7d' })

      return res.json({
        token,
        user: {
          id: newCustomer._id,
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone
        },
        isNewUser: true
      })
    }
  } catch (err) {
    console.error('Quick auth error:', err)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

// Get current logged-in user profile
router.get('/me', authenticateCustomer, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' })

    // Find customer to get full data including loyalty
    const customer = await Customer.findById(req.user.id)
    if (!customer) return res.status(404).json({ error: 'Profile not found' })

    // Fetch recent orders
    const orders = await Order.find({ 'customerInfo.email': customer.email })
      .sort({ createdAt: -1 })
      .limit(5)

    res.json({
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        loyalty: customer.loyalty || { points: 0, lifetimePoints: 0, tier: 'bronze' }
      },
      orders
    })
  } catch (err) {
    console.error('Profile fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

export default router
