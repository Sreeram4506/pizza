import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import app from '../index.js'
import { MenuItem } from '../models/MenuItem.js'
import { MenuCategory } from '../models/MenuCategory.js'

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
  await MenuItem.deleteMany({})
  await MenuCategory.deleteMany({})
})

describe('Menu API Endpoints', () => {
  describe('GET /api/menu/categories', () => {
    test('should return empty categories list', async () => {
      const response = await request(app)
        .get('/api/menu/categories')
        .expect(200)

      expect(response.body).toEqual([])
    })

    test('should return list of categories', async () => {
      // Create test categories
      const category1 = await MenuCategory.create({
        name: 'Pizza',
        description: 'Delicious pizzas',
        sortOrder: 0,
        isActive: true
      })

      const category2 = await MenuCategory.create({
        name: 'Drinks',
        description: 'Refreshing beverages',
        sortOrder: 1,
        isActive: true
      })

      const response = await request(app)
        .get('/api/menu/categories')
        .expect(200)

      expect(response.body).toHaveLength(2)
      expect(response.body[0].name).toBe('Pizza')
      expect(response.body[1].name).toBe('Drinks')
    })

    test('should only return active categories', async () => {
      // Create active and inactive categories
      await MenuCategory.create({
        name: 'Pizza',
        description: 'Delicious pizzas',
        sortOrder: 0,
        isActive: true
      })

      await MenuCategory.create({
        name: 'Inactive Category',
        description: 'Not visible',
        sortOrder: 1,
        isActive: false
      })

      const response = await request(app)
        .get('/api/menu/categories')
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].name).toBe('Pizza')
    })
  })

  describe('GET /api/menu/items', () => {
    test('should return empty menu items list', async () => {
      const response = await request(app)
        .get('/api/menu/items')
        .expect(200)

      expect(response.body).toEqual([])
    })

    test('should return list of menu items', async () => {
      // Create test category
      const category = await MenuCategory.create({
        name: 'Pizza',
        description: 'Delicious pizzas',
        sortOrder: 0,
        isActive: true
      })

      // Create test menu items
      await MenuItem.create({
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

      await MenuItem.create({
        name: 'Pepperoni Pizza',
        description: 'Pizza with pepperoni and cheese',
        price: 14.99,
        categoryId: category._id,
        dietary: {
          vegetarian: false,
          vegan: false,
          glutenFree: false,
          spicy: true
        },
        isActive: true,
        sortOrder: 1
      })

      const response = await request(app)
        .get('/api/menu/items')
        .expect(200)

      expect(response.body).toHaveLength(2)
      expect(response.body[0].name).toBe('Margherita Pizza')
      expect(response.body[1].name).toBe('Pepperoni Pizza')
    })

    test('should only return active menu items', async () => {
      // Create test category
      const category = await MenuCategory.create({
        name: 'Pizza',
        description: 'Delicious pizzas',
        sortOrder: 0,
        isActive: true
      })

      // Create active and inactive items
      await MenuItem.create({
        name: 'Active Pizza',
        description: 'Visible pizza',
        price: 12.99,
        categoryId: category._id,
        isActive: true,
        sortOrder: 0
      })

      await MenuItem.create({
        name: 'Inactive Pizza',
        description: 'Hidden pizza',
        price: 14.99,
        categoryId: category._id,
        isActive: false,
        sortOrder: 1
      })

      const response = await request(app)
        .get('/api/menu/items')
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].name).toBe('Active Pizza')
    })

    test('should return items with dietary information', async () => {
      // Create test category
      const category = await MenuCategory.create({
        name: 'Pizza',
        description: 'Delicious pizzas',
        sortOrder: 0,
        isActive: true
      })

      // Create test item with dietary info
      await MenuItem.create({
        name: 'Veggie Pizza',
        description: 'Vegetarian pizza',
        price: 13.99,
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

      const response = await request(app)
        .get('/api/menu/items')
        .expect(200)

      expect(response.body[0].dietary.vegetarian).toBe(true)
      expect(response.body[0].dietary.vegan).toBe(true)
      expect(response.body[0].dietary.glutenFree).toBe(true)
      expect(response.body[0].dietary.spicy).toBe(false)
    })
  })

  describe('POST /api/menu/categories (admin only)', () => {
    test('should create new category', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'Test category',
        sortOrder: 0,
        isActive: true
      }

      const response = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', 'Bearer test-token')
        .send(categoryData)
        .expect(201)

      expect(response.body.name).toBe('New Category')
      expect(response.body.description).toBe('Test category')
    })

    test('should require authentication', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'Test category'
      }

      await request(app)
        .post('/api/menu/categories')
        .send(categoryData)
        .expect(401)
    })

    test('should validate required fields', async () => {
      const invalidData = {
        description: 'Category without name'
      }

      await request(app)
        .post('/api/menu/categories')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData)
        .expect(400)
    })
  })

  describe('POST /api/menu/items (admin only)', () => {
    test('should create new menu item', async () => {
      // Create test category
      const category = await MenuCategory.create({
        name: 'Pizza',
        description: 'Delicious pizzas',
        sortOrder: 0,
        isActive: true
      })

      const itemData = {
        name: 'New Pizza',
        description: 'Test pizza',
        price: 15.99,
        categoryId: category._id,
        dietary: {
          vegetarian: false,
          vegan: false,
          glutenFree: false,
          spicy: false
        },
        isActive: true,
        sortOrder: 0
      }

      const response = await request(app)
        .post('/api/menu/items')
        .set('Authorization', 'Bearer test-token')
        .send(itemData)
        .expect(201)

      expect(response.body.name).toBe('New Pizza')
      expect(response.body.price).toBe(15.99)
    })

    test('should require authentication', async () => {
      const itemData = {
        name: 'New Pizza',
        description: 'Test pizza',
        price: 15.99
      }

      await request(app)
        .post('/api/menu/items')
        .send(itemData)
        .expect(401)
    })

    test('should validate required fields', async () => {
      const invalidData = {
        name: 'Pizza without price'
      }

      await request(app)
        .post('/api/menu/items')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData)
        .expect(400)
    })
  })
})
