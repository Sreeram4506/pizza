import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
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

describe('Order Model', () => {
  describe('Order Creation', () => {
    test('should create a new order with required fields', async () => {
      const orderData = {
        orderNumber: 'TEST123',
        items: [
          {
            name: 'Margherita Pizza',
            price: 12.99,
            quantity: 1,
            itemId: new mongoose.Types.ObjectId()
          }
        ],
        total: 12.99,
        status: 'pending',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        }
      }

      const order = await Order.create(orderData)

      expect(order.orderNumber).toBe('TEST123')
      expect(order.items).toHaveLength(1)
      expect(order.total).toBe(12.99)
      expect(order.status).toBe('pending')
      expect(order.customerInfo.name).toBe('John Doe')
      expect(order.createdAt).toBeDefined()
      expect(order.updatedAt).toBeDefined()
    })

    test('should require orderNumber', async () => {
      const orderData = {
        items: [],
        total: 0,
        status: 'pending',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        }
      }

      await expect(Order.create(orderData)).rejects.toThrow()
    })

    test('should require customerInfo', async () => {
      const orderData = {
        orderNumber: 'TEST123',
        items: [],
        total: 0,
        status: 'pending'
      }

      await expect(Order.create(orderData)).rejects.toThrow()
    })

    test('should set default status to pending', async () => {
      const orderData = {
        orderNumber: 'TEST123',
        items: [],
        total: 0,
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        }
      }

      const order = await Order.create(orderData)
      expect(order.status).toBe('pending')
    })

    test('should validate status values', async () => {
      const orderData = {
        orderNumber: 'TEST123',
        items: [],
        total: 0,
        status: 'invalid_status',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        }
      }

      await expect(Order.create(orderData)).rejects.toThrow()
    })
  })

  describe('Order Items', () => {
    test('should handle multiple items', async () => {
      const orderData = {
        orderNumber: 'MULTI123',
        items: [
          {
            name: 'Margherita Pizza',
            price: 12.99,
            quantity: 1,
            itemId: new mongoose.Types.ObjectId()
          },
          {
            name: 'Pepperoni Pizza',
            price: 14.99,
            quantity: 2,
            itemId: new mongoose.Types.ObjectId()
          }
        ],
        total: 42.97,
        status: 'pending',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        }
      }

      const order = await Order.create(orderData)
      expect(order.items).toHaveLength(2)
      expect(order.items[0].name).toBe('Margherita Pizza')
      expect(order.items[1].name).toBe('Pepperoni Pizza')
      expect(order.items[1].quantity).toBe(2)
    })

    test('should validate item structure', async () => {
      const orderData = {
        orderNumber: 'INVALID123',
        items: [
          {
            name: 'Pizza',
            price: 12.99
            // Missing required fields
          }
        ],
        total: 12.99,
        status: 'pending',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        }
      }

      await expect(Order.create(orderData)).rejects.toThrow()
    })
  })

  describe('Order Relationships', () => {
    test('should reference customer correctly', async () => {
      const customer = await Customer.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'hashedpassword',
        phone: '+1-555-0456'
      })

      const orderData = {
        orderNumber: 'REF123',
        customerId: customer._id,
        items: [],
        total: 0,
        status: 'pending',
        customerInfo: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1-555-0456'
        }
      }

      const order = await Order.create(orderData)
      expect(order.customerId.toString()).toBe(customer._id.toString())
    })

    test('should populate customer when requested', async () => {
      const customer = await Customer.create({
        name: 'Populate User',
        email: 'populate@example.com',
        password: 'hashedpassword',
        phone: '+1-555-0789'
      })

      const order = await Order.create({
        orderNumber: 'POP123',
        customerId: customer._id,
        items: [],
        total: 0,
        status: 'pending',
        customerInfo: {
          name: 'Populate User',
          email: 'populate@example.com',
          phone: '+1-555-0789'
        }
      })

      const populatedOrder = await Order.findById(order._id).populate('customerId')
      expect(populatedOrder.customerId.name).toBe('Populate User')
    })
  })

  describe('Order Methods', () => {
    test('should update status correctly', async () => {
      const order = await Order.create({
        orderNumber: 'UPDATE123',
        items: [],
        total: 0,
        status: 'pending',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        }
      })

      order.status = 'preparing'
      await order.save()

      const updatedOrder = await Order.findById(order._id)
      expect(updatedOrder.status).toBe('preparing')
    })

    test('should update timestamps on modification', async () => {
      const order = await Order.create({
        orderNumber: 'TIME123',
        items: [],
        total: 0,
        status: 'pending',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        }
      })

      const originalUpdatedAt = order.updatedAt
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))
      
      order.status = 'preparing'
      await order.save()

      const updatedOrder = await Order.findById(order._id)
      expect(updatedOrder.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe('Order Queries', () => {
    test('should find orders by status', async () => {
      await Order.create({
        orderNumber: 'PENDING1',
        items: [],
        total: 0,
        status: 'pending',
        customerInfo: { name: 'User1', email: 'user1@example.com', phone: '+1-555-0123' }
      })

      await Order.create({
        orderNumber: 'PREPARING1',
        items: [],
        total: 0,
        status: 'preparing',
        customerInfo: { name: 'User2', email: 'user2@example.com', phone: '+1-555-0456' }
      })

      const pendingOrders = await Order.find({ status: 'pending' })
      expect(pendingOrders).toHaveLength(1)
      expect(pendingOrders[0].orderNumber).toBe('PENDING1')

      const preparingOrders = await Order.find({ status: 'preparing' })
      expect(preparingOrders).toHaveLength(1)
      expect(preparingOrders[0].orderNumber).toBe('PREPARING1')
    })

    test('should find orders by customer', async () => {
      const customer = await Customer.create({
        name: 'Customer User',
        email: 'customer@example.com',
        password: 'hashedpassword',
        phone: '+1-555-0999'
      })

      await Order.create({
        orderNumber: 'CUST1',
        customerId: customer._id,
        items: [],
        total: 0,
        status: 'pending',
        customerInfo: { name: 'Customer User', email: 'customer@example.com', phone: '+1-555-0999' }
      })

      const customerOrders = await Order.find({ customerId: customer._id })
      expect(customerOrders).toHaveLength(1)
      expect(customerOrders[0].orderNumber).toBe('CUST1')
    })

    test('should sort orders by creation date', async () => {
      const order1 = await Order.create({
        orderNumber: 'OLD1',
        items: [],
        total: 0,
        status: 'pending',
        customerInfo: { name: 'User1', email: 'user1@example.com', phone: '+1-555-0123' },
        createdAt: new Date('2024-01-01')
      })

      const order2 = await Order.create({
        orderNumber: 'NEW1',
        items: [],
        total: 0,
        status: 'pending',
        customerInfo: { name: 'User2', email: 'user2@example.com', phone: '+1-555-0456' },
        createdAt: new Date('2024-01-02')
      })

      const sortedOrders = await Order.find().sort({ createdAt: -1 })
      expect(sortedOrders[0].orderNumber).toBe('NEW1')
      expect(sortedOrders[1].orderNumber).toBe('OLD1')
    })
  })

  describe('Order Validation', () => {
    test('should validate total calculation', async () => {
      const orderData = {
        orderNumber: 'CALC123',
        items: [
          {
            name: 'Pizza 1',
            price: 10.00,
            quantity: 2,
            itemId: new mongoose.Types.ObjectId()
          },
          {
            name: 'Pizza 2',
            price: 5.00,
            quantity: 1,
            itemId: new mongoose.Types.ObjectId()
          }
        ],
        total: 25.00,
        status: 'pending',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123'
        }
      }

      const order = await Order.create(orderData)
      expect(order.total).toBe(25.00)
    })

    test('should validate customerInfo structure', async () => {
      const orderData = {
        orderNumber: 'CUST123',
        items: [],
        total: 0,
        status: 'pending',
        customerInfo: {
          name: 'John Doe'
          // Missing required email and phone
        }
      }

      await expect(Order.create(orderData)).rejects.toThrow()
    })
  })
})
