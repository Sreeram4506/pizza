import rateLimit from 'express-rate-limit'

// Applies to login/credential-guessing endpoints - keeps the window tight
// since legitimate users rarely fail login more than a handful of times.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
})

// Slightly more permissive - covers registration which can have more
// legitimate retries (validation errors, duplicate email, etc).
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
})
