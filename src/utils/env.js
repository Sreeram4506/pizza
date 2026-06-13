import {
  trimTrailingSlash,
  resolveApiUrl as resolveApiPath,
  patchFetchForEnvironment as patchFetchWithBase
} from './urlHelpers'

export function getApiBaseUrl() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return trimTrailingSlash(import.meta.env.VITE_API_URL)
  }

  return ''
}

export function getWebSocketUrl() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) {
    return trimTrailingSlash(import.meta.env.VITE_WS_URL)
  }

  const apiUrl = getApiBaseUrl()
  if (apiUrl) {
    return apiUrl.replace(/^http/, 'ws')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
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
