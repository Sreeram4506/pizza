import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'
import { buildMenuArtworkSvg, slugifyMenuItemName } from '../src/utils/menuArtwork.js'

dotenv.config()

const apiBase = process.env.MENU_BACKFILL_API_BASE || `http://localhost:${process.env.PORT || 5000}`
const adminUsername = process.env.ADMIN_USERNAME
const adminPassword = process.env.ADMIN_PASSWORD
const generatedDir = path.join(process.cwd(), 'server', 'uploads', 'menu', 'generated')

if (!adminUsername || !adminPassword) {
  console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set in the environment to run this script.')
  process.exit(1)
}

function normalizeCategoryId(categoryId) {
  if (!categoryId) return ''
  if (typeof categoryId === 'string') return categoryId
  if (typeof categoryId === 'object' && categoryId._id) return categoryId._id
  return ''
}

async function login() {
  const response = await fetch(`${apiBase}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: adminUsername, password: adminPassword })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Admin login failed: ${response.status} ${error}`)
  }

  const payload = await response.json()
  return payload.token
}

async function fetchMenuItems() {
  const response = await fetch(`${apiBase}/api/menu/items`)

  if (!response.ok) {
    throw new Error(`Unable to fetch menu items: ${response.status}`)
  }

  return response.json()
}

async function updateItem(token, item, imagePath) {
  const response = await fetch(`${apiBase}/api/admin/menu/items/${item._id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: normalizeCategoryId(item.categoryId),
      available: item.available !== false,
      modifiers: JSON.stringify(Array.isArray(item.modifiers) ? item.modifiers : []),
      tags: JSON.stringify(Array.isArray(item.tags) ? item.tags : []),
      dietary: JSON.stringify(item.dietary || {}),
      image: imagePath
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to update ${item.name}: ${response.status} ${error}`)
  }
}

async function main() {
  await fs.mkdir(generatedDir, { recursive: true })

  const items = await fetchMenuItems()
  const missingImageItems = items.filter((item) => !String(item.image || '').trim())

  if (missingImageItems.length === 0) {
    console.log('No menu items are missing images.')
    return
  }

  const token = await login()
  const results = []

  for (const item of missingImageItems) {
    const slug = slugifyMenuItemName(item.name || item._id)
    const fileName = `${slug}.svg`
    const absolutePath = path.join(generatedDir, fileName)
    const relativePath = `/uploads/menu/generated/${fileName}`
    const svg = buildMenuArtworkSvg(item)

    await fs.writeFile(absolutePath, svg, 'utf8')
    await updateItem(token, item, relativePath)
    results.push({ name: item.name, image: relativePath })
  }

  console.log(JSON.stringify({ updated: results.length, items: results }, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
