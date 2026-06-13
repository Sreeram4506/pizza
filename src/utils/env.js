import {
  normalizeEnvironmentBaseUrl,
  resolveApiUrl as resolveApiPath,
  patchFetchForEnvironment as patchFetchWithBase
} from './urlHelpers'

function getViteEnv() {
  if (typeof globalThis !== 'undefined' && globalThis.__VITE_ENV__) {
    return globalThis.__VITE_ENV__
  }

  return {}
}

export function getApiBaseUrl(env = getViteEnv()) {
  const isProd = env?.PROD === true
  const configuredApiUrl = normalizeEnvironmentBaseUrl(env?.VITE_API_URL || '', {
    isProd
  })

  if (configuredApiUrl) {
    return configuredApiUrl
  }

  if (isProd) {
    return normalizeEnvironmentBaseUrl('https://pizza-backend.onrender.com', { isProd: true })
  }

  return ''
}

export function getWebSocketUrl(env = getViteEnv()) {
  let wsUrl = ''

  wsUrl = normalizeEnvironmentBaseUrl(env?.VITE_WS_URL || '', {
    isProd: env?.PROD === true
  })

  if (!wsUrl) {
    const apiUrl = getApiBaseUrl(env)
    if (apiUrl) {
      wsUrl = apiUrl.replace(/^http/, 'ws')
    }
  }

  if (!wsUrl && typeof window !== 'undefined') {
    wsUrl = window.location.origin
  }

  return wsUrl
}

export function resolveApiUrl(path = '') {
  return resolveApiPath(path, getApiBaseUrl())
}

export function resolveAssetUrl(assetPath = '') {
  const cleanPath = String(assetPath || '').trim()
  if (!cleanPath) return ''
  if (/^(https?:|data:|blob:)/i.test(cleanPath)) return cleanPath

  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) return cleanPath

  return `${apiBaseUrl}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`
}

export function patchFetchForEnvironment(apiBaseUrl = getApiBaseUrl()) {
  patchFetchWithBase(apiBaseUrl)
}
