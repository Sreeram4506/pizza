import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { get } from 'https'

const urls = [
  'https://assets.mixkit.co/videos/42469/42469-720.mp4',
  'https://assets.mixkit.co/videos/1669/1669-720.mp4',
]

const outputPath = './public/pizza-hero.mp4'

async function downloadWithHttps(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://mixkit.co/',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://mixkit.co',
      }
    }

    const file = createWriteStream(outputPath)
    
    const request = get(url, options, (response) => {
      console.log(`Status: ${response.statusCode} for ${url}`)
      
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        console.log('Redirecting to:', response.headers.location)
        resolve(downloadWithHttps(response.headers.location))
        return
      }
      
      if (response.statusCode !== 200) {
        file.close()
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }

      let downloaded = 0
      response.on('data', (chunk) => {
        downloaded += chunk.length
        process.stdout.write(`\rDownloaded: ${(downloaded / 1024 / 1024).toFixed(2)} MB`)
      })

      pipeline(response, file)
        .then(() => {
          console.log(`\n✅ Downloaded ${(downloaded / 1024 / 1024).toFixed(2)} MB to ${outputPath}`)
          resolve(true)
        })
        .catch(reject)
    })

    request.on('error', reject)
    request.setTimeout(60000, () => {
      request.destroy()
      reject(new Error('Timeout'))
    })
  })
}

console.log('Downloading pizza video...')

let success = false
for (const url of urls) {
  try {
    console.log(`Trying: ${url}`)
    await downloadWithHttps(url)
    success = true
    break
  } catch (err) {
    console.log(`Failed: ${err.message}`)
  }
}

if (!success) {
  console.log('All URLs failed.')
  process.exit(1)
}
