import { patchFetchForEnvironment } from './urlHelpers'

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
