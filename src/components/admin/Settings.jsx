import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSettings } from '../../context/SettingsContext'

export default function Settings() {
  const { settings: contextSettings, setSettings: setGlobalSettings, loading: contextLoading } = useSettings()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  
  console.log('Settings: setGlobalSettings function:', typeof setGlobalSettings)
  
  // Local state for form to avoid issues with context loading
  const [settings, setSettings] = useState({
    restaurantName: 'Pizza Blast',
    email: 'contact@pizzablast.com',
    phone: '+1 (555) 123-4567',
    address: '123 Pizza Plaza, New York, NY 10001',
    currency: 'USD',
    timezone: 'America/New_York'
  })

  // Update local state when context settings are loaded
  useEffect(() => {
    if (contextSettings && !contextLoading) {
      setSettings(contextSettings)
    }
  }, [contextSettings, contextLoading])

  const validateForm = () => {
    const errors = {}
    
    // Restaurant name validation
    if (!settings.restaurantName.trim()) {
      errors.restaurantName = 'Restaurant name is required'
    } else if (settings.restaurantName.trim().length < 2) {
      errors.restaurantName = 'Restaurant name must be at least 2 characters'
    } else if (settings.restaurantName.trim().length > 50) {
      errors.restaurantName = 'Restaurant name must be less than 50 characters'
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!settings.email.trim()) {
      errors.email = 'Email is required'
    } else if (!emailRegex.test(settings.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    // Phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!settings.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!phoneRegex.test(settings.phone)) {
      errors.phone = 'Please enter a valid phone number'
    } else if (settings.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Phone number must have at least 10 digits'
    }
    
    // Address validation
    if (!settings.address.trim()) {
      errors.address = 'Address is required'
    } else if (settings.address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field, value) => {
    setSettings({ ...settings, [field]: value })
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' })
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    // Validate form before saving
    if (!validateForm()) {
      setError('Please fix the validation errors below')
      return
    }
    
    setLoading(true)
    setError('')
    
    console.log('Settings: Attempting to save:', settings)
    
    try {
      const token = localStorage.getItem('adminToken')
      console.log('Settings: Using token:', token ? 'present' : 'missing')
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })
      
      console.log('Settings: Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Settings: Save successful, received:', data)
        setSettings(data)
        console.log('Settings: About to call setGlobalSettings with:', data)
        setGlobalSettings(data) // Update global context
        console.log('Settings: Called setGlobalSettings')
        setError('')
        // Show success message
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMsg.textContent = 'Settings saved successfully! Changes are now live on the website.'
        document.body.appendChild(successMsg)
        
        // Remove message after 3 seconds
        setTimeout(() => {
          document.body.removeChild(successMsg)
        }, 3000)
      } else {
        const errorData = await response.json()
        console.error('Settings: Save failed:', errorData)
        setError('Failed to save settings')
      }
    } catch (err) {
      console.error('Settings: Save error:', err)
      setError('Error saving settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-black text-white">Settings</h2>
        <p className="text-wood-400 mt-1">Manage your restaurant preferences</p>
        {error && (
          <div className="p-3 bg-tomato-100 text-tomato-700 rounded-lg mb-4">
            {error}
          </div>
        )}
      </div>

      {contextLoading ? (
        <div className="bg-wood-800 rounded-xl p-6 border border-wood-700 max-w-2xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tomato-600 mx-auto"></div>
          <p className="text-wood-400 mt-4">Loading settings...</p>
        </div>
      ) : (

      <form onSubmit={handleSave} className="bg-wood-800 rounded-xl p-6 border border-wood-700 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-wood-300 mb-1">Restaurant Name</label>
            <input
              type="text"
              value={settings.restaurantName}
              onChange={(e) => handleInputChange('restaurantName', e.target.value)}
              className={`w-full px-4 py-2 bg-wood-700 border rounded-lg text-white focus:border-tomato-500 outline-none ${
                validationErrors.restaurantName 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-wood-600'
              }`}
            />
            {validationErrors.restaurantName && (
              <p className="mt-1 text-sm text-red-400">{validationErrors.restaurantName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-wood-300 mb-1">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-2 bg-wood-700 border rounded-lg text-white focus:border-tomato-500 outline-none ${
                  validationErrors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-wood-600'
                }`}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-wood-300 mb-1">Phone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-4 py-2 bg-wood-700 border rounded-lg text-white focus:border-tomato-500 outline-none ${
                  validationErrors.phone 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-wood-600'
                }`}
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-wood-300 mb-1">Address</label>
            <textarea
              value={settings.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`w-full px-4 py-2 bg-wood-700 border rounded-lg text-white focus:border-tomato-500 outline-none ${
                validationErrors.address 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-wood-600'
              }`}
              rows={2}
            />
            {validationErrors.address && (
              <p className="mt-1 text-sm text-red-400">{validationErrors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-wood-300 mb-1">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-wood-300 mb-1">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="px-6 py-3 bg-tomato-600 text-white rounded-lg font-medium hover:bg-tomato-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </div>
      </form>
      )}
    </div>
  )
}
