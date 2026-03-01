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
}
