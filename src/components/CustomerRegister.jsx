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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('customerToken', data.token)
        navigate('/')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Server unreachable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mozzarella-100 selection:bg-tomato-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-tomato-500/5 rounded-full blur-[100px] -ml-64 -mt-64" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-basil-500/5 rounded-full blur-[100px] -mr-64 -mb-64" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white border border-crust-100 rounded-[3rem] p-12 shadow-crust relative z-10 my-20"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-tomato-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-tomato-600/20 mb-6 group cursor-default">
            <motion.span whileHover={{ rotate: 20 }}>🍕</motion.span>
          </div>
          <h2 className="font-display font-black text-4xl text-wood-800 tracking-tight uppercase">Join the Family</h2>
          <p className="text-xs text-wood-400 font-bold uppercase tracking-widest mt-2">Slices, rewards, and more</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-4 bg-tomato-50 border border-tomato-100 text-tomato-600 mb-8 rounded-2xl text-xs font-black uppercase tracking-widest text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-wood-400 ml-4">Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tony Pepperoni"
                className="w-full px-6 py-4 rounded-[1.5rem] bg-mozzarella-100 border-none text-wood-800 placeholder-wood-300 outline-none focus:ring-2 focus:ring-tomato-600/20 transition-all font-bold"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-wood-400 ml-4">Phone Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-6 py-4 rounded-[1.5rem] bg-mozzarella-100 border-none text-wood-800 placeholder-wood-300 outline-none focus:ring-2 focus:ring-tomato-600/20 transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-wood-400 ml-4">Email Address</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-8 py-5 rounded-[2rem] bg-mozzarella-100 border-none text-wood-800 placeholder-wood-300 outline-none focus:ring-2 focus:ring-tomato-600/20 transition-all font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-wood-400 ml-4">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-8 py-5 rounded-[2rem] bg-mozzarella-100 border-none text-wood-800 placeholder-wood-300 outline-none focus:ring-2 focus:ring-tomato-600/20 transition-all font-bold"
              required
            />
          </div>

          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-6 bg-tomato-600 text-white font-black text-lg rounded-[2rem] hover:bg-tomato-700 transition-all shadow-xl shadow-tomato-600/20 uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Get Started'}
            </motion.button>
          </div>
        </form>

        <div className="mt-12 text-center border-t border-crust-100 pt-10">
          <p className="text-wood-400 text-[10px] font-black uppercase tracking-[0.2em]">
            Already have an account?{' '}
            <Link to="/login" className="text-tomato-600 hover:text-tomato-700 decoration-2 underline-offset-4 hover:underline ml-1">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
