import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'

export default function DiningPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guestsCount: 2,
    notes: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success("Table booked! We'll see you soon.")
        setFormData({
          name: '',
          email: '',
          phone: '',
          date: '',
          time: '',
          guestsCount: 2,
          notes: ''
        })
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to book table')
      }
    } catch (err) {
      toast.error('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-ember-600 block mb-4">Reservations</span>
        <h1 className="text-4xl md:text-6xl font-serif-1947 font-black text-[#1A1410] mb-4">
          Reserve Your Table
        </h1>
        <p className="text-[#9B8D74] text-lg font-body max-w-2xl mx-auto">
          Experience the art of authentic artisan pizza in the heart of our kitchen at <span className="text-ember-500 font-bold">{settings?.restaurantName || 'Mustang Pizza'}</span>. Book your spot today.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="glass-panel-strong glass-highlight-ring rounded-[3rem] p-8 md:p-12 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl pointer-events-none font-serif-1947 italic">{settings?.restaurantName?.[0] || 'M'}</div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Host Name</label>
            <input
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Email</label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Phone</label>
            <input
              required
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(000) 000-0000"
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Date</label>
            <input
              required
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Time</label>
            <input
              required
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Number of Guests</label>
            <input
              required
              type="number"
              min="1"
              max="20"
              name="guestsCount"
              value={formData.guestsCount}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Special Requests</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any allergies or celebrations we should know about?"
              rows={4}
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410] resize-none"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="md:col-span-2 w-full py-5 glass-button-dark text-white rounded-2xl font-body text-[10px] font-black uppercase tracking-[0.25em] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Booking...' : 'Confirm Table Reservation'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
