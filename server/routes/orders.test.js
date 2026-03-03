import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import app from '../index.js'
import { Order } from '../models/Order.js'
import { Customer } from '../models/Customer.js'
import { MenuItem } from '../models/MenuItem.js'

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
  await Order.deleteMany({})
  await Customer.deleteMany({})
  await MenuItem.deleteMany({})
})

describe('Orders API Endpoints', () => {
  describe('GET /api/orders/track/:orderNumber', () => {
    test('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/track/NONEXISTENT')
        .expect(404)

      expect(response.body.error).toBe('Order not found')
    })

    test('should return order details for valid order number', async () => {
      // Create test customer
      const customer = await Customer.create({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123'
      })

      // Create test order
      const order = await Order.create({
        orderNumber: 'TEST123',
        customerId: customer._id,
        items: [
          {
            name: 'Margherita Pizza',
            price: 12.99,
            quantity: 1,
            itemId: new mongoose.Types.ObjectId()
          }
        ],
        total: 12.99,
        status: 'preparing',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        }
      })

      const response = await request(app)
        .get('/api/orders/track/TEST123')
        .expect(200)

      expect(response.body.orderNumber).toBe('TEST123')
      expect(response.body.status).toBe('preparing')
      expect(response.body.total).toBe(12.99)
      expect(response.body.items).toHaveLength(1)
      expect(response.body.items[0].name).toBe('Margherita Pizza')
    })

    test('should handle case-insensitive order numbers', async () => {
      // Create test order
      await Order.create({
        orderNumber: 'test123',
        items: [],
        total: 0,
        status: 'pending'
      })

      const response = await request(app)
        .get('/api/orders/track/TEST123')
        .expect(200)

      expect(response.body.orderNumber).toBe('test123')
    })
  })

  describe('POST /api/orders', () => {
    test('should create new order', async () => {
      // Create test customer
      const customer = await Customer.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1-555-0456'
      })

      // Create test menu item
      const menuItem = await MenuItem.create({
        name: 'Pepperoni Pizza',
        price: 14.99,
        isActive: true
      })

      const orderData = {
        customerId: customer._id,
        items: [
          {
            name: 'Pepperoni Pizza',
            price: 14.99,
            quantity: 2,
            itemId: menuItem._id
          }
        ],
        total: 29.98,
        customerInfo: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1-555-0456',
          address: '123 Test St'
        }
      }

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201)

      expect(response.body.status).toBe('pending')
      expect(response.body.total).toBe(29.98)
      expect(response.body.items).toHaveLength(1)
      expect(response.body.orderNumber).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
    })

    test('should validate required fields', async () => {
      const invalidOrder = {
        items: [],
        total: 0
        // Missing customerInfo
      }

      const response = await request(app)
        .post('/api/orders')
        .send(invalidOrder)
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    test('should calculate total if not provided', async () => {
      const orderData = {
        items: [
          {
            name: 'Test Pizza',
            price: 10.00,
            quantity: 2
          }
        ],
        customerInfo: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+1-555-0789'
        }
      }

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201)

      expect(response.body.total).toBe(20.00)
    })

    test('should handle guest orders', async () => {
      const guestOrderData = {
        items: [
          {
            name: 'Guest Pizza',
            price: 12.99,
            quantity: 1
          }
        ],
        total: 12.99,
        customerInfo: {
          name: 'Guest Customer',
          email: 'guest@example.com',
          phone: '+1-555-0999',
          isGuest: true
        }
      }

      const response = await request(app)
        .post('/api/orders')
        .send(guestOrderData)
        .expect(201)

      expect(response.body.customerInfo.isGuest).toBe(true)
    })
  })

  describe('PUT /api/orders/:id/status', () => {
    test('should update order status', async () => {
      // Create test order
      const order = await Order.create({
        orderNumber: 'STATUS123',
        items: [],
        total: 0,
        status: 'pending'
      })

      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .send({ status: 'preparing' })
        .expect(200)

      expect(response.body.status).toBe('preparing')
    })

    test('should validate status values', async () => {
      const order = await Order.create({
        orderNumber: 'INVALID123',
        items: [],
        total: 0,
        status: 'pending'
      })

      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .send({ status: 'invalid_status' })
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    test('should return 404 for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId()

      await request(app)
        .put(`/api/orders/${fakeId}/status`)
        .send({ status: 'preparing' })
        .expect(404)
    })
  })

  describe('GET /api/orders', () => {
    test('should return paginated orders', async () => {
      // Create multiple test orders
      for (let i = 0; i < 15; i++) {
        await Order.create({
          orderNumber: `ORDER${i}`,
          items: [],
          total: i * 10,
          status: 'pending'
        })
      }

      const response = await request(app)
        .get('/api/orders')
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(response.body.orders).toHaveLength(10)
      expect(response.body.total).toBe(15)
      expect(response.body.page).toBe(1)
      expect(response.body.totalPages).toBe(2)
    })

    test('should filter orders by status', async () => {
      // Create orders with different statuses
      await Order.create({
        orderNumber: 'PENDING1',
        items: [],
        total: 10,
        status: 'pending'
      })

      await Order.create({
        orderNumber: 'PREPARING1',
        items: [],
        total: 20,
        status: 'preparing'
      })

      const response = await request(app)
        .get('/api/orders')
        .query({ status: 'pending' })
        .expect(200)

      expect(response.body.orders).toHaveLength(1)
      expect(response.body.orders[0].status).toBe('pending')
    })

    test('should sort orders by creation date', async () => {
      // Create orders with different timestamps
      const order1 = await Order.create({
        orderNumber: 'OLD1',
        items: [],
        total: 10,
        status: 'pending',
        createdAt: new Date('2024-01-01')
      })

      const order2 = await Order.create({
        orderNumber: 'NEW1',
        items: [],
        total: 20,
        status: 'pending',
        createdAt: new Date('2024-01-02')
      })

      const response = await request(app)
        .get('/api/orders')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .expect(200)

      expect(response.body.orders[0].orderNumber).toBe('NEW1')
      expect(response.body.orders[1].orderNumber).toBe('OLD1')
    })
  })
})
