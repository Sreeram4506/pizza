import { Tenant } from '../models/Tenant.js'

export async function extractTenant(req, res, next) {
  try {
    // Get subdomain from hostname (e.g., "pizzapalace.pizzablast.com" -> "pizzapalace")
    const hostname = req.headers.host || req.hostname
    const cleanHostname = hostname.split(':')[0] // Remove port if present
    const subdomain = cleanHostname.split('.')[0]
    
    // Skip for localhost, main domain, or API health checks
    if (subdomain === 'localhost' || subdomain === 'www' || subdomain === 'api' || cleanHostname === 'pizzablast.com') {
      // Allow requests without tenant (for admin operations or testing)
      req.tenant = null
      req.tenantId = null
      return next()
    }

    // Find tenant by subdomain
    const tenant = await Tenant.findOne({ 
      subdomain: subdomain.toLowerCase(),
      isActive: true 
    })

    if (!tenant) {
      return res.status(404).json({ 
        error: 'Restaurant not found',
        message: `No restaurant found for subdomain: ${subdomain}`
      })
    }

    // Attach tenant info to request
    req.tenant = tenant
    req.tenantId = tenant._id
    
    next()
  } catch (error) {
    console.error('Tenant extraction error:', error)
    res.status(500).json({ error: 'Failed to identify restaurant' })
  }
}

// Middleware to require tenant (for customer-facing routes)
export function requireTenant(req, res, next) {
  if (!req.tenant) {
    return res.status(400).json({ 
      error: 'Tenant required',
      message: 'This endpoint requires a restaurant subdomain'
    })
  }
  next()
}

// Optional tenant extraction (for routes that work with or without tenant)
export async function optionalTenant(req, res, next) {
  try {
    const hostname = req.headers.host || req.hostname
    const subdomain = hostname.split('.')[0]
    
    if (subdomain === 'localhost' || subdomain === 'www' || subdomain === 'api') {
      req.tenant = null
      req.tenantId = null
      return next()
    }

    const tenant = await Tenant.findOne({ 
      subdomain: subdomain.toLowerCase(),
      isActive: true 
    })

    if (tenant) {
      req.tenant = tenant
      req.tenantId = tenant._id
    }
    
    next()
  } catch (error) {
    console.error('Optional tenant extraction error:', error)
    // Continue without tenant on error
    req.tenant = null
    req.tenantId = null
    next()
  }
}
