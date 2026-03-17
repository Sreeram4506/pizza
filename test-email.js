import { sendMarketingEmail } from './server/utils/email.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, './.env') })

async function test() {
  console.log('Testing sendMarketingEmail...')
  console.log('API KEY:', process.env.BREVO_API_KEY ? 'Set' : 'Missing')
  
  try {
    const result = await sendMarketingEmail(
      'sreerammulukuri6@gmail.com',
      'Test Campaign',
      'Hello {{customer_name}}, this is a test from the script!',
      'Sreeram',
      'promotion'
    )
    console.log('Result:', result)
  } catch (err) {
    console.error('Test Failed:', err)
  }
}

test()
