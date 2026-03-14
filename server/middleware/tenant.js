import { Tenant } from '../models/Tenant.js'

export async function extractTenant(req, res, next) {
  try {
    // Get full hostname from header
    const hostname = (req.headers.host || req.hostname).split(':')[0].toLowerCase()

    // Skip for localhost (dev), main domain, or API health checks
    const isBaseDomain = hostname === 'localhost' ||
      hostname === 'www.pizzablast.com' ||
      hostname === 'pizzablast.com' ||
      hostname === 'www.indraam.com' ||
      hostname === 'indraam.com' ||
      hostname.includes('onrender.com') ||
      hostname.includes('vercel.app')

    if (isBaseDomain) {
      req.tenant = null
      req.tenantId = null
      req.isBaseDomain = true
      return next()
    }

    req.isBaseDomain = false

    // Find tenant by custom domain
    let tenant = await Tenant.findOne({
      customDomain: hostname,
      isActive: true
    })

    // Fallback: If no custom domain, check if it's a subdomain (optional support)
    if (!tenant) {
      const subdomain = hostname.split('.')[0]
      tenant = await Tenant.findOne({
        subdomain: subdomain.toLowerCase(),
        isActive: true
      })
    }

    if (!tenant) {
      return res.status(404).json({
        error: 'Restaurant not found',
        message: `No restaurant found for domain: ${hostname}`
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
  // Allow requests without tenant on localhost for development
  const hostname = req.headers.host || req.hostname
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1')

  if (!req.tenant && !isLocal && !req.isBaseDomain) {
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
