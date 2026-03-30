import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import menuRoutes from './routes/menu.js'
import orderRoutes from './routes/orders.js'
import aiRoutes from './routes/ai.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import customerRoutes from './routes/customers.js'
import analyticsRoutes from './routes/analytics.js'
import cartRoutes from './routes/cart.js'
import paymentRoutes from './routes/payments.js'
import deliveryRoutes from './routes/delivery.js'
import cateringRoutes from './routes/catering.js'
import reservationRoutes from './routes/reservations.js'
import webhookRoutes from './routes/webhooks.js'
import { config } from './config.js'
import { connectDatabase } from './utils/database.js'
import { runCleanup } from './utils/cleanup.js'
import { extractTenant, requireTenant } from './middleware/tenant.js'
import { verifyCustomer } from './middleware/auth.js'
import { validateEnv } from './utils/envValidator.js'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import compression from 'compression'
import morgan from 'morgan'
import errorHandler, { AppError } from './middleware/error.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const httpServer = createServer(app)

// Validate environment variables
validateEnv()

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow no-origin requests (same-origin, mobile apps)
      if (!origin) return callback(null, true)
      const allowed = !origin || origin.includes('localhost') || origin.includes('vercel.app') || origin.includes('onrender.com') || origin === process.env.FRONTEND_URL
      callback(null, allowed)
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// Make io accessible to routes
app.set('io', io)

// Connect to MongoDB
connectDatabase().then((success) => {
  if (success) {
    // Run one-time cleanup to fix typos and remove placeholders
    runCleanup()
  }
})

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))

// Development logging
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'))
}

// Limit requests from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again in 15 minutes!'
  }
})
app.use('/api', limiter)

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '1MB' })) // Increased from 10kb to 1MB for campaign data
app.use((req, res, next) => {
  console.log(`📡 [REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Compress responses
app.use(compression())

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    const hostname = new URL(origin).hostname
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
    const isAllowedDomain = origin === config.frontendUrl || 
                           origin.includes('pizza-ruby.vercel.app') ||
                           origin.includes('vercel.app') || 
                           origin.includes('onrender.com')
    
    if (isLocal || isAllowedDomain || process.env.NODE_ENV !== 'production') {
      callback(null, true)
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// Health check for Deployment
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV || 'development'
  })
})

// Root health check for Render uptime monitoring
app.get('/health', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).send("OK")
  } else {
    res.status(503).send("Service Unavailable: Database Disconnected")
  }
})

// Root API route
app.get('/', (req, res) => {
  res.send('API Running')
})



// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Fallback for missing upload files — redirect to a placeholder instead of 404
// 3) DYNAMIC STATIC FILE SERVING (Fine-tuned for Scalability)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')), (req, res, next) => {
  // FALLBACK: If file doesn't exist, redirect to a high-quality placeholder
  res.redirect('https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?w=600&q=80')
})

// 4) SECURITY: Scaling protection for tracking endpoints
const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 tracking requests per window
  message: { error: 'Too many tracking attempts from this IP, please try again after 15 minutes' }
})

app.use('/api/orders/track', trackingLimiter)
app.use('/api/orders/tracking', trackingLimiter)
app.use('/api/orders/track-by-phone', trackingLimiter)

// Tenant extraction middleware
app.use(extractTenant)

// Public routes (with optional tenant)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/catering', cateringRoutes)
app.use('/api/reservations', reservationRoutes)

// Protected admin routes (require tenant)
app.use('/api/customers', requireTenant, customerRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/cart', requireTenant, verifyCustomer, cartRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/delivery', requireTenant, deliveryRoutes)
app.use('/api/webhooks', webhookRoutes)

// Handle 404 for API routes
app.all('/api/*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

// Global Error Handling Middleware
app.use(errorHandler)

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Handle admin joining for order notifications
  socket.on('join-admin', () => {
    socket.join('admin:orders')
    console.log(`Socket ${socket.id} joined admin:orders room`)
  })

  socket.on('join-tenant', (tenantId) => {
    socket.join(`tenant:${tenantId}`)
    console.log(`Socket ${socket.id} joined tenant: ${tenantId}`)
  })

  socket.on('join-order', (orderId) => {
    socket.join(`order:${orderId}`)
    console.log(`Socket ${socket.id} joined order: ${orderId}`)
  })

  socket.on('join-customer', (customerId) => {
    socket.join(`customer:${customerId}`)
    console.log(`Socket ${socket.id} joined customer: ${customerId}`)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})


// NOTE: Frontend is served by Vercel — no static file serving needed here.
// The backend only handles API and WebSocket requests.


const PORT = config.port

httpServer.listen(PORT, () => {
  const keySet = config.nvidiaApiKey ? 'YES ✓' : 'NO ✗'
  console.log(`Pizza Blast API running on http://localhost:${PORT} | NVIDIA Key: ${keySet}`)
  console.log(`WebSocket server ready for real-time updates`)
})
