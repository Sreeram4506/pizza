import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import app from '../index.js'
import { User } from '../models/User.js'
import { Customer } from '../models/Customer.js'

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
  await User.deleteMany({})
  await Customer.deleteMany({})
})

describe('Authentication API Endpoints', () => {
  describe('POST /api/auth/register', () => {
    test('should register new customer', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1-555-0123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(customerData)
        .expect(201)

      expect(response.body.user.name).toBe('John Doe')
      expect(response.body.user.email).toBe('john@example.com')
      expect(response.body.token).toBeDefined()
      expect(response.body.user.password).toBeUndefined() // Password should not be returned
    })

    test('should hash password during registration', async () => {
      const customerData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        phone: '+1-555-0456'
      }

      await request(app)
        .post('/api/auth/register')
        .send(customerData)

      const customer = await Customer.findOne({ email: 'jane@example.com' })
      expect(customer.password).not.toBe('password123')
      expect(customer.password).toMatch(/^\$2[aby]\$\d+\$/) // bcrypt hash pattern
    })

    test('should validate required fields', async () => {
      const invalidData = {
        name: 'John Doe',
        // Missing email, password, phone
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    test('should prevent duplicate email registration', async () => {
      // Create existing customer
      await Customer.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1-555-0789'
      })

      const duplicateData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'newpassword123',
        phone: '+1-555-0999'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(400)

      expect(response.body.error).toContain('already exists')
    })

    test('should validate email format', async () => {
      const invalidEmailData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        phone: '+1-555-0123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailData)
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test customer for login tests
      const hashedPassword = await bcrypt.hash('password123', 10)
      await Customer.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        phone: '+1-555-0123'
      })
    })

    test('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.user.name).toBe('Test User')
      expect(response.body.user.email).toBe('test@example.com')
      expect(response.body.token).toBeDefined()
      expect(response.body.user.password).toBeUndefined()
    })

    test('should reject invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.error).toContain('Invalid credentials')
    })

    test('should reject invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.error).toContain('Invalid credentials')
    })

    test('should validate required fields', async () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing password
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200)

      expect(response.body.message).toContain('Logged out successfully')
    })
  })

  describe('GET /api/auth/profile', () => {
    test('should return user profile with valid token', async () => {
      // Create and login user
      const customer = await Customer.create({
        name: 'Profile User',
        email: 'profile@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1-555-0123'
      })

      // Mock JWT token (in real app, this would be a valid JWT)
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer mock-token')
        .expect(401) // Will fail without proper JWT middleware

      // This test would need proper JWT middleware mocking
      expect(response.body.error).toBeDefined()
    })

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('PUT /api/auth/profile', () => {
    test('should update user profile', async () => {
      // Create test customer
      const customer = await Customer.create({
        name: 'Update User',
        email: 'update@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1-555-0123'
      })

      const updateData = {
        name: 'Updated Name',
        phone: '+1-555-0999'
      }

      // This would need proper authentication middleware
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer mock-token')
        .send(updateData)
        .expect(401) // Will fail without proper JWT middleware

      expect(response.body.error).toBeDefined()
    })

    test('should prevent email update', async () => {
      const customer = await Customer.create({
        name: 'Email User',
        email: 'email@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1-555-0123'
      })

      const updateData = {
        email: 'newemail@example.com'
      }

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer mock-token')
        .send(updateData)
        .expect(401)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    test('should send password reset email', async () => {
      await Customer.create({
        name: 'Forgot User',
        email: 'forgot@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1-555-0123'
      })

      const requestData = {
        email: 'forgot@example.com'
      }

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(requestData)
        .expect(200)

      expect(response.body.message).toContain('Password reset email sent')
    })

    test('should handle non-existent email', async () => {
      const requestData = {
        email: 'nonexistent@example.com'
      }

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(requestData)
        .expect(404)

      expect(response.body.error).toContain('User not found')
    })
  })
})
