import { createContext, useContext, useState, useEffect } from 'react'
import wsService from '../services/websocket.js'

const SettingsContext = createContext()

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    restaurantName: 'Pizza Blast',
    email: 'contact@pizzablast.com',
    phone: '+1 (555) 123-4567',
    address: '123 Pizza Plaza, New York, NY 10001',
    currency: 'USD',
    timezone: 'America/New_York'
  })
  const [loading, setLoading] = useState(true)
  const [updateTrigger, setUpdateTrigger] = useState(0)

  const updateSettings = (newSettings) => {
    console.log('SettingsContext: Updating settings:', newSettings)
    setSettings(newSettings)
    setUpdateTrigger(Date.now()) // Force re-render of all consumers
  }

  useEffect(() => {
    // Load settings from public API (no auth needed for basic settings)
    const loadSettings = async () => {
      try {
        console.log('SettingsContext: Loading settings...')
        const response = await fetch('/api/admin/public/settings')
        if (response.ok) {
          const data = await response.json()
          console.log('SettingsContext: Settings loaded:', data)
          setSettings(data)
        } else {
          console.error('SettingsContext: Failed to load settings:', response.status)
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()

    // Connect to WebSocket and listen for real-time setting changes
    wsService.connect()

    const handleSettingsUpdate = (data) => {
      console.log('SettingsContext: Settings updated via WebSocket', data)
      setSettings(data)
      setUpdateTrigger(Date.now())
    }

    wsService.on('settings_updated', handleSettingsUpdate)

    return () => {
      wsService.off('settings_updated', handleSettingsUpdate)
    }
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading, setSettings: updateSettings, updateTrigger }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
