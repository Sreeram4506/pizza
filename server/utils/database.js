import mongoose from 'mongoose'
import { config } from '../config.js'

let isConnected = false

export async function connectDatabase() {
  if (isConnected) {
    console.log('MongoDB already connected')
    return
  }

  try {
    const mongoUri = config.mongoUri
    console.log('Connecting to MongoDB...')

    await mongoose.connect(mongoUri, {
      // Connection options removed as they're deprecated in newer versions
    })

    isConnected = true
    console.log('MongoDB connected successfully')

    // Handle connection errors
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...')
      isConnected = false
      setTimeout(() => {
        connectDatabase()
      }, 5000)
    })

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message)
    console.log('⚠️  MongoDB not available - some features will be limited')
    console.log('Please ensure MongoDB is running or install MongoDB Community Server')

    // Don't exit the process - allow the app to run with limited functionality
    isConnected = false
  }
}

export { mongoose }
