import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'

export default function DeliveryPortal() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [token, setToken] = useState(localStorage.getItem('adminToken') || '')
    const [isDriver, setIsDriver] = useState(false)
    const [stats, setStats] = useState({ deliveredCount: 0, totalEarnings: 0, avgDeliveryTime: 0 })
    const [orderNotes, setOrderNotes] = useState({})
    const [times, setTimes] = useState({})
    const navigate = useNavigate()

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date()
            const newTimes = {}
            orders.forEach(order => {
                const diff = Math.floor((now - new Date(order.updatedAt)) / 60000)
                newTimes[order._id] = diff
            })
            setTimes(newTimes)
        }, 30000)
        return () => clearInterval(interval)
    }, [orders])

    useEffect(() => {
        if (!token) {
// ... existing fetch logic ...
        }
    }, [token])

    const handleDeliver = async (orderId) => {
        try {
            const res = await fetch(`/api/delivery/orders/${orderId}/deliver`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ deliveryNotes: orderNotes[orderId] || '' })
            })
            if (res.ok) {
                setOrders(prev => prev.filter(o => o._id !== orderId))
            }
        } catch (err) {
            console.error('Delivery update failed', err)
        }
    }

    const openMaps = (address, type = 'google') => {
        const query = encodeURIComponent(typeof address === 'string' ? address : `${address.street}, ${address.city}, ${address.zip}`)
        const url = type === 'google' 
            ? `https://www.google.com/maps/search/?api=1&query=${query}`
            : `maps://maps.apple.com/?q=${query}`
        window.open(url, '_blank')
    }

    const sendSMS = (phone, template) => {
        const text = encodeURIComponent(template)
        window.location.href = `sms:${phone}?body=${text}`
    }

// ... loading and access denied logic ...

    return (
        <div className="min-h-screen bg-wood-900 text-white overflow-x-hidden">
            {/* Header omitted for brevity in targetContent match, but I will include it in replacement */}
            <div className="bg-wood-800 border-b border-wood-700 p-4 sticky top-0 z-20 flex justify-between items-center shadow-lg">
                <div>
                    <h1 className="text-xl font-sans font-bold text-tomato-400">Driver Portal</h1>
                    <p className="text-[10px] text-wood-400 font-bold uppercase tracking-widest">Enterprise Mobile View</p>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem('adminToken')
                        navigate('/')
                    }}
                    className="p-2 text-wood-400 hover:text-white transition-colors"
                >
                    Logout
                </button>
            </div>

            {/* Metrics Dashboard */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-wood-950 border-b border-wood-700 sticky top-[73px] z-10 shadow-md">
                <div className="bg-wood-800/50 p-4 rounded-2xl border border-wood-700 text-center">
                    <p className="text-[9px] font-black text-tomato-400 uppercase tracking-widest mb-1">Active</p>
                    <p className="text-2xl font-black">{orders.length}</p>
                </div>
                <div className="bg-wood-800/50 p-4 rounded-2xl border border-wood-700 text-center">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Done Today</p>
                    <p className="text-2xl font-black">{stats.deliveredCount}</p>
                </div>
                <div className="bg-wood-800/50 p-4 rounded-2xl border border-wood-700 text-center">
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Earnings</p>
                    <p className="text-2xl font-black">${stats.totalEarnings?.toFixed(0)}</p>
                </div>
                <div className="bg-wood-800/50 p-4 rounded-2xl border border-wood-700 text-center">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Avg Time</p>
                    <p className="text-2xl font-black">{stats.avgDeliveryTime}m</p>
                </div>
            </div>

            {/* Orders List */}
            <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
                <AnimatePresence>
                    {orders.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <div className="text-6xl mb-4 opacity-50">🛵</div>
                            <p className="text-wood-400 font-bold uppercase tracking-widest">No active deliveries</p>
                            <p className="text-xs text-wood-500 mt-2">Wait for assignments from the kitchen.</p>
                        </motion.div>
                    ) : (
                        orders.map(order => (
                            <motion.div
                                key={order._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, x: -100 }}
                                className="bg-wood-800 rounded-3xl p-5 border border-wood-700 shadow-xl"
                            >
                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-wood-700">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-lg text-white">#{order.orderNumber}</h3>
                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-black rounded-md border border-blue-500/20">
                                                ⏱️ {times[order._id] || 0}m
                                            </span>
                                        </div>
                                        <p className="text-wood-400 text-xs mt-1">
                                            Assigned {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-tomato-400 font-black">${order.total?.toFixed(2)}</span>
                                        <span className="block mt-1 px-2 py-0.5 bg-tomato-600/20 text-tomato-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-tomato-500/30">
                                            PAID
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {/* Customer & SMS */}
                                    <div className="flex justify-between items-end">
                                        <div className="flex-1">
                                            <p className="text-[10px] text-wood-500 font-black uppercase tracking-widest mb-1">Customer</p>
                                            <p className="font-bold text-white text-sm">{order.customerInfo?.name}</p>
                                            <div className="flex gap-4 mt-2">
                                                <a href={`tel:${order.customerInfo?.phone}`} className="flex items-center gap-2 px-3 py-2 bg-wood-900 rounded-xl text-tomato-400 font-bold text-xs border border-wood-700 hover:bg-wood-700 transition-colors">
                                                    📞 Call
                                                </a>
                                                <button 
                                                    onClick={() => sendSMS(order.customerInfo?.phone, "Hi, this is your Pizza Blast driver. I'm arriving with your order!")}
                                                    className="flex items-center gap-2 px-3 py-2 bg-wood-900 rounded-xl text-blue-400 font-bold text-xs border border-wood-700 hover:bg-wood-700 transition-colors"
                                                >
                                                    💬 SMS Arrival
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address & Maps */}
                                    <div>
                                        <p className="text-[10px] text-wood-500 font-black uppercase tracking-widest mb-1">Address</p>
                                        <p className="font-bold text-white text-sm leading-snug">
                                            {typeof order.address === 'string'
                                                ? order.address
                                                : `${order.address?.street}, ${order.address?.city} ${order.address?.zip || ''}`}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <button 
                                                onClick={() => openMaps(order.address, 'google')}
                                                className="flex-1 py-2 bg-wood-950 text-wood-200 text-[10px] font-black uppercase tracking-tighter rounded-xl border border-wood-700"
                                            >
                                                🗺️ Google Maps
                                            </button>
                                            <button 
                                                onClick={() => openMaps(order.address, 'apple')}
                                                className="flex-1 py-2 bg-wood-950 text-wood-200 text-[10px] font-black uppercase tracking-tighter rounded-xl border border-wood-700"
                                            >
                                                🍎 Apple Maps
                                            </button>
                                        </div>
                                        {order.address?.instructions && (
                                            <div className="mt-3 text-xs bg-tomato-500/5 p-3 rounded-xl text-tomato-200 border border-tomato-500/20 italic">
                                                <span className="block text-[8px] font-black uppercase tracking-widest text-tomato-500 not-italic mb-1">Customer Instructions</span>
                                                "{order.address.instructions}"
                                            </div>
                                        )}
                                    </div>

                                    {/* Items & Modifiers */}
                                    <div>
                                        <p className="text-[10px] text-wood-500 font-black uppercase tracking-widest mb-1">Handover Checklist</p>
                                        <div className="space-y-1.5 mt-1">
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} className="bg-wood-900/50 p-2 rounded-lg border border-wood-700/50">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-bold text-white"><span className="text-tomato-500">{item.quantity}x</span> {item.name}</span>
                                                    </div>
                                                    {item.modifiers?.length > 0 && (
                                                        <p className="text-[10px] text-wood-400 mt-0.5">
                                                            ↳ {item.modifiers.map(m => m.name).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Driver Notes */}
                                    <div>
                                        <p className="text-[10px] text-wood-500 font-black uppercase tracking-widest mb-1">Delivery Notes (visible to admin)</p>
                                        <textarea 
                                            placeholder="e.g. Left at side door, customer was very friendly..."
                                            value={orderNotes[order._id] || ''}
                                            onChange={(e) => setOrderNotes({...orderNotes, [order._id]: e.target.value})}
                                            className="w-full bg-wood-950 border border-wood-700 rounded-2xl p-3 text-xs text-white placeholder:text-wood-600 focus:outline-none focus:border-tomato-500 transition-colors"
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeliver(order._id)}
                                    className="w-full py-4 bg-tomato-600 hover:bg-tomato-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-tomato-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span>🏁</span>
                                    <span>Complete Delivery</span>
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
