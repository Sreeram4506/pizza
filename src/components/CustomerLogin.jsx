import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function CustomerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('customerToken', data.token)
        navigate('/')
      } else {
        setError(data.error || 'Login failed')
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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-tomato-500/5 rounded-full blur-[100px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-basil-500/5 rounded-full blur-[100px] -ml-64 -mb-64" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-crust-100 rounded-[3rem] p-12 shadow-crust relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-tomato-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-tomato-600/20 mb-6 group cursor-default">
            <motion.span whileHover={{ rotate: 20 }}>🍕</motion.span>
          </div>
          <h2 className="font-display font-black text-4xl text-wood-800 tracking-tight uppercase">Welcome Back</h2>
          <p className="text-xs text-wood-400 font-bold uppercase tracking-widest mt-2">Sign in to track your slices</p>
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
              {loading ? 'Authenticating...' : 'Sign In'}
            </motion.button>
          </div>
        </form>

        <div className="mt-12 text-center border-t border-crust-100 pt-10">
          <p className="text-wood-400 text-[10px] font-black uppercase tracking-[0.2em]">
            New to Pizza Blast?{' '}
            <Link to="/register" className="text-tomato-600 hover:text-tomato-700 decoration-2 underline-offset-4 hover:underline ml-1">Join the family</Link>
          </p>
          <div className="mt-6">
            <Link to="/admin/login" className="text-[10px] text-wood-300 font-bold uppercase tracking-widest hover:text-wood-500 transition-colors">Admin Portal &rarr;</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
