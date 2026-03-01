import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'emails'
    const [offerText, setOfferText] = useState('')
    const [offerSubject, setOfferSubject] = useState('Exclusive Pizza Blast Offer! 🍕')
    const [sendingEmail, setSendingEmail] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        const token = localStorage.getItem('adminToken')
        if (!token) return navigate('/admin/login')

        try {
            const res = await fetch('/api/admin/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setOrders(data)
                // also fetch users and analytics
                fetchUsers(token)
                fetchAnalytics(token)
            } else {
                navigate('/admin/login')
            }
        } catch (err) {
            console.error('Fetch failed', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async (token) => {
        try {
            const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
            if (res.ok) setUsers(await res.json())
        } catch (e) { console.warn(e) }
    }

    const fetchAnalytics = async (token) => {
        try {
            const res = await fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` } })
            if (res.ok) setAnalytics(await res.json())
        } catch (e) { console.warn(e) }
    }

    const handleSendOffers = async () => {
        if (!offerText) return
        setSendingEmail(true)
        const token = localStorage.getItem('adminToken')

        // Send to all registered users by default
        const emails = users.map(u => u.email).filter(Boolean)

        try {
            const res = await fetch('/api/admin/send-offers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    emails,
                    subject: offerSubject,
                    message: offerText
                })
            })
            if (res.ok) {
                alert('Offers sent successfully!')
                setOfferText('')
            }
        } catch (err) {
            alert('Failed to send offers')
        } finally {
            setSendingEmail(false)
        }
    }

    const logout = () => {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
    }

    return (
        <div className="min-h-screen bg-wood-900 text-wood-100 font-light">
            {/* Texture Overlay */}
            <div className="fixed inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/soft_noise.png')]" />

            {/* Header */}
            <header className="bg-wood-800/90 backdrop-blur-xl border-b border-wood-700 px-10 py-6 flex items-center justify-between sticky top-0 z-40 relative">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-tomato-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">🍕</div>
                    <div>
                        <h1 className="font-display font-black text-xl text-white tracking-tight">Admin Panel</h1>
                        <p className="text-xs text-tomato-400 font-semibold uppercase tracking-wider">Pizza Blast Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    <nav className="flex items-center bg-wood-700/50 rounded-full p-1 border border-wood-600">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'orders' ? 'bg-tomato-600 text-white shadow-lg' : 'text-wood-300 hover:text-white'}`}
                        >
                            Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('emails')}
                            className={`px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'emails' ? 'bg-tomato-600 text-white shadow-lg' : 'text-wood-300 hover:text-white'}`}
                        >
                            Broadcaster
                        </button>
                    </nav>

                    <button
                        onClick={logout}
                        className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
                    >
                        Exit System
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-12 relative">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-6">
                        <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full shadow-lg" />
                        <p className="text-xs font-bold text-wood-400 uppercase tracking-wider animate-pulse">Syncing Data...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'orders' ? (
                            <motion.div
                                key="orders"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-10"
                            >
                                <div className="flex items-center justify-between mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white tracking-tight mb-2">Queue Management</h2>
                                        <p className="text-wood-400 text-sm">Real-time order tracking and response.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                            <div className="bg-wood-800 border border-wood-700 text-tomato-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                                                {orders.length} ORDERS
                                            </div>
                                            <div className="bg-wood-800 border border-wood-700 text-wood-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                                                {analytics ? `$${analytics.revenue.toFixed(2)} revenue` : 'Revenue: --'}
                                            </div>
                                            <div className="bg-wood-800 border border-wood-700 text-wood-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                                                {users.length} USERS
                                            </div>
                                        </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {orders.map((order, i) => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-brand-card/30 backdrop-blur-sm p-8 rounded-[2.5rem] border border-gray-100 hover:border-brand-gold/20 transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <span className="text-[10px] font-black bg-white/50 px-3 py-1 rounded-full text-slate-500 border border-gray-100 tracking-widest">#{order.id.slice(-6).toUpperCase()}</span>
                                                        <span className={`text-[9px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-full ${order.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                            {order.status}
                                                        </span>
                                                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-auto">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                    <h3 className="font-display font-black text-2xl text-slate-900 tracking-tight uppercase group-hover:text-brand-gold transition-colors">
                                                        {order.items.map(i => `${i.qty}× ${i.name}`).join(', ')}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-8 mt-6">
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-light">
                                                            <span className="text-brand-gold">📍</span> {order.address}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-light">
                                                            <span className="text-brand-gold">📞</span> {order.phone}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                                            <span className="text-brand-gold">🍕</span> {order.type}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-10 pl-10 border-l border-gray-100">
                                                    <div className="text-3xl font-display font-black text-brand-gold tracking-tighter mb-2">
                                                        ${order.items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2)}
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="px-6 py-2 rounded-full bg-white/50 border border-gray-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-brand-gold hover:bg-white/60 transition-all"
                                                    >
                                                        Details
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {orders.length === 0 && (
                                        <div className="text-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-gray-100 text-slate-500">
                                            <div className="text-6xl mb-6 opacity-20">📭</div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Channel Empty</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="emails"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="max-w-2xl mx-auto"
                            >
                                <div className="bg-brand-card/50 backdrop-blur-xl p-12 rounded-[3rem] border border-gray-100 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-[100px] -mr-32 -mt-32" />

                                    <h2 className="text-3xl font-display font-black text-slate-900 mb-3 uppercase tracking-tight">Broadcaster</h2>
                                    <p className="text-gray-500 text-sm mb-12 font-light">Direct engagement with registered customers.</p>

                                    <div className="space-y-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Broadcast Subject</label>
                                            <input
                                                type="text"
                                                value={offerSubject}
                                                onChange={(e) => setOfferSubject(e.target.value)}
                                                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-gray-100 outline-none focus:border-brand-gold/30 text-slate-900 font-light transition-all"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Communication Content</label>
                                            <textarea
                                                rows={8}
                                                value={offerText}
                                                onChange={(e) => setOfferText(e.target.value)}
                                                className="w-full px-6 py-5 rounded-[2rem] bg-white/5 border border-gray-100 outline-none focus:border-brand-gold/30 text-slate-900 font-light resize-none transition-all placeholder:text-gray-400"
                                                placeholder="Compose your premium announcement..."
                                            />
                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSendOffers}
                                            disabled={sendingEmail || !offerText}
                                            className="w-full py-6 bg-gradient-to-r from-brand-gold to-orange-500 text-black font-black rounded-[2rem] shadow-lg shadow-brand-gold/20 disabled:opacity-50 mt-4 uppercase tracking-[0.2em] text-sm"
                                        >
                                            {sendingEmail ? '🚀 Launching Transmission...' : '📣 Broadcast to Users'}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>
        </div>
    )
}
