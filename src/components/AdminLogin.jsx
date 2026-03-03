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

    return (
        <div className="min-h-screen bg-wood-900 text-wood-100 font-light">
            {/* Texture Overlay */}
            <div className="fixed inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/soft_noise.png')]" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-wood-800/90 backdrop-blur-xl rounded-3xl p-10 md:p-12 border border-wood-700 shadow-xl relative z-10 mx-auto mt-20"
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-tomato-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg">
                        🔐
                    </div>
                    <h1 className="text-3xl font-display font-black text-wood-100 tracking-tight">Admin Access</h1>
                    <p className="text-tomato-400 text-sm font-semibold mt-2">Secure Management Portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200 text-center font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-wood-300 uppercase tracking-wide ml-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-5 py-4 rounded-xl bg-mozzarella-50 border border-crust-200 focus:border-tomato-500 focus:ring-2 focus:ring-tomato-200 outline-none text-wood-100 font-medium transition-all placeholder:text-wood-300"
                            placeholder="admin"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-wood-300 uppercase tracking-wide ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 rounded-xl bg-mozzarella-50 border border-crust-200 focus:border-tomato-500 focus:ring-2 focus:ring-tomato-200 outline-none text-wood-800 font-medium transition-all placeholder:text-wood-400"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full py-4 bg-tomato-600 text-white font-bold rounded-xl shadow-lg hover:bg-tomato-700 transition-all disabled:opacity-50 tracking-wide"
                    >
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </motion.button>
                </form>

                <div className="mt-8 p-4 bg-crust-50 rounded-xl border border-crust-100">
                    <p className="text-xs font-semibold text-wood-600 text-center mb-2">Default Credentials</p>
                    <p className="text-sm text-wood-700 text-center font-mono">Username: admin</p>
                    <p className="text-sm text-wood-700 text-center font-mono">Password: password123</p>
                </div>

                <p className="text-center text-xs font-medium text-wood-400 mt-6">
                    Authorized personnel only
                </p>
            </motion.div>
        </div>
    )
}

