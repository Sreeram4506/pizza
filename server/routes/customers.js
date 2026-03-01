import { Router } from 'express'
import { Customer } from '../models/Customer.js'
import { Order } from '../models/Order.js'
import { Loyalty, LoyaltyConfig } from '../models/Loyalty.js'

const router = Router()

// Get all customers
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { search, limit = 50, page = 1 } = req.query
    
    let query = { tenantId }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
    
    res.json(customers)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const customer = await Customer.findOne({ _id: req.params.id, tenantId })
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }
    
    // Get order history
    const orders = await Order.find({ tenantId, 'customerInfo.phone': customer.phone })
      .sort({ createdAt: -1 })
      .limit(10)
    
    res.json({ customer, orders })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer' })
  }
})

// Create or update customer
router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { name, email, phone, address, marketingConsent } = req.body
    
    // Check if customer exists
    let customer = await Customer.findOne({ tenantId, phone })
    
    if (customer) {
      // Update existing
      customer.name = name || customer.name
      customer.email = email || customer.email
      customer.address = address || customer.address
      if (marketingConsent !== undefined) customer.marketingConsent = marketingConsent
      await customer.save()
    } else {
      // Create new
      customer = new Customer({
        tenantId,
        name,
        email,
        phone,
        address,
        marketingConsent
      })
      await customer.save()
      
      // Check if loyalty is enabled and add welcome bonus
      const loyaltyConfig = await LoyaltyConfig.findOne({ tenantId })
      if (loyaltyConfig?.enabled && loyaltyConfig.welcomeBonus > 0) {
        const loyalty = new Loyalty({
          tenantId,
          customerId: customer._id,
          points: loyaltyConfig.welcomeBonus,
          lifetimePoints: loyaltyConfig.welcomeBonus,
          transactions: [{
            type: 'bonus',
            points: loyaltyConfig.welcomeBonus,
            description: 'Welcome bonus'
          }]
        })
        await loyalty.save()
        
        // Update customer loyalty
        customer.loyalty.points = loyaltyConfig.welcomeBonus
        customer.loyalty.lifetimePoints = loyaltyConfig.welcomeBonus
        await customer.save()
      }
    }
    
    res.json(customer)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer' })
  }
})

// Award loyalty points
router.post('/:id/award-points', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { points, reason } = req.body
    
    const customer = await Customer.findOne({ _id: req.params.id, tenantId })
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }
    
    // Update customer loyalty
    customer.loyalty.points += points
    customer.loyalty.lifetimePoints += points
    await customer.save()
    
    // Update loyalty record
    let loyalty = await Loyalty.findOne({ tenantId, customerId: customer._id })
    if (!loyalty) {
      loyalty = new Loyalty({ tenantId, customerId: customer._id })
    }
    loyalty.points += points
    loyalty.lifetimePoints += points
    loyalty.transactions.push({
      type: 'bonus',
      points,
      description: reason || 'Manual award'
    })
    await loyalty.save()
    
    res.json({ customer, loyalty })
  } catch (err) {
    res.status(500).json({ error: 'Failed to award points' })
  }
})

// Get loyalty config
router.get('/loyalty/config', async (req, res) => {
  try {
    const tenantId = req.tenantId
    let config = await LoyaltyConfig.findOne({ tenantId })
    
    if (!config) {
      // Create default config
      config = new LoyaltyConfig({
        tenantId,
        enabled: true,
        pointsPerDollar: 1,
        welcomeBonus: 50,
        tiers: {
          bronze: { minPoints: 0, multiplier: 1 },
          silver: { minPoints: 500, multiplier: 1.25 },
          gold: { minPoints: 1000, multiplier: 1.5 },
          platinum: { minPoints: 2500, multiplier: 2 }
        },
        rewards: []
      })
      await config.save()
    }
    
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch loyalty config' })
  }
})

// Update loyalty config
router.put('/loyalty/config', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const config = await LoyaltyConfig.findOneAndUpdate(
      { tenantId },
      req.body,
      { new: true, upsert: true }
    )
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update loyalty config' })
  }
})

// Create loyalty reward
router.post('/loyalty/rewards', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const config = await LoyaltyConfig.findOne({ tenantId })
    
    if (!config) {
      return res.status(404).json({ error: 'Loyalty config not found' })
    }
    
    config.rewards.push(req.body)
    await config.save()
    
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create reward' })
  }
})

// Redeem reward
router.post('/:id/redeem', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { rewardId } = req.body
    
    const customer = await Customer.findOne({ _id: req.params.id, tenantId })
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }
    
    const config = await LoyaltyConfig.findOne({ tenantId })
    const reward = config.rewards.id(rewardId)
    
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' })
    }
    
    if (customer.loyalty.points < reward.pointsCost) {
      return res.status(400).json({ error: 'Insufficient points' })
    }
    
    // Deduct points
    customer.loyalty.points -= reward.pointsCost
    await customer.save()
    
    // Add to customer's rewards
    let loyalty = await Loyalty.findOne({ tenantId, customerId: customer._id })
    if (!loyalty) {
      loyalty = new Loyalty({ tenantId, customerId: customer._id })
    }
    
    loyalty.points -= reward.pointsCost
    loyalty.transactions.push({
      type: 'redeemed',
      points: -reward.pointsCost,
      rewardId: reward._id,
      description: `Redeemed: ${reward.name}`
    })
    loyalty.rewards.push({
      rewardId: reward._id,
      name: reward.name,
      redeemed: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    })
    await loyalty.save()
    
    res.json({ customer, loyalty, reward })
  } catch (err) {
    res.status(500).json({ error: 'Failed to redeem reward' })
  }
})

export default router
