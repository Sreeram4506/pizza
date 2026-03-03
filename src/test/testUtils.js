import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { Customer } from '../server/models/Customer.js'
import { MenuItem } from '../server/models/MenuItem.js'
import { MenuCategory } from '../server/models/MenuCategory.js'
import { Order } from '../server/models/Order.js'
import { User } from '../server/models/User.js'

export class TestDatabase {
  constructor() {
    this.mongoServer = null
  }

  async connect() {
    this.mongoServer = await MongoMemoryServer.create()
    const mongoUri = this.mongoServer.getUri()
    await mongoose.connect(mongoUri)
  }

  async disconnect() {
    await mongoose.disconnect()
    if (this.mongoServer) {
      await this.mongoServer.stop()
    }
  }

  async clear() {
    await Customer.deleteMany({})
    await MenuItem.deleteMany({})
    await MenuCategory.deleteMany({})
    await Order.deleteMany({})
    await User.deleteMany({})
  }
}

export class TestDataFactory {
  static async createCustomer(overrides = {}) {
    const customerData = {
      name: 'Test Customer',
      email: 'test@example.com',
      password: 'password123',
      phone: '+1-555-0123',
      ...overrides
    }

    return await Customer.create(customerData)
  }

  static async createMenuCategory(overrides = {}) {
    const categoryData = {
      name: 'Test Category',
      description: 'Test category description',
      sortOrder: 0,
      isActive: true,
      ...overrides
    }

    return await MenuCategory.create(categoryData)
  }

  static async createMenuItem(categoryId, overrides = {}) {
    const itemData = {
      name: 'Test Item',
      description: 'Test item description',
      price: 12.99,
      categoryId,
      dietary: {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        spicy: false
      },
      isActive: true,
      sortOrder: 0,
      ...overrides
    }

    return await MenuItem.create(itemData)
  }

  static async createOrder(customerId, items = [], overrides = {}) {
    const orderData = {
      orderNumber: 'TEST123',
      customerId,
      items,
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'pending',
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1-555-0123'
      },
      ...overrides
    }

    return await Order.create(orderData)
  }

  static async createAdminUser(overrides = {}) {
    const userData = {
      name: 'Test Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      ...overrides
    }

    return await User.create(userData)
  }
}

export class TestHelpers {
  static generateValidOrderNumber() {
    const prefix = 'ORD'
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}${timestamp}${random}`
  }

  static generateValidPhoneNumber() {
    const areaCode = Math.floor(Math.random() * 900) + 100
    const prefix = Math.floor(Math.random() * 900) + 100
    const lineNumber = Math.floor(Math.random() * 9000) + 1000
    return `+1-${areaCode}-${prefix}-${lineNumber}`
  }

  static generateValidEmail(name = 'test') {
    const domains = ['example.com', 'test.org', 'demo.net']
    const domain = domains[Math.floor(Math.random() * domains.length)]
    const timestamp = Date.now()
    return `${name}${timestamp}@${domain}`
  }

  static async createFullMenu() {
    const category = await TestDataFactory.createMenuCategory({
      name: 'Pizza',
      description: 'Delicious pizzas'
    })

    const items = await Promise.all([
      TestDataFactory.createMenuItem(category._id, {
        name: 'Margherita Pizza',
        price: 12.99,
        dietary: { vegetarian: true, vegan: false, glutenFree: false, spicy: false }
      }),
      TestDataFactory.createMenuItem(category._id, {
        name: 'Pepperoni Pizza',
        price: 14.99,
        dietary: { vegetarian: false, vegan: false, glutenFree: false, spicy: true }
      }),
      TestDataFactory.createMenuItem(category._id, {
        name: 'Veggie Pizza',
        price: 13.99,
        dietary: { vegetarian: true, vegan: false, glutenFree: true, spicy: false }
      })
    ])

    return { category, items }
  }

  static async createCustomerWithOrders(orderCount = 3) {
    const customer = await TestDataFactory.createCustomer()
    const { items } = await this.createFullMenu()

    const orders = []
    for (let i = 0; i < orderCount; i++) {
      const orderItems = items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: Math.floor(Math.random() * 3) + 1,
        itemId: item._id
      }))

      const order = await TestDataFactory.createOrder(customer._id, orderItems, {
        orderNumber: this.generateValidOrderNumber(),
        status: 'completed'
      })

      orders.push(order)
    }

    // Update customer order statistics
    customer.orderCount = orders.length
    customer.totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
    await customer.save()

    return { customer, orders }
  }

  static mockJWTToken(payload = {}) {
    const defaultPayload = {
      userId: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      role: 'customer',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    return `mock.jwt.token.${Buffer.from(JSON.stringify({ ...defaultPayload, ...payload })).toString('base64')}`
  }

  static assertValidOrder(order) {
    expect(order).toBeDefined()
    expect(order.orderNumber).toBeDefined()
    expect(order.status).toBeDefined()
    expect(order.items).toBeDefined()
    expect(Array.isArray(order.items)).toBe(true)
    expect(order.total).toBeDefined()
    expect(typeof order.total).toBe('number')
    expect(order.customerInfo).toBeDefined()
    expect(order.customerInfo.name).toBeDefined()
    expect(order.customerInfo.email).toBeDefined()
  }

  static assertValidCustomer(customer) {
    expect(customer).toBeDefined()
    expect(customer.name).toBeDefined()
    expect(customer.email).toBeDefined()
    expect(customer.phone).toBeDefined()
    expect(customer.isActive).toBeDefined()
    expect(typeof customer.isActive).toBe('boolean')
    expect(customer.loyalty).toBeDefined()
    expect(customer.loyalty.points).toBeDefined()
    expect(customer.loyalty.tier).toBeDefined()
  }

  static assertValidMenuItem(item) {
    expect(item).toBeDefined()
    expect(item.name).toBeDefined()
    expect(item.price).toBeDefined()
    expect(typeof item.price).toBe('number')
    expect(item.categoryId).toBeDefined()
    expect(item.dietary).toBeDefined()
    expect(item.isActive).toBeDefined()
    expect(typeof item.isActive).toBe('boolean')
  }

  static assertValidCategory(category) {
    expect(category).toBeDefined()
    expect(category.name).toBeDefined()
    expect(category.sortOrder).toBeDefined()
    expect(typeof category.sortOrder).toBe('number')
    expect(category.isActive).toBeDefined()
    expect(typeof category.isActive).toBe('boolean')
  }
}

// Global test setup and teardown
export const setupTestDatabase = () => {
  let testDb

  beforeAll(async () => {
    testDb = new TestDatabase()
    await testDb.connect()
  })

  afterAll(async () => {
    await testDb.disconnect()
  })

  beforeEach(async () => {
    await testDb.clear()
  })

  return testDb
}

// Mock responses for common scenarios
export const mockResponses = {
  success: (data = {}) => ({
    success: true,
    data,
    message: 'Operation successful'
  }),

  error: (message = 'Operation failed', code = 500) => ({
    success: false,
    error: message,
    code
  }),

  validationError: (field, message) => ({
    success: false,
    error: 'Validation failed',
    details: {
      field,
      message
    }
  }),

  notFound: (resource = 'Resource') => ({
    success: false,
    error: `${resource} not found`,
    code: 404
  }),

  unauthorized: () => ({
    success: false,
    error: 'Unauthorized access',
    code: 401
  })
}

// Common test scenarios
export const testScenarios = {
  happyPath: (description, testFn) => {
    test(`${description} - Happy Path`, testFn)
  },

  errorPath: (description, testFn) => {
    test(`${description} - Error Path`, testFn)
  },

  edgeCase: (description, testFn) => {
    test(`${description} - Edge Case`, testFn)
  },

  validation: (description, testFn) => {
    test(`${description} - Validation`, testFn)
  }
}
