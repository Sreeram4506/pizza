import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
    const { settings } = useSettings()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [activeTab, setActiveTab] = useState('orders')
    const [offerText, setOfferText] = useState('')
    const [offerSubject, setOfferSubject] = useState(`Exclusive ${settings?.restaurantName || 'Pizza Blast'} Offer! 🍕`)
    const [sendingEmail, setSendingEmail] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const navigate = useNavigate()

    useEffect(() => { fetchOrders() }, [])

    const fetchOrders = async () => {
        const token = localStorage.getItem('adminToken')
        if (!token) return navigate('/admin/login')
        try {
            const res = await fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` } })
            if (res.ok) {
                const data = await res.json()
                setOrders(data)
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
        const emails = users.map(u => u.email).filter(Boolean)
        try {
            const res = await fetch('/api/admin/send-offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ emails, subject: offerSubject, message: offerText })
            })
            if (res.ok) {
                toast.success('Offers sent successfully!')
                setOfferText('')
            }
        } catch (err) {
            toast.error('Failed to send offers')
        } finally {
            setSendingEmail(false)
        }
    }

    const logout = () => {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
    }

    return (
        <div className="min-h-screen bg-wood-900 text-wood-100">
            {/* ── Header ───────────────────────────────── */}
            <header className="bg-wood-800/95 backdrop-blur-xl border-b border-wood-700 px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-40">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-tomato-600 rounded-xl flex items-center justify-center text-xl shadow-lg flex-shrink-0">🍕</div>
                    <div className="hidden sm:block">
                        <h1 className="font-display font-black text-base text-white tracking-tight leading-none">Admin Panel</h1>
                        <p className="text-[10px] text-tomato-400 font-semibold uppercase tracking-wider">{settings?.restaurantName || 'Pizza Blast'} Control</p>
                    </div>
                </div>

                {/* Desktop Tab Nav */}
                <nav className="hidden sm:flex items-center bg-wood-700/60 rounded-full p-1 border border-wood-600">
                    {['orders', 'emails'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-tomato-600 text-white shadow-lg' : 'text-wood-300 hover:text-white'
                                }`}
                        >
                            {tab === 'orders' ? '📋 Orders' : '📣 Broadcaster'}
                        </button>
                    ))}
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-2">
                    {/* Mobile tab toggle */}
                    <button
                        onClick={() => setActiveTab(t => t === 'orders' ? 'emails' : 'orders')}
                        className="sm:hidden p-2.5 bg-wood-700 rounded-xl text-wood-300 text-xs font-bold"
                    >
                        {activeTab === 'orders' ? '📣' : '📋'}
                    </button>
                    <button
                        onClick={logout}
                        className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider hidden sm:block"
                    >
                        Logout
                    </button>
                    <button
                        onClick={logout}
                        className="sm:hidden p-2.5 bg-red-600/20 rounded-xl text-red-400"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Mobile Tab Bar */}
            <div className="sm:hidden flex border-b border-wood-700 bg-wood-800">
                {['orders', 'emails'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab
                            ? 'text-tomato-400 border-b-2 border-tomato-500'
                            : 'text-wood-400'
                            }`}
                    >
                        {tab === 'orders' ? '📋 Orders' : '📣 Broadcaster'}
                    </button>
                ))}
            </div>

            {/* ── Main Content ──────────────────────────── */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 pb-24 lg:pb-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
                        <p className="text-xs font-bold text-wood-400 uppercase tracking-widest animate-pulse">Syncing Data...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'orders' ? (
                            <motion.div
                                key="orders"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                className="space-y-5"
                            >
                                {/* Section Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">Queue Management</h2>
                                        <p className="text-wood-400 text-sm mt-1">Real-time order tracking and response.</p>
                                    </div>
                                    {/* Stats Pills */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-wood-800 border border-wood-700 text-tomato-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {orders.length} Orders
                                        </span>
                                        <span className="bg-wood-800 border border-wood-700 text-wood-300 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {analytics ? `$${analytics.revenue?.toFixed(2) || '0.00'}` : '--'} Revenue
                                        </span>
                                        <span className="bg-wood-800 border border-wood-700 text-wood-300 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {users.length} Users
                                        </span>
                                    </div>
                                </div>

                                {/* Order Cards */}
                                <div className="space-y-3">
                                    {orders.length === 0 ? (
                                        <div className="text-center py-20 bg-wood-800 rounded-2xl border border-dashed border-wood-600">
                                            <div className="text-5xl mb-4 opacity-30">📭</div>
                                            <p className="text-xs font-black uppercase tracking-widest text-wood-400">No orders yet</p>
                                        </div>
                                    ) : (
                                        orders.map((order, i) => (
                                            <motion.div
                                                key={order.id || order._id}
                                                initial={{ opacity: 0, x: -12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                                className="bg-wood-800 rounded-2xl border border-wood-700 hover:border-wood-600 transition-colors p-4 sm:p-6"
                                            >
                                                {/* Top row: ID + Status + Time */}
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <span className="text-[10px] font-black bg-wood-700 px-3 py-1 rounded-full text-wood-300 tracking-widest uppercase">
                                                        #{(order.id || order._id || '').slice(-6).toUpperCase()}
                                                    </span>
                                                    <span className={`text-[10px] uppercase tracking-wider font-black px-3 py-1 rounded-full ${order.status === 'confirmed'
                                                        ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                                                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                    <span className="text-[10px] text-wood-500 font-bold uppercase tracking-widest ml-auto">
                                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Order items */}
                                                <p className="font-bold text-white text-sm sm:text-base leading-snug mb-3">
                                                    {order.items?.map(i => `${i.quantity || i.qty}× ${i.name}`).join(', ')}
                                                </p>

                                                {/* Bottom row: Details + Amount */}
                                                <div className="flex items-end justify-between gap-3 flex-wrap">
                                                    <div className="flex flex-wrap gap-3 text-xs text-wood-400">
                                                        {order.address && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="text-tomato-400">📍</span>
                                                                {typeof order.address === 'string' ? order.address : `${order.address.street}, ${order.address.city}`}
                                                            </span>
                                                        )}
                                                        {(order.customerInfo?.phone || order.phone) && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="text-tomato-400">📞</span> {order.customerInfo?.phone || order.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black text-tomato-400">
                                                            ${(order.total || order.items?.reduce((sum, i) => sum + i.price * (i.quantity || i.qty), 0)).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="emails"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                            >
                                <div className="max-w-xl mx-auto bg-wood-800 rounded-2xl border border-wood-700 p-5 sm:p-8 space-y-5">
                                    <div>
                                        <h2 className="text-2xl font-display font-black text-white tracking-tight">Broadcaster</h2>
                                        <p className="text-wood-400 text-sm mt-1">Send announcements to all {users.length} registered customers.</p>
                                    </div>

                                    {/* Subject */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-wood-400 uppercase tracking-widest">Subject Line</label>
                                        <input
                                            type="text"
                                            value={offerSubject}
                                            onChange={e => setOfferSubject(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-wood-700 border border-wood-600 outline-none focus:border-tomato-500 text-white text-sm transition-all"
                                            placeholder="Email subject..."
                                        />
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-wood-400 uppercase tracking-widest">Message</label>
                                        <textarea
                                            rows={6}
                                            value={offerText}
                                            onChange={e => setOfferText(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-wood-700 border border-wood-600 outline-none focus:border-tomato-500 text-white text-sm resize-none transition-all placeholder:text-wood-500"
                                            placeholder="Compose your message to customers..."
                                        />
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSendOffers}
                                        disabled={sendingEmail || !offerText}
                                        className="w-full py-4 bg-tomato-600 hover:bg-tomato-700 text-white font-black rounded-xl shadow-lg disabled:opacity-50 transition-colors uppercase tracking-widest text-sm"
                                    >
                                        {sendingEmail ? '🚀 Sending...' : '📣 Broadcast to All Customers'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>
        </div>
    )
}
