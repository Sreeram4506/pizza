import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Customer } from '../models/Customer.js'
import { User } from '../models/User.js'
import { Order } from '../models/Order.js'
import { LoyaltyConfig } from '../models/Loyalty.js'
import { OTP } from '../models/OTP.js'
import { config } from '../config.js'
import { sendEmail } from '../utils/email.js'
import crypto from 'crypto'

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

// Unified login (Customer + Admin/Staff)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const key = email.toLowerCase()
    const tenantId = req.tenantId

    // 1. Try to find the user in Customer model
    let customer = await Customer.findOne(tenantId ? { tenantId, email: key } : { email: key })

    if (customer) {
      if (!bcrypt.compareSync(password, customer.passwordHash)) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = jwt.sign({
        role: 'customer',
        email: key,
        id: customer._id,
        customerId: customer._id
      }, JWT_SECRET, { expiresIn: '7d' })

      return res.json({
        token,
        role: 'customer',
        user: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        }
      })
    }

    // 2. Try to find the user in User model (Staff/Admins stored in DB)
    let staff = await User.findOne(tenantId ? { tenantId, email: key } : { email: key })
    if (staff) {
      if (!bcrypt.compareSync(password, staff.passwordHash)) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = jwt.sign({
        role: staff.role || 'staff',
        email: key,
        id: staff._id
      }, JWT_SECRET, { expiresIn: '1d' })

      return res.json({
        token,
        role: staff.role || 'staff',
        user: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role
        }
      })
    }

    // 3. Fallback to global admin from config
    if (key === config.adminUsername.toLowerCase() && password === config.adminPassword) {
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' })
      return res.json({
        token,
        role: 'admin',
        user: {
          name: 'Global Admin',
          email: key,
          role: 'admin'
        }
      })
    }

    res.status(401).json({ error: 'Invalid credentials' })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Failed to login' })
  }
})

// Forgot Password - Step 1: Request OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const key = email.toLowerCase()
    
    // Check if user exists (Customer or User)
    const customer = await Customer.findOne({ email: key })
    const staff = await User.findOne({ email: key })
    
    if (!customer && !staff) {
      // For security, don't reveal if email exists, but we need to stop here
      return res.json({ message: 'If an account exists with this email, an OTP has been sent.' })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60000) // 10 minutes

    // Save/Update OTP in DB
    await OTP.findOneAndUpdate(
      { email: key },
      { otp, expiresAt },
      { upsert: true }
    )

    // Send email
    await sendEmail(
      key,
      'Your Password Reset OTP - Pizza Blast',
      `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Your one-time password (OTP) is:</p>
        <h1 style="color: #dc2626; font-size: 40px; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      </div>`
    )

    res.json({ message: 'OTP sent to your email.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'Failed to process request' })
  }
})

// Forgot Password - Step 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' })

    const key = email.toLowerCase()
    const record = await OTP.findOne({ email: key, otp })

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' })
    }

    // Generate a temporary reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    record.token = resetToken
    await record.save()

    res.json({ resetToken })
  } catch (err) {
    console.error('Verify OTP error:', err)
    res.status(500).json({ error: 'Failed to verify OTP' })
  }
})

// Forgot Password - Step 3: Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'Email, reset token, and new password are required' })
    }

    const key = email.toLowerCase()
    const record = await OTP.findOne({ email: key, token: resetToken })

    if (!record) {
      return res.status(400).json({ error: 'Invalid reset token' })
    }

    const hash = bcrypt.hashSync(newPassword, 10)

    // Update password in Customer or User model
    const customer = await Customer.findOneAndUpdate({ email: key }, { passwordHash: hash })
    const staff = await User.findOneAndUpdate({ email: key }, { passwordHash: hash })

    if (!customer && !staff) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Clean up OTP record
    await OTP.deleteOne({ email: key })

    res.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'Failed to reset password' })
  }
})

// Customer authentication middleware
export const authenticateCustomer = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      req.user = null
      return next()
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    if (decoded.role !== 'customer') {
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

    next()
  } catch (err) {
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

    // Fetch available rewards
    const tenantId = req.tenantId
    const query = tenantId ? { tenantId } : { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] }
    const config = await LoyaltyConfig.findOne(query)
    const availableRewards = config ? config.rewards : []

    res.json({
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        loyalty: customer.loyalty || { points: 0, lifetimePoints: 0, tier: 'bronze' }
      },
      orders,
      availableRewards: config ? config.rewards : [],
      loyaltyConfig: config
    })
  } catch (err) {
    console.error('Profile fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

export default router
