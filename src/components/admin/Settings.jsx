import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '../../context/SettingsContext'
import toast from 'react-hot-toast'

export default function Settings() {
  const { settings: contextSettings, setSettings: setGlobalSettings, loading: contextLoading } = useSettings()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  const [settings, setSettings] = useState({
    restaurantName: 'Charlestown Pizza',
    email: 'hello@charlestown.com',
    phone: '+1 (555) 000-0000',
    address: 'Mediterranean Way, Coastal District',
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
    if (!settings.restaurantName.trim()) errors.restaurantName = 'Required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) errors.email = 'Invalid'
    if (settings.phone.replace(/\D/g, '').length < 10) errors.phone = 'Invalid'
    if (!settings.address.trim()) errors.address = 'Required'

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
        toast.success('Foundational settings updated')
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-amber-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] animate-pulse">Accessing Core Registry</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-700">
      {/* ── Settings Header ─────────────────────── */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-[1px] bg-ember-600" />
          <span className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-ember-600">Core Configuration</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-sans font-bold text-[#1A1410] leading-tight">Preferences</h2>
        <p className="text-[#9B8D74] mt-2 font-medium tracking-tight">Fine-tune your brand's digital presence and foundational logic.</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-600 font-sans text-[9px] font-bold uppercase tracking-widest text-center shadow-sm"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-10">
        <section className="bg-white rounded-[3rem] p-12 border border-[rgba(26,20,16,0.06)] shadow-sm space-y-10">
          <div className="space-y-2">
            <label className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Brand Identity</label>
            <input
              type="text"
              value={settings.restaurantName}
              onChange={(e) => handleInputChange('restaurantName', e.target.value)}
              className={`w-full h-16 px-8 bg-[#FAFAF8] border-2 rounded-2xl text-[#1A1410] outline-none focus:bg-white focus:border-ember-600 transition-all text-lg font-sans font-bold shadow-inner ${validationErrors.restaurantName ? 'border-rose-400' : 'border-[rgba(26,20,16,0.03)]'
                }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Communication Endpoint (Email)</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full h-16 px-8 bg-[#FAFAF8] border-2 rounded-2xl text-[#1A1410] outline-none focus:bg-white focus:border-ember-600 transition-all font-bold shadow-inner ${validationErrors.email ? 'border-rose-400' : 'border-[rgba(26,20,16,0.03)]'
                  }`}
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Direct Line (Phone)</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full h-16 px-8 bg-[#FAFAF8] border-2 rounded-2xl text-[#1A1410] outline-none focus:bg-white focus:border-ember-600 transition-all font-bold shadow-inner ${validationErrors.phone ? 'border-rose-400' : 'border-[rgba(26,20,16,0.03)]'
                  }`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Foundational Physical Location</label>
            <textarea
              value={settings.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`w-full px-8 py-6 bg-[#FAFAF8] border-2 rounded-2xl text-[#1A1410] outline-none focus:bg-white focus:border-ember-600 transition-all font-medium resize-none shadow-inner ${validationErrors.address ? 'border-rose-400' : 'border-[rgba(26,20,16,0.03)]'
                }`}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-2">
              <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Transactional Currency</label>
              <div className="relative">
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full h-16 px-8 bg-[#FAFAF8] border-2 border-[rgba(26,20,16,0.03)] rounded-2xl text-[#1A1410] font-mono text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-ember-600 appearance-none shadow-inner cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-[#9B8D74] text-[10px]">▼</div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Temporal Alignment (Timezone)</label>
              <div className="relative">
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full h-16 px-8 bg-[#FAFAF8] border-2 border-[rgba(26,20,16,0.03)] rounded-2xl text-[#1A1410] font-mono text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-ember-600 appearance-none shadow-inner cursor-pointer"
                >
                  <option value="America/New_York">Eastern</option>
                  <option value="America/Chicago">Central</option>
                  <option value="America/Denver">Mountain</option>
                  <option value="America/Los_Angeles">Pacific</option>
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-[#9B8D74] text-[10px]">▼</div>
              </div>
            </div>
          </div>
        </section>

        <div className="px-2">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full h-20 bg-[#1A1410] text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-black/10 hover:shadow-glow hover:shadow-amber-500/10 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-4"
          >
            {loading ? (
              <span className="flex items-center gap-3 animate-pulse">Synchronizing <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /></span>
            ) : (
              <>Deploy Foundational Changes</>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  )
}
