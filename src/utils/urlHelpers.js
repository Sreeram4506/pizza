export function trimTrailingSlash(value = '') {
  return String(value || '').trim().replace(/\/$/, '')
}

export function isLocalBackendUrl(value = '') {
  const normalized = String(value || '').trim().toLowerCase()

  if (!normalized) return false

  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(normalized)) return true

  try {
    const url = new URL(normalized)
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

export function normalizeEnvironmentBaseUrl(value = '', { isProd = false } = {}) {
  const normalized = trimTrailingSlash(String(value || '').trim())

  if (!normalized) return ''
  if (isProd && isLocalBackendUrl(normalized)) return ''

  return normalized
}

export function isAbsoluteUrl(value = '') {
  return /^(https?:|data:|blob:|mailto:|tel:)/i.test(String(value || ''))
}

export function resolveApiUrl(path = '', apiBaseUrl = '') {
  const cleanPath = String(path || '').trim()
  const baseUrl = trimTrailingSlash(apiBaseUrl)

  if (!cleanPath) return baseUrl || '/api'
  if (isAbsoluteUrl(cleanPath)) return cleanPath

  if (baseUrl) {
    return `${baseUrl}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`
  }

  return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`
}

export function patchFetchForEnvironment(apiBaseUrl = '') {
  if (typeof globalThis === 'undefined' || typeof globalThis.fetch !== 'function') {
    return
  }

  if (globalThis.__pizzaFetchPatched) {
    return
  }

  const originalFetch = globalThis.fetch.bind(globalThis)
  const normalizedBaseUrl = trimTrailingSlash(apiBaseUrl)

  globalThis.fetch = (input, init) => {
    const rawUrl = typeof input === 'string' ? input : input?.url

    if (typeof rawUrl === 'string' && rawUrl.startsWith('/api')) {
      const resolvedUrl = resolveApiUrl(rawUrl, normalizedBaseUrl)

      if (typeof input === 'string') {
        return originalFetch(resolvedUrl, init)
      }

      return originalFetch(new Request(resolvedUrl, input), init)
    }

    return originalFetch(input, init)
  }

  globalThis.__pizzaFetchPatched = true
}
