import { normalizeEnvironmentBaseUrl, patchFetchForEnvironment } from './urlHelpers'
import { getApiBaseUrl } from './env'

describe('normalizeEnvironmentBaseUrl', () => {
  test('ignores localhost backend URLs in production builds', () => {
    expect(normalizeEnvironmentBaseUrl('http://localhost:5070', { isProd: true })).toBe('')
  })

  test('keeps a real remote backend URL in production', () => {
    expect(normalizeEnvironmentBaseUrl('https://pizza-backend.onrender.com', { isProd: true })).toBe('https://pizza-backend.onrender.com')
  })
})

describe('getApiBaseUrl', () => {
  test('uses the production backend fallback when no Vite API URL is configured', () => {
    expect(getApiBaseUrl({ PROD: true, VITE_API_URL: '' })).toBe('https://pizza-backend.onrender.com')
  })

  test('keeps a configured remote backend URL in production', () => {
    expect(getApiBaseUrl({ PROD: true, VITE_API_URL: 'https://example.com' })).toBe('https://example.com')
  })
})

describe('patchFetchForEnvironment', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('rewrites API requests to the configured backend URL', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true })
    globalThis.fetch = fetchSpy

    patchFetchForEnvironment('https://api.example.com')

    await fetch('/api/health')

    expect(fetchSpy).toHaveBeenCalledWith('https://api.example.com/api/health', undefined)
  })
})
