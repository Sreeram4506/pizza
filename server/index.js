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
const frontendUrl = process.env.FRONTEND_URL
const vercelFrontendUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || frontendUrl || vercelFrontendUrl || 'http://localhost:5173',
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

/**
 * Configure CORS
 * Note: deployed frontend is on Vercel, and your browser errors show that OPTIONS/preflight and
 * Access-Control-Allow-Origin are not being returned reliably for the deployed origin.
 */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',

  // Deployed Vercel frontend (update if your domain changes)
  'https://pizza-ruby.vercel.app',

  // Configured via env (if present)
  frontendUrl,
  vercelFrontendUrl
].filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) return callback(null, true)

    // During local dev / non-production, be permissive
    if (process.env.NODE_ENV !== 'production') return callback(null, true)

    // Block otherwise
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}

// Ensure preflight requests are handled
app.options('*', cors(corsOptions))

app.use(cors(corsOptions))
app.use(express.json())

// Health check for Deployment
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

// Root health check for Render uptime monitoring
app.get('/health', (req, res) => {
  res.status(200).send("OK")
})

// Root API route
app.get('/', (req, res) => {
  res.send('API Running')
})



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
