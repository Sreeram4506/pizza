import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const email = state?.email || localStorage.getItem('reset_email') || ''

  // Persist email in case of refresh
  if (state?.email) {
    localStorage.setItem('reset_email', state.email)
  }

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: verify otp, 2: reset password
  const [resetToken, setResetToken] = useState('')

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })
      const data = await res.json()
      if (res.ok) {
        setResetToken(data.resetToken)
        setStep(2)
        toast.success('Code verified!')
      } else {
        toast.error(data.error || 'Invalid OTP')
      }
    } catch (err) {
      toast.error('Connection error')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match')
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        navigate('/login')
      } else {
        toast.error(data.error || 'Failed to reset password')
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
            {step === 1 ? 'Verify Code' : 'New Password'}
          </h1>
          <p className="text-[#9B8D74] font-medium">
            {step === 1 
              ? `We sent a code to ${email}`
              : 'Secure your account with a new password.'
            }
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">6-Digit Code</label>
              <input
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-black text-center text-2xl tracking-[0.5em] text-[#1A1410]"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-5 bg-[#1A1410] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">New Password</label>
              <input
                required
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest px-1">Confirm Password</label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-[#F5F3EF] rounded-2xl border border-transparent focus:border-ember-500/20 focus:bg-white outline-none transition-all font-medium text-[#1A1410]"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-5 bg-[#1A1410] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </motion.button>
          </form>
        )}

        <div className="mt-8 text-center text-sm font-medium text-[#9B8D74]">
          Changed your mind?{' '}
          <button onClick={() => navigate('/login')} className="text-[#1A1410] font-bold hover:underline">
            Back to Log In
          </button>
        </div>
      </motion.div>
    </div>
  )
}
