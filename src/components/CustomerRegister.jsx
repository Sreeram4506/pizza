import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function CustomerRegister() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
        signal: controller.signal
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('customerToken', data.token)
        navigate('/')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Server is waking up, please try again in a moment...')
      } else {
        setError('Server unreachable. Please check your connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-5 py-4 bg-white border border-[rgba(26,20,16,0.1)] text-[#1A1410] placeholder-[#9B8D74]/50 outline-none focus:border-ember-500/40 transition-all font-body text-sm rounded-xl"

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] section-grain">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-ember-500/5 rounded-full blur-[100px] -ml-64 -mt-64" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold-400/5 rounded-full blur-[100px] -mr-64 -mb-64" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-noir-850 border border-[rgba(242,235,217,0.06)] p-12 relative z-10 my-20"
        style={{ borderRadius: '2px' }}
      >
        <div className="text-center mb-10">
          <span className="font-display italic text-3xl text-[#1A1410] block mb-2">
            Pizza<span className="text-ember-500">Blast</span>
          </span>
          <h2 className="font-display italic text-4xl text-[#1A1410] tracking-tight mt-4">Join the Family</h2>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-parchment-700 mt-3">Slices, rewards, and more</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-4 bg-ember-500/10 border border-ember-500/20 text-ember-500 mb-8 text-xs font-mono tracking-widest text-center"
              style={{ borderRadius: '2px' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-parchment-700 ml-1">Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
                style={{ borderRadius: '2px' }}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-parchment-700 ml-1">Phone Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className={inputClass}
                style={{ borderRadius: '2px' }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-parchment-700 ml-1">Email Address</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={inputClass}
              style={{ borderRadius: '2px' }}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-parchment-700 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              style={{ borderRadius: '2px' }}
              required
            />
          </div>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              className="w-full py-5 bg-ember-500 text-white font-body font-semibold text-sm tracking-[0.15em] uppercase hover:shadow-ember transition-all disabled:opacity-50 rounded-xl"
              style={{ borderRadius: '2px' }}
            >
              {loading ? 'Creating Account...' : 'Get Started'}
            </motion.button>
          </div>
        </form>

        <div className="mt-10 text-center border-t border-[rgba(242,235,217,0.06)] pt-8">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-parchment-700">
            Already have an account?{' '}
            <Link to="/login" className="text-ember-500 hover:text-ember-400 ml-1">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
