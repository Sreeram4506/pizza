import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load .env BEFORE config.js reads process.env
// NOTE: In ESM, static imports are hoisted — so we can't rely on top-level
// dotenv.config() to run before config.js module initializes.
// Solution: config.js uses getters to read lazily at call time.
const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env') })

export const config = {
  get port() { return process.env.PORT || 5000 },
  get mongoUri() { return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pizzablast' },
  get nvidiaApiKey() { return process.env.NVIDIA_API_KEY },
  get JWT_SECRET() { return process.env.JWT_SECRET || 'pizza-blast-secret-2024' },
  get adminUsername() { return process.env.ADMIN_USERNAME || 'admin' },
  get adminPassword() { return process.env.ADMIN_PASSWORD || 'password123' },
  get stripeSecretKey() { return process.env.STRIPE_SECRET_KEY },
  get stripePublishableKey() { return process.env.STRIPE_PUBLISHABLE_KEY },
  get smtpHost() { return process.env.SMTP_HOST },
  get smtpPort() { return Number(process.env.SMTP_PORT) || 587 },
  get smtpUser() { return process.env.SMTP_USER },
  get smtpPass() { return process.env.SMTP_PASS },
  get smtpFrom() { return process.env.SMTP_FROM || '"Pizza Blast" <order@pizzablast.com>' },
  get brevoApiKey() { return process.env.BREVO_API_KEY || process.env.SMTP_PASS },
  get adminEmail() { return process.env.ADMIN_EMAIL || 'sreerammulukuri6@gmail.com' },
}
