import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __serverDir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__serverDir, '../.env') })
