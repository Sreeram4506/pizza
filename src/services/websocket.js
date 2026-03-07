import { io } from 'socket.io-client'

class WebSocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  connect() {
    if (this.socket?.connected) return

    const url = import.meta.env.VITE_WS_URL || window.location.origin
    console.log('[WS] Connecting to:', url)

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    })

    this.socket.on('connect', () => {
      console.log('[WS] Connected successfully')
      this.emit('connected')
    })

    this.socket.on('disconnect', () => {
      console.log('[WS] Disconnected')
      this.emit('disconnected')
    })

    this.socket.on('error', (error) => {
      console.error('[WS] Error:', error)
      this.emit('error', error)
    })

    // Generic message handler to maintain compatibility with existing emit system
    this.socket.onAny((event, ...args) => {
      console.log(`[WS] Event: ${event}`, args)
      this.emit(event, ...args)
    })
  }

  send(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('[WS] Not connected, event not sent:', event)
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data))
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.listeners.clear()
  }
}

// Create singleton instance
export const wsService = new WebSocketService()
export default wsService
