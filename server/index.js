import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createServer } from 'http'
import { Server } from 'socket.io'
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
import { config } from './config.js'
import { connectDatabase } from './utils/database.js'
import { runCleanup } from './utils/cleanup.js'
import { extractTenant, requireTenant } from './middleware/tenant.js'
import { verifyCustomer } from './middleware/auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Make io accessible to routes
app.set('io', io)

// Connect to MongoDB
connectDatabase().then(() => {
  // Run one-time cleanup to fix typos and remove placeholders
  runCleanup()
})

// Health check for Deployment
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

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
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json())

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Fallback for missing upload files — redirect to a placeholder instead of 404
app.use('/uploads', (req, res) => {
  res.redirect('https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?w=600&q=80')
})

// Tenant extraction middleware
app.use(extractTenant)

// Public routes (with optional tenant)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/auth', authRoutes)

// Protected admin routes (require tenant)
app.use('/api/customers', requireTenant, customerRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/cart', requireTenant, verifyCustomer, cartRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/delivery', requireTenant, deliveryRoutes)

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
