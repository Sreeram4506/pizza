import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { Customer } from '../models/Customer.js'
import { Order } from '../models/Order.js'

let mongoServer

// Setup test database
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
})

// Cleanup test database
afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

// Clear collections before each test
beforeEach(async () => {
  await Customer.deleteMany({})
  await Order.deleteMany({})
})

describe('Customer Model', () => {
  describe('Customer Creation', () => {
    test('should create a new customer with required fields', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1-555-0123'
      }

      const customer = await Customer.create(customerData)

      expect(customer.name).toBe('John Doe')
      expect(customer.email).toBe('john@example.com')
      expect(customer.phone).toBe('+1-555-0123')
      expect(customer.password).toBeDefined()
      expect(customer.isActive).toBe(true)
      expect(customer.createdAt).toBeDefined()
      expect(customer.updatedAt).toBeDefined()
    })

    test('should require name', async () => {
      const customerData = {
        email: 'john@example.com',
        password: 'password123',
        phone: '+1-555-0123'
      }

      await expect(Customer.create(customerData)).rejects.toThrow()
    })

    test('should require email', async () => {
      const customerData = {
        name: 'John Doe',
        password: 'password123',
        phone: '+1-555-0123'
      }

      await expect(Customer.create(customerData)).rejects.toThrow()
    })

    test('should require password', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123'
      }

      await expect(Customer.create(customerData)).rejects.toThrow()
    })

    test('should validate email format', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        phone: '+1-555-0123'
      }

      await expect(Customer.create(customerData)).rejects.toThrow()
    })

    test('should prevent duplicate emails', async () => {
      await Customer.create({
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
        phone: '+1-555-0123'
      })

      const duplicateData = {
        name: 'Second User',
        email: 'duplicate@example.com',
        password: 'password456',
        phone: '+1-555-0456'
      }

      await expect(Customer.create(duplicateData)).rejects.toThrow()
    })

    test('should set default values', async () => {
      const customerData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        phone: '+1-555-0456'
      }

      const customer = await Customer.create(customerData)
      expect(customer.isActive).toBe(true)
      expect(customer.orderCount).toBe(0)
      expect(customer.totalSpent).toBe(0)
      expect(customer.loyalty.points).toBe(0)
      expect(customer.loyalty.lifetimePoints).toBe(0)
      expect(customer.loyalty.tier).toBe('bronze')
    })
  })

  describe('Customer Password', () => {
    test('should hash password before saving', async () => {
      const customerData = {
        name: 'Password User',
        email: 'password@example.com',
        password: 'plaintext123',
        phone: '+1-555-0789'
      }

      const customer = await Customer.create(customerData)
      expect(customer.password).not.toBe('plaintext123')
      expect(customer.password).toMatch(/^\$2[aby]\$\d+\$/) // bcrypt hash pattern
    })

    test('should compare password correctly', async () => {
      const customer = await Customer.create({
        name: 'Compare User',
        email: 'compare@example.com',
        password: 'correctpassword',
        phone: '+1-555-0999'
      })

      const isMatch = await bcrypt.compare('correctpassword', customer.password)
      expect(isMatch).toBe(true)

      const isWrongMatch = await bcrypt.compare('wrongpassword', customer.password)
      expect(isWrongMatch).toBe(false)
    })

    test('should not rehash password on update if unchanged', async () => {
      const customer = await Customer.create({
        name: 'Hash User',
        email: 'hash@example.com',
        password: 'password123',
        phone: '+1-555-0111'
      })

      const originalHash = customer.password
      
      customer.name = 'Updated Name'
      await customer.save()

      expect(customer.password).toBe(originalHash)
    })
  })

  describe('Customer Loyalty', () => {
    test('should initialize loyalty with default values', async () => {
      const customer = await Customer.create({
        name: 'Loyalty User',
        email: 'loyalty@example.com',
        password: 'password123',
        phone: '+1-555-0222'
      })

      expect(customer.loyalty.points).toBe(0)
      expect(customer.loyalty.lifetimePoints).toBe(0)
      expect(customer.loyalty.tier).toBe('bronze')
    })

    test('should update loyalty points', async () => {
      const customer = await Customer.create({
        name: 'Points User',
        email: 'points@example.com',
        password: 'password123',
        phone: '+1-555-0333'
      })

      customer.loyalty.points = 100
      customer.loyalty.lifetimePoints = 150
      await customer.save()

      const updatedCustomer = await Customer.findById(customer._id)
      expect(updatedCustomer.loyalty.points).toBe(100)
      expect(updatedCustomer.loyalty.lifetimePoints).toBe(150)
    })

    test('should validate loyalty tier', async () => {
      const customer = await Customer.create({
        name: 'Tier User',
        email: 'tier@example.com',
        password: 'password123',
        phone: '+1-555-0444'
      })

      customer.loyalty.tier = 'invalid_tier'
      await expect(customer.save()).rejects.toThrow()
    })

    test('should allow valid loyalty tiers', async () => {
      const validTiers = ['bronze', 'silver', 'gold', 'platinum']
      
      for (const tier of validTiers) {
        const customer = await Customer.create({
          name: `Tier ${tier}`,
          email: `${tier}@example.com`,
          password: 'password123',
          phone: '+1-555-0555'
        })

        customer.loyalty.tier = tier
        await customer.save()
        
        const savedCustomer = await Customer.findById(customer._id)
        expect(savedCustomer.loyalty.tier).toBe(tier)
      }
    })
  })

  describe('Customer Orders', () => {
    test('should track order count', async () => {
      const customer = await Customer.create({
        name: 'Order User',
        email: 'order@example.com',
        password: 'password123',
        phone: '+1-555-0666'
      })

      // Create orders for the customer
      await Order.create({
        orderNumber: 'ORDER1',
        customerId: customer._id,
        items: [],
        total: 25.00,
        status: 'completed',
        customerInfo: { name: 'Order User', email: 'order@example.com', phone: '+1-555-0666' }
      })

      await Order.create({
        orderNumber: 'ORDER2',
        customerId: customer._id,
        items: [],
        total: 15.00,
        status: 'completed',
        customerInfo: { name: 'Order User', email: 'order@example.com', phone: '+1-555-0666' }
      })

      // Update customer order count
      const orders = await Order.find({ customerId: customer._id, status: 'completed' })
      customer.orderCount = orders.length
      customer.totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
      await customer.save()

      const updatedCustomer = await Customer.findById(customer._id)
      expect(updatedCustomer.orderCount).toBe(2)
      expect(updatedCustomer.totalSpent).toBe(40.00)
    })
  })

  describe('Customer Methods', () => {
    test('should update timestamps on modification', async () => {
      const customer = await Customer.create({
        name: 'Time User',
        email: 'time@example.com',
        password: 'password123',
        phone: '+1-555-0777'
      })

      const originalUpdatedAt = customer.updatedAt
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))
      
      customer.name = 'Updated Name'
      await customer.save()

      const updatedCustomer = await Customer.findById(customer._id)
      expect(updatedCustomer.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    test('should handle soft delete', async () => {
      const customer = await Customer.create({
        name: 'Delete User',
        email: 'delete@example.com',
        password: 'password123',
        phone: '+1-555-0888'
      })

      customer.isActive = false
      await customer.save()

      const deletedCustomer = await Customer.findById(customer._id)
      expect(deletedCustomer.isActive).toBe(false)

      const activeCustomers = await Customer.find({ isActive: true })
      expect(activeCustomers).toHaveLength(0)
    })
  })

  describe('Customer Queries', () => {
    test('should find customers by email', async () => {
      await Customer.create({
        name: 'Find User',
        email: 'find@example.com',
        password: 'password123',
        phone: '+1-555-0999'
      })

      const foundCustomer = await Customer.findOne({ email: 'find@example.com' })
      expect(foundCustomer).toBeDefined()
      expect(foundCustomer.name).toBe('Find User')
    })

    test('should find active customers only', async () => {
      await Customer.create({
        name: 'Active User',
        email: 'active@example.com',
        password: 'password123',
        phone: '+1-555-1111',
        isActive: true
      })

      await Customer.create({
        name: 'Inactive User',
        email: 'inactive@example.com',
        password: 'password123',
        phone: '+1-555-2222',
        isActive: false
      })

      const activeCustomers = await Customer.find({ isActive: true })
      expect(activeCustomers).toHaveLength(1)
      expect(activeCustomers[0].name).toBe('Active User')

      const inactiveCustomers = await Customer.find({ isActive: false })
      expect(inactiveCustomers).toHaveLength(1)
      expect(inactiveCustomers[0].name).toBe('Inactive User')
    })

    test('should find customers by loyalty tier', async () => {
      await Customer.create({
        name: 'Bronze User',
        email: 'bronze@example.com',
        password: 'password123',
        phone: '+1-555-3333',
        loyalty: { tier: 'bronze', points: 0, lifetimePoints: 0 }
      })

      await Customer.create({
        name: 'Gold User',
        email: 'gold@example.com',
        password: 'password123',
        phone: '+1-555-4444',
        loyalty: { tier: 'gold', points: 500, lifetimePoints: 500 }
      })

      const bronzeCustomers = await Customer.find({ 'loyalty.tier': 'bronze' })
      expect(bronzeCustomers).toHaveLength(1)
      expect(bronzeCustomers[0].name).toBe('Bronze User')

      const goldCustomers = await Customer.find({ 'loyalty.tier': 'gold' })
      expect(goldCustomers).toHaveLength(1)
      expect(goldCustomers[0].name).toBe('Gold User')
    })
  })

  describe('Customer Validation', () => {
    test('should validate phone number format', async () => {
      const customerData = {
        name: 'Phone User',
        email: 'phone@example.com',
        password: 'password123',
        phone: 'invalid-phone'
      }

      await expect(Customer.create(customerData)).rejects.toThrow()
    })

    test('should validate password length', async () => {
      const customerData = {
        name: 'Short User',
        email: 'short@example.com',
        password: '123',
        phone: '+1-555-5555'
      }

      await expect(Customer.create(customerData)).rejects.toThrow()
    })

    test('should trim whitespace from name and email', async () => {
      const customer = await Customer.create({
        name: '  Trim User  ',
        email: '  trim@example.com  ',
        password: 'password123',
        phone: '+1-555-6666'
      })

      expect(customer.name).toBe('Trim User')
      expect(customer.email).toBe('trim@example.com')
    })
  })
})
