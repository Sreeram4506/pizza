import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { validateEnv } from './utils/envValidator.js'

const __serverDir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__serverDir, '../.env') })

// Must run before any other server module is imported, so that modules
// which read process.env at import time (not just via lazy getters) see
// real values and fail fast instead of silently falling back to defaults.
validateEnv()
