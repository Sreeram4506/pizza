import fs from 'fs'
import path from 'path'
import { describe, expect, it } from '@jest/globals'

describe('Vite production config', () => {
  it('does not use custom manual chunk splitting that can break the React runtime in production', () => {
    const configPath = path.resolve(process.cwd(), 'vite.config.js')
    const configSource = fs.readFileSync(configPath, 'utf8')

    expect(configSource).not.toMatch(/manualChunks\s*\(/)
  })
})
