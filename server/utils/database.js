import mongoose from 'mongoose'
import { config } from '../config.js'

export let isConnected = false

export async function connectDatabase() {
  if (isConnected) {
    console.log('MongoDB already connected')
    return true
  }

  try {
    const mongoUri = config.mongoUri
    console.log('Connecting to MongoDB...')

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      connectTimeoutMS: 10000,
    })

    isConnected = true
    console.log('MongoDB connected successfully')

    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
      isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...')
      isConnected = false
    })

    return true
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message)
    console.log('⚠️  MongoDB not available - falling back to mock data mode')
    
    // Disable buffering so queries fail immediately instead of hanging
    mongoose.set('bufferCommands', false)
    
    isConnected = false
    return false
  }
}

export { mongoose }
