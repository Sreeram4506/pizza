import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '../../context/SettingsContext'

export default function Settings() {
  const { settings: contextSettings, setSettings: setGlobalSettings, loading: contextLoading } = useSettings()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  const [settings, setSettings] = useState({
    restaurantName: 'Pizza Blast',
    email: 'contact@pizzablast.com',
    phone: '+1 (555) 123-4567',
    address: '123 Pizza Plaza, New York, NY 10001',
    currency: 'USD',
    timezone: 'America/New_York'
  })

  useEffect(() => {
    if (contextSettings && !contextLoading) {
      setSettings(contextSettings)
    }
  }, [contextSettings, contextLoading])

  const validateForm = () => {
    const errors = {}
    if (!settings.restaurantName.trim()) errors.restaurantName = 'Name required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) errors.email = 'Valid email required'
    if (settings.phone.replace(/\D/g, '').length < 10) errors.phone = 'Valid phone required'
    if (!settings.address.trim()) errors.address = 'Address required'

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field, value) => {
    setSettings({ ...settings, [field]: value })
    if (validationErrors[field]) setValidationErrors({ ...validationErrors, [field]: '' })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      setError('Check required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setGlobalSettings(data)

        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[200] font-black text-xs uppercase tracking-widest'
        successMsg.textContent = 'Settings Updated! ✨'
        document.body.appendChild(successMsg)
        setTimeout(() => document.body.removeChild(successMsg), 3000)
      } else {
        setError('Save failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
        <p className="text-xs font-bold text-wood-400 uppercase tracking-widest animate-pulse">Fetching Config...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24 lg:pb-10">
      <div>
        <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">Preferences</h2>
        <p className="text-wood-400 text-sm mt-1">Configure your digital storefront</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-[10px] font-black uppercase tracking-widest text-center"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-5">
        <section className="bg-wood-800 rounded-3xl p-6 sm:p-8 border border-wood-700 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Brand Name</label>
            <input
              type="text"
              value={settings.restaurantName}
              onChange={(e) => handleInputChange('restaurantName', e.target.value)}
              className={`w-full px-5 py-4 bg-wood-700 border-2 rounded-2xl text-white outline-none focus:border-tomato-500 transition-all text-sm font-bold ${validationErrors.restaurantName ? 'border-red-500' : 'border-wood-600'
                }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Support Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-5 py-4 bg-wood-700 border-2 rounded-2xl text-white outline-none focus:border-tomato-500 transition-all text-sm font-bold ${validationErrors.email ? 'border-red-500' : 'border-wood-600'
                  }`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Store Phone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-5 py-4 bg-wood-700 border-2 rounded-2xl text-white outline-none focus:border-tomato-500 transition-all text-sm font-bold ${validationErrors.phone ? 'border-red-500' : 'border-wood-600'
                  }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Physical Address</label>
            <textarea
              value={settings.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`w-full px-5 py-4 bg-wood-700 border-2 rounded-2xl text-white outline-none focus:border-tomato-500 transition-all text-sm font-bold resize-none ${validationErrors.address ? 'border-red-500' : 'border-wood-600'
                }`}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-5 py-4 bg-wood-700 border-2 border-wood-600 rounded-2xl text-white text-sm font-bold outline-none focus:border-tomato-500 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyBmaWxsPSJ3aGl0ZSIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTcgMTBsNSA1IDUtNXoiLz48cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PC9zdmc+')] bg-[length:24px_24px] bg-[right_12px_center] bg-no-repeat"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-5 py-4 bg-wood-700 border-2 border-wood-600 rounded-2xl text-white text-[10px] sm:text-xs font-bold outline-none focus:border-tomato-500 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyBmaWxsPSJ3aGl0ZSIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTcgMTBsNSA1IDUtNXoiLz48cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PC9zdmc+')] bg-[length:24px_24px] bg-[right_12px_center] bg-no-repeat"
              >
                <option value="America/New_York">Eastern</option>
                <option value="America/Chicago">Central</option>
                <option value="America/Denver">Mountain</option>
                <option value="America/Los_Angeles">Pacific</option>
              </select>
            </div>
          </div>
        </section>

        <div className="p-1">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="w-full py-5 bg-tomato-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-tomato-600/20 hover:bg-tomato-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Propagating...' : 'Deploy Changes'}
          </motion.button>
        </div>
      </form>
    </div>
  )
}
