import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'pizza-blast-secret-2024'

export const verifyCustomer = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Authentication required' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.customerId = decoded.customerId || decoded.id
    req.customerEmail = decoded.email
    req.customerRole = decoded.role
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const optionalVerifyCustomer = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next()

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.customerId = decoded.customerId || decoded.id
    req.customerEmail = decoded.email
    req.customerRole = decoded.role
    next()
  } catch (err) {
    // If token is invalid, we don't throw error for optional auth, 
    // but we can log it for debugging
    next()
  }
}

export const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    console.log('[AUTH] verifyAdmin failed: No token provided')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role !== 'admin') {
      console.log('[AUTH] verifyAdmin failed: Not an admin')
      return res.status(403).json({ error: 'Admin access required' })
    }
    req.user = decoded
    next()
  } catch (err) {
    console.error('[AUTH] verifyAdmin failed: Invalid token', err.message)
    res.status(401).json({ error: 'Invalid token' })
  }
}
