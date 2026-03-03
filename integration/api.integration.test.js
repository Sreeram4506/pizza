import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import app from '../server/index.js'
import { Customer } from '../server/models/Customer.js'
import { MenuItem } from '../server/models/MenuItem.js'
import { MenuCategory } from '../server/models/MenuItem.js'
import { Order } from '../server/models/Order.js'

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
  await MenuItem.deleteMany({})
  await MenuCategory.deleteMany({})
  await Order.deleteMany({})
})

describe('Customer Order Flow Integration', () => {
  test('complete customer order workflow', async () => {
    // 1. Create menu items
    const category = await MenuCategory.create({
      name: 'Pizza',
      description: 'Delicious pizzas',
      sortOrder: 0,
      isActive: true
    })

    const menuItem = await MenuItem.create({
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato and mozzarella',
      price: 12.99,
      categoryId: category._id,
      dietary: {
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        spicy: false
      },
      isActive: true,
      sortOrder: 0
    })

    // 2. Register customer
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1-555-0123'
      })
      .expect(201)

    expect(registerResponse.body.user.name).toBe('John Doe')
    expect(registerResponse.body.token).toBeDefined()

    const token = registerResponse.body.token
    const customer = registerResponse.body.user

    // 3. Login customer
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'password123'
      })
      .expect(200)

    expect(loginResponse.body.user.email).toBe('john@example.com')
    expect(loginResponse.body.token).toBeDefined()

    // 4. Create order
    const orderResponse = await request(app)
      .post('/api/orders')
      .send({
        customerId: customer._id,
        items: [
          {
            name: 'Margherita Pizza',
            price: 12.99,
            quantity: 2,
            itemId: menuItem._id
          }
        ],
        total: 25.98,
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123',
          address: '123 Test St'
        }
      })
      .expect(201)

    expect(orderResponse.body.status).toBe('pending')
    expect(orderResponse.body.total).toBe(25.98)
    expect(orderResponse.body.orderNumber).toBeDefined()

    const order = orderResponse.body

    // 5. Track order
    const trackResponse = await request(app)
      .get(`/api/orders/track/${order.orderNumber}`)
      .expect(200)

    expect(trackResponse.body.orderNumber).toBe(order.orderNumber)
    expect(trackResponse.body.status).toBe('pending')
    expect(trackResponse.body.items).toHaveLength(1)

    // 6. Update order status
    const updateResponse = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .send({ status: 'preparing' })
      .expect(200)

    expect(updateResponse.body.status).toBe('preparing')

    // 7. Verify order status change
    const finalTrackResponse = await request(app)
      .get(`/api/orders/track/${order.orderNumber}`)
      .expect(200)

    expect(finalTrackResponse.body.status).toBe('preparing')
  })

  test('guest order workflow', async () => {
    // 1. Create menu items
    const category = await MenuCategory.create({
      name: 'Pizza',
      description: 'Delicious pizzas',
      sortOrder: 0,
      isActive: true
    })

    const menuItem = await MenuItem.create({
      name: 'Pepperoni Pizza',
      description: 'Pizza with pepperoni',
      price: 14.99,
      categoryId: category._id,
      dietary: {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        spicy: true
      },
      isActive: true,
      sortOrder: 0
    })

    // 2. Create guest order
    const orderResponse = await request(app)
      .post('/api/orders')
      .send({
        items: [
          {
            name: 'Pepperoni Pizza',
            price: 14.99,
            quantity: 1,
            itemId: menuItem._id
          }
        ],
        total: 14.99,
        customerInfo: {
          name: 'Guest Customer',
          email: 'guest@example.com',
          phone: '+1-555-0999',
          address: '456 Guest St',
          isGuest: true
        }
      })
      .expect(201)

    expect(orderResponse.body.customerInfo.isGuest).toBe(true)
    expect(orderResponse.body.orderNumber).toBeDefined()

    const order = orderResponse.body

    // 3. Track guest order
    const trackResponse = await request(app)
      .get(`/api/orders/track/${order.orderNumber}`)
      .expect(200)

    expect(trackResponse.body.customerInfo.name).toBe('Guest Customer')
    expect(trackResponse.body.customerInfo.isGuest).toBe(true)
  })
})

describe('Menu Management Integration', () => {
  test('complete menu management workflow', async () => {
    // 1. Create category
    const categoryResponse = await request(app)
      .post('/api/menu/categories')
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'Beverages',
        description: 'Refreshing drinks',
        sortOrder: 1,
        isActive: true
      })
      .expect(201)

    const category = categoryResponse.body

    // 2. Create menu item
    const itemResponse = await request(app)
      .post('/api/menu/items')
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'Coca Cola',
        description: 'Classic cola drink',
        price: 2.99,
        categoryId: category._id,
        dietary: {
          vegetarian: true,
          vegan: true,
          glutenFree: true,
          spicy: false
        },
        isActive: true,
        sortOrder: 0
      })
      .expect(201)

    const menuItem = itemResponse.body

    // 3. Get all categories
    const categoriesResponse = await request(app)
      .get('/api/menu/categories')
      .expect(200)

    expect(categoriesResponse.body).toHaveLength(1)
    expect(categoriesResponse.body[0].name).toBe('Beverages')

    // 4. Get all menu items
    const itemsResponse = await request(app)
      .get('/api/menu/items')
      .expect(200)

    expect(itemsResponse.body).toHaveLength(1)
    expect(itemsResponse.body[0].name).toBe('Coca Cola')
    expect(itemsResponse.body[0].categoryId).toBe(category._id)

    // 5. Update menu item
    const updateResponse = await request(app)
      .put(`/api/menu/items/${menuItem._id}`)
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'Coca Cola Large',
        description: 'Large classic cola drink',
        price: 3.99
      })
      .expect(200)

    expect(updateResponse.body.name).toBe('Coca Cola Large')
    expect(updateResponse.body.price).toBe(3.99)

    // 6. Deactivate menu item
    const deactivateResponse = await request(app)
      .put(`/api/menu/items/${menuItem._id}`)
      .set('Authorization', 'Bearer admin-token')
      .send({
        isActive: false
      })
      .expect(200)

    expect(deactivateResponse.body.isActive).toBe(false)

    // 7. Verify item is not returned in public API
    const finalItemsResponse = await request(app)
      .get('/api/menu/items')
      .expect(200)

    expect(finalItemsResponse.body).toHaveLength(0)
  })
})

describe('Order Status Updates Integration', () => {
  test('order status progression workflow', async () => {
    // 1. Create customer and order
    const customer = await Customer.create({
      name: 'Status User',
      email: 'status@example.com',
      password: 'hashedpassword',
      phone: '+1-555-0123'
    })

    const order = await Order.create({
      orderNumber: 'STATUS123',
      customerId: customer._id,
      items: [
        {
          name: 'Test Pizza',
          price: 12.99,
          quantity: 1,
          itemId: new mongoose.Types.ObjectId()
        }
      ],
      total: 12.99,
      status: 'pending',
      customerInfo: {
        name: 'Status User',
        email: 'status@example.com',
        phone: '+1-555-0123'
      }
    })

    // 2. Progress through order statuses
    const statuses = ['confirmed', 'preparing', 'ready', 'completed']

    for (const status of statuses) {
      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .send({ status })
        .expect(200)

      expect(response.body.status).toBe(status)

      // Verify tracking shows updated status
      const trackResponse = await request(app)
        .get(`/api/orders/track/${order.orderNumber}`)
        .expect(200)

      expect(trackResponse.body.status).toBe(status)
    }

    // 3. Final verification
    const finalOrder = await Order.findById(order._id)
    expect(finalOrder.status).toBe('completed')
  })
})

describe('Customer Authentication Integration', () => {
  test('customer registration and login workflow', async () => {
    const customerData = {
      name: 'Auth User',
      email: 'auth@example.com',
      password: 'password123',
      phone: '+1-555-0456'
    }

    // 1. Register customer
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(customerData)
      .expect(201)

    expect(registerResponse.body.user.name).toBe(customerData.name)
    expect(registerResponse.body.user.email).toBe(customerData.email)
    expect(registerResponse.body.token).toBeDefined()

    // 2. Login with correct credentials
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: customerData.email,
        password: customerData.password
      })
      .expect(200)

    expect(loginResponse.body.user.email).toBe(customerData.email)
    expect(loginResponse.body.token).toBeDefined()

    // 3. Attempt login with wrong password
    const wrongPasswordResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: customerData.email,
        password: 'wrongpassword'
      })
      .expect(401)

    expect(wrongPasswordResponse.body.error).toContain('Invalid credentials')

    // 4. Attempt login with wrong email
    const wrongEmailResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: customerData.password
      })
      .expect(401)

    expect(wrongEmailResponse.body.error).toContain('Invalid credentials')

    // 5. Attempt duplicate registration
    const duplicateResponse = await request(app)
      .post('/api/auth/register')
      .send(customerData)
      .expect(400)

    expect(duplicateResponse.body.error).toContain('already exists')
  })
})

describe('Error Handling Integration', () => {
  test('handles invalid order numbers gracefully', async () => {
    const response = await request(app)
      .get('/api/orders/track/INVALID123')
      .expect(404)

    expect(response.body.error).toBe('Order not found')
  })

  test('handles invalid menu item IDs gracefully', async () => {
    const fakeId = new mongoose.Types.ObjectId()

    const response = await request(app)
      .put(`/api/menu/items/${fakeId}`)
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'Updated Item',
        price: 99.99
      })
      .expect(404)

    expect(response.body.error).toBeDefined()
  })

  test('handles malformed requests gracefully', async () => {
    // Test with invalid JSON
    const response = await request(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send('{"invalid": json}')
      .expect(400)

    expect(response.body.error).toBeDefined()
  })

  test('handles missing authentication gracefully', async () => {
    const response = await request(app)
      .post('/api/menu/categories')
      .send({
        name: 'Test Category',
        description: 'Test description'
      })
      .expect(401)

    expect(response.body.error).toBeDefined()
  })
})
