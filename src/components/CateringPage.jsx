import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function CateringPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    eventTime: '',
    guestsCount: '',
    eventType: 'corporate',
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
      const res = await fetch('/api/catering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success("Inquiry sent! We'll contact you soon.")
        setFormData({
          name: '',
          email: '',
          phone: '',
          eventDate: '',
          eventTime: '',
          guestsCount: '',
          eventType: 'corporate',
          notes: ''
        })
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to submit inquiry')
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
        <h1 className="text-4xl md:text-6xl font-display font-black text-[#1A1410] mb-4">
          Elevate Your Event
        </h1>
        <p className="text-[#9B8D74] text-lg font-medium max-w-2xl mx-auto">
          From corporate lunches to wedding celebrations, bring the authentic wood-fired taste of Pizza Blast to your special occasion.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-[2.5rem] border border-[rgba(26,20,16,0.06)] shadow-xl p-8 md:p-12"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Full Name</label>
            <input
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Email Address</label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Phone Number</label>
            <input
              required
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(555) 000-0000"
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Event Type</label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410] appearance-none"
            >
              <option value="corporate">Corporate Event</option>
              <option value="private">Private Party</option>
              <option value="wedding">Wedding</option>
              <option value="other">Other Celebration</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Event Date</label>
            <input
              required
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Expected Time</label>
            <input
              required
              type="time"
              name="eventTime"
              value={formData.eventTime}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Number of Guests</label>
            <input
              required
              type="number"
              name="guestsCount"
              value={formData.guestsCount}
              onChange={handleChange}
              placeholder="e.g. 50"
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Tell us about your event dietary requirements, or specific requests..."
              rows={4}
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410] resize-none"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="md:col-span-2 w-full py-5 bg-[#1A1410] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Submitting...' : 'Send Inquiry'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
