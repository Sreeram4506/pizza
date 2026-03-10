import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 30000)
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                signal: controller.signal
            })
            clearTimeout(timeout)
            const data = await res.json()
            if (res.ok) {
                localStorage.setItem('adminToken', data.token)
                navigate('/admin')
            } else {
                setError(data.error || 'Login failed')
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                setError('Server is waking up, please try again in a moment...')
            } else {
                setError('Something went wrong. Is the server running?')
            }
        } finally {
            setLoading(false)
        }
    }

    const inputClass = "w-full px-5 py-4 bg-white border border-[rgba(26,20,16,0.1)] text-[#1A1410] placeholder-[#9B8D74]/50 outline-none focus:border-ember-500/40 transition-all font-body text-sm rounded-xl"

    return (
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center section-grain">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-ember-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-noir-850 border border-[rgba(242,235,217,0.06)] p-10 md:p-12 relative z-10"
                style={{ borderRadius: '2px' }}
            >
                <div className="text-center mb-10">
                    <span className="font-sans text-[9px] tracking-[0.3em] uppercase text-gold-400 block mb-4">Management Portal</span>
                    <h1 className="font-sans font-bold text-4xl text-[#1A1410] tracking-tight">Admin Access</h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-ember-500/10 border border-ember-500/20 text-ember-500 text-xs font-sans tracking-wider text-center"
                            style={{ borderRadius: '2px' }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <label className="font-sans text-[10px] tracking-[0.2em] uppercase text-parchment-700 ml-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={inputClass}
                            style={{ borderRadius: '2px' }}
                            placeholder="admin"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-sans text-[10px] tracking-[0.2em] uppercase text-parchment-700 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClass}
                            style={{ borderRadius: '2px' }}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full py-5 bg-ember-500 text-white font-body font-semibold text-sm tracking-[0.15em] uppercase hover:shadow-ember transition-all disabled:opacity-50 rounded-xl"
                        style={{ borderRadius: '2px' }}
                    >
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </motion.button>
                </form>

                <div className="mt-8 p-4 bg-[#F5F3EF] border border-[rgba(26,20,16,0.06)] rounded-xl">
                    <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-parchment-700 text-center mb-2">Default Credentials</p>
                    <p className="text-sm text-parchment-700 text-center font-sans tracking-tight">admin / password123</p>
                </div>

                <p className="text-center font-sans text-[9px] tracking-[0.15em] uppercase text-parchment-700/40 mt-6">
                    Authorized personnel only
                </p>
            </motion.div>
        </div>
    )
}
