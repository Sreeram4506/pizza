import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        navigate('/reset-password', { state: { email } })
      } else {
        toast.error(data.error || 'Failed to send OTP')
      }
    } catch (err) {
      toast.error('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center bg-[#FAFAF8]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] border border-[rgba(26,20,16,0.06)] shadow-xl p-10 sm:p-12"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-black text-[#1A1410] mb-3 uppercase tracking-tight">
            Forgot Password
          </h1>
          <p className="text-[#9B8D74] font-medium">
            Enter your email to receive a 6-digit verification code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full py-5 bg-[#1A1410] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Send Verification Code'}
          </motion.button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-[#9B8D74]">
          Suddenly remembered?{' '}
          <button onClick={() => navigate('/login')} className="text-[#1A1410] font-bold hover:underline">
            Go back to Log In
          </button>
        </div>
      </motion.div>
    </div>
  )
}
