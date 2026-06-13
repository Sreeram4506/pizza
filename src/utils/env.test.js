import { normalizeEnvironmentBaseUrl, patchFetchForEnvironment } from './urlHelpers'

describe('normalizeEnvironmentBaseUrl', () => {
  test('ignores localhost backend URLs in production builds', () => {
    expect(normalizeEnvironmentBaseUrl('http://localhost:5070', { isProd: true })).toBe('')
  })

  test('keeps a real remote backend URL in production', () => {
    expect(normalizeEnvironmentBaseUrl('https://pizza-backend.onrender.com', { isProd: true })).toBe('https://pizza-backend.onrender.com')
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
