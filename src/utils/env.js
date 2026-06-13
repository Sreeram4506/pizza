import {
  normalizeEnvironmentBaseUrl,
  resolveApiUrl as resolveApiPath,
  patchFetchForEnvironment as patchFetchWithBase
} from './urlHelpers'

export function getApiBaseUrl() {
  if (typeof import.meta !== 'undefined') {
    return normalizeEnvironmentBaseUrl(import.meta.env?.VITE_API_URL || '', {
      isProd: import.meta.env?.PROD === true
    })
  }

  return ''
}

export function getWebSocketUrl() {
  let wsUrl = ''

  if (typeof import.meta !== 'undefined') {
    wsUrl = normalizeEnvironmentBaseUrl(import.meta.env?.VITE_WS_URL || '', {
      isProd: import.meta.env?.PROD === true
    })
  }

  if (!wsUrl) {
    const apiUrl = getApiBaseUrl()
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
