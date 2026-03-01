import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'pizza-blast-secret-2024'

export const verifyCustomer = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Authentication required' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.customerId = decoded.customerId || decoded.id
    req.customerEmail = decoded.email
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}
