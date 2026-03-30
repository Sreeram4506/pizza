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
        <div className="min-h-screen bg-[#FAFAF8] text-[#1A1410]">
            {/* ── Header ───────────────────────────────── */}
            <header className="bg-white/95 backdrop-blur-xl border-b border-[rgba(26,20,16,0.06)] px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-tomato-600 rounded-xl flex items-center justify-center text-xl shadow-lg flex-shrink-0">🍕</div>
                    <div className="hidden sm:block">
                        <h1 className="font-display font-black text-base text-[#1A1410] tracking-tight leading-none">Admin Panel</h1>
                        <p className="text-[10px] text-ember-600 font-semibold uppercase tracking-wider">{settings?.restaurantName || 'Pizza Blast'} Control</p>
                    </div>
                </div>

                {/* Desktop Tab Nav */}
                <nav className="hidden sm:flex items-center bg-[#F5F3EF] rounded-full p-1 border border-[rgba(26,20,16,0.06)]">
                    {['orders', 'emails'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-[#1A1410] text-white shadow-lg' : 'text-[#9B8D74] hover:text-[#1A1410]'
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
                        className="sm:hidden p-2.5 bg-[#F5F3EF] rounded-xl text-[#9B8D74] text-xs font-bold border border-[rgba(26,20,16,0.06)]"
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
            <div className="sm:hidden flex border-b border-[rgba(26,20,16,0.06)] bg-white">
                {['orders', 'emails'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab
                            ? 'text-ember-600 border-b-2 border-ember-600'
                            : 'text-[#9B8D74]'
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
                        <div className="animate-spin w-10 h-10 border-[3px] border-ember-600 border-t-transparent rounded-full" />
                        <p className="text-xs font-bold text-[#9B8D74] uppercase tracking-widest animate-pulse">Syncing Data...</p>
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
                                        <h2 className="text-2xl sm:text-3xl font-display font-black text-[#1A1410] tracking-tight">Queue Management</h2>
                                        <p className="text-[#5C554E] text-sm mt-1">Real-time order tracking and response.</p>
                                    </div>
                                    {/* Stats Pills */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-white border border-[rgba(26,20,16,0.06)] text-ember-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                                            {orders.length} Orders
                                        </span>
                                        <span className="bg-white border border-[rgba(26,20,16,0.06)] text-[#1A1410] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                                            {analytics ? `$${analytics.revenue?.toFixed(2) || '0.00'}` : '--'} Revenue
                                        </span>
                                        <span className="bg-white border border-[rgba(26,20,16,0.06)] text-[#1A1410] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                                            {users.length} Users
                                        </span>
                                    </div>
                                </div>

                                {/* Order Cards */}
                                <div className="space-y-3">
                                    {orders.length === 0 ? (
                                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[rgba(26,20,16,0.1)] shadow-sm">
                                            <div className="text-5xl mb-4 opacity-30">📭</div>
                                            <p className="text-xs font-black uppercase tracking-widest text-[#9B8D74]">No orders yet</p>
                                        </div>
                                    ) : (
                                        orders.map((order, i) => (
                                            <motion.div
                                                key={order.id || order._id}
                                                initial={{ opacity: 0, x: -12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                                className="bg-white rounded-2xl border border-[rgba(26,20,16,0.06)] hover:border-ember-200 transition-all p-4 sm:p-6 shadow-sm hover:shadow-md"
                                            >
                                                {/* Top row: ID + Status + Time */}
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <span className="text-[10px] font-black bg-[#F5F3EF] px-3 py-1 rounded-full text-[#1A1410] tracking-widest uppercase border border-[rgba(26,20,16,0.03)]">
                                                        #{(order.id || order._id || '').slice(-6).toUpperCase()}
                                                    </span>
                                                    <span className={`text-[10px] uppercase tracking-wider font-black px-3 py-1 rounded-full ${order.status === 'confirmed'
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                     <span className={`text-[10px] uppercase tracking-wider font-black px-3 py-1 rounded-full ${order.payment?.method === 'cash'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                        }`}>
                                                        {order.payment?.method === 'cash' ? '💵 COD' : '💳 CARD'}
                                                     </span>
                                                     {order.promoCode && (
                                                         <span className="text-[10px] bg-ember-600 text-white px-3 py-1 rounded-full font-black uppercase shadow-sm">
                                                             🎁 {order.promoCode}
                                                         </span>
                                                     )}
                                                     {order.source && order.source !== 'website' && (
                                                         <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase shadow-sm ${
                                                             order.source === 'ubereats' ? 'bg-black text-white' : 
                                                             order.source === 'grubhub' ? 'bg-[#FF8000] text-white' : 'bg-[#F5F3EF] text-[#1A1410]'
                                                         }`}>
                                                             🚀 {order.source}
                                                         </span>
                                                     )}
                                                     <div className="flex gap-1.5 ml-1">
                                                        {order.customerInfo?.promoEmail && <span title="Marketing Email Opt-in" className="text-xs">📧</span>}
                                                        {order.customerInfo?.promoText && <span title="SMS text Opt-in" className="text-xs">💬</span>}
                                                     </div>
                                                     <span className="text-[10px] text-[#9B8D74] font-bold uppercase tracking-widest ml-auto">
                                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                     </span>
                                                </div>

                                                {/* Order items */}
                                                <p className="font-bold text-[#1A1410] text-sm sm:text-base leading-snug mb-3">
                                                    {order.items?.map(i => `${i.quantity || i.qty}× ${i.name}`).join(', ')}
                                                </p>
                                                
                                                {/* Bottom row: Details + Amount */}
                                                <div className="flex items-end justify-between gap-3 flex-wrap">
                                                    <div className="flex flex-wrap gap-3 text-xs text-[#5C554E]">
                                                        {order.address && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="text-ember-600">📍</span>
                                                                {typeof order.address === 'string' ? order.address : `${order.address.street}, ${order.address.city}`}
                                                            </span>
                                                        )}
                                                        {(order.customerInfo?.phone || order.phone) && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="text-ember-600">📞</span> {order.customerInfo?.phone || order.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                     <div className="text-right">
                                                        {order.tip > 0 && (
                                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight mb-1">
                                                                + ${order.tip.toFixed(2)} Tip Included
                                                            </p>
                                                        )}
                                                        <p className="text-xl font-black text-ember-600 leading-none">
                                                            ${(order.total || 0).toFixed(2)}
                                                        </p>
                                                        <p className="text-[9px] font-black uppercase text-[#9B8D74] mt-1 tracking-widest">
                                                            {order.type || 'pickup'}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    <div className="bg-white rounded-3xl border border-[rgba(26,20,16,0.06)] p-6 sm:p-10 space-y-7 shadow-xl">
                                        <div>
                                            <h2 className="text-3xl font-display font-black text-[#1A1410] tracking-tight">Campaign Broadcaster</h2>
                                            <p className="text-[#5C554E] text-sm mt-1">Send beautiful updates to your loyal customers.</p>
                                        </div>

                                        {/* Subject */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest ml-1">Subject Line</label>
                                            <input
                                                type="text"
                                                value={offerSubject}
                                                onChange={e => setOfferSubject(e.target.value)}
                                                className="w-full h-14 px-5 rounded-2xl bg-[#F5F3EF] border-2 border-transparent focus:bg-white focus:border-ember-500/30 outline-none text-[#1A1410] text-[15px] font-bold transition-all shadow-inner"
                                                placeholder="e.g. 🎉 Free Pepperoni Friday!"
                                            />
                                        </div>

                                        {/* Message */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#9B8D74] uppercase tracking-widest ml-1">Message Content</label>
                                            <textarea
                                                rows={5}
                                                value={offerText}
                                                onChange={e => setOfferText(e.target.value)}
                                                className="w-full px-5 py-4 rounded-2xl bg-[#F5F3EF] border-2 border-transparent focus:bg-white focus:border-ember-500/30 font-bold outline-none text-[#1A1410] text-[15px] resize-none transition-all placeholder:text-[#9B8D74] shadow-inner"
                                                placeholder="What's the hype today?"
                                            />
                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSendOffers}
                                            disabled={sendingEmail || !offerText}
                                            className="w-full py-5 bg-[#1A1410] hover:bg-black text-white font-black rounded-2xl shadow-2xl disabled:opacity-50 transition-all uppercase tracking-widest text-[11px] shadow-black/20"
                                        >
                                            {sendingEmail ? '🚀 Launching Campaign...' : '📣 Broadcast to Audience'}
                                        </motion.button>
                                    </div>

                                    {/* Audience Overview */}
                                    <div className="bg-white rounded-3xl border border-[rgba(26,20,16,0.06)] p-6 sm:p-10 shadow-lg">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-bold font-display text-[#1A1410]">Target Audience</h3>
                                            <span className="px-3 py-1 bg-ember-50 text-ember-600 rounded-full font-bold text-[10px] uppercase tracking-widest">{users.length} Leads</span>
                                        </div>
                                        
                                        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-hide">
                                            {users.map((u, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-[#F5F3EF] rounded-xl group/audience transition-all hover:bg-[#EAE8E4]">
                                                    <div className="w-8 h-8 bg-white border border-[#EBEBE6] rounded-lg flex items-center justify-center font-bold text-[10px] text-[#1A1410] shadow-sm">
                                                        {u.name?.[0] || 'U'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-bold text-[#1A1410] truncate">{u.name}</p>
                                                        <p className="text-[10px] text-[#9B8D74] font-medium truncate">{u.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {users.length === 0 && (
                                                <div className="text-center py-10 opacity-40">
                                                    <p className="italic text-sm">No registered customers found.</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="mt-8 pt-8 border-t border-[rgba(26,20,16,0.06)] text-center">
                                            <p className="text-[10px] text-[#9B8D74] font-bold uppercase tracking-widest">Audience includes all registered accounts</p>
                                        </div>
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
