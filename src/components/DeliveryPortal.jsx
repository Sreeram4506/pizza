import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { useNavigate, useParams } from 'react-router-dom'

export default function DeliveryPortal() {
    const { token: magicToken } = useParams()
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

    // LIVE GPS TRACKING LOOP
    useEffect(() => {
        if (!magicToken && (!token || orders.length === 0)) return

        let watchId = null
        let lastReportTime = 0

        const startTracking = () => {
            if ("geolocation" in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const now = Date.now()
                        if (now - lastReportTime > 15000) {
                            lastReportTime = now
                            const { latitude, longitude } = position.coords
                            
                            orders.forEach(order => {
                                if (order.status === 'out_for_delivery') {
                                    const url = magicToken 
                                        ? `/api/delivery/token/${magicToken}/location`
                                        : `/api/delivery/orders/${order._id}/location`
                                    
                                    const headers = magicToken 
                                        ? { 'Content-Type': 'application/json' }
                                        : { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

                                    fetch(url, {
                                        method: 'POST',
                                        headers,
                                        body: JSON.stringify({ lat: latitude, lng: longitude })
                                    }).catch(err => console.error("GPS report error", err))
                                }
                            })
                        }
                    },
                    (err) => console.error("Geolocation error", err),
                    { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
                )
            }
        }

        startTracking()
        return () => { if (watchId) navigator.geolocation.clearWatch(watchId) }
    }, [token, magicToken, orders])

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true)
                
                // If we have a magic link token, use the public token endpoint
                if (magicToken) {
                    const res = await fetch(`/api/delivery/token/${magicToken}`)
                    if (res.ok) {
                        const order = await res.json()
                        setOrders([order])
                        setIsDriver(true)
                    } else {
                        setIsDriver(false)
                    }
                    setLoading(false)
                    return
                }

                // Standard login flow
                if (!token) {
                    setIsDriver(false)
                    setLoading(false)
                    return
                }

                const [ordersRes, statsRes] = await Promise.all([
                    fetch('/api/delivery/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/delivery/stats', { headers: { 'Authorization': `Bearer ${token}` } })
                ])

                if (ordersRes.ok && statsRes.ok) {
                    const ordersData = await ordersRes.json()
                    const statsData = await statsRes.json()
                    setOrders(ordersData)
                    setStats(statsData)
                    setIsDriver(true)
                } else {
                    setIsDriver(false)
                }
            } catch (err) {
                console.error('Fetch failed', err)
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [token, magicToken])

    const handleDeliver = async (orderId) => {
        try {
            const url = magicToken 
                ? `/api/delivery/token/${magicToken}/deliver`
                : `/api/delivery/orders/${orderId}/deliver`
            
            const headers = magicToken 
                ? { 'Content-Type': 'application/json' }
                : { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

            const res = await fetch(url, {
                method: 'PUT',
                headers,
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
        <div className="min-h-screen bg-[#FAFAF8] text-[#1A1410] overflow-x-hidden">
            {/* Header omitted for brevity in targetContent match, but I will include it in replacement */}
            <div className="bg-white border-b border-[rgba(26,20,16,0.06)] p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-xl font-sans font-bold text-[#1A1410]">Driver Portal</h1>
                    <p className="text-[10px] text-[#9B8D74] font-bold uppercase tracking-widest mt-1">
                        {magicToken ? 'External Partner View' : 'Enterprise Mobile View'}
                    </p>
                </div>
                {!magicToken && (
                    <button
                        onClick={() => {
                            localStorage.removeItem('adminToken')
                            navigate('/')
                        }}
                        className="p-2 text-[#9B8D74] hover:text-[#1A1410] hover:bg-[#F5F3EF] rounded-xl transition-all"
                    >
                        Logout
                    </button>
                )}
            </div>

            {/* Metrics Dashboard - Hidden for Magic Links */}
            {!magicToken && (
                <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-2 bg-[#F5F3EF] border-b border-[rgba(26,20,16,0.06)] sticky top-[73px] z-10 shadow-sm">
                    <div className="bg-white p-3 rounded-2xl border border-[rgba(26,20,16,0.06)] text-center shadow-sm">
                        <p className="text-[8px] font-black text-ember-600 uppercase tracking-widest mb-1">Active</p>
                        <p className="text-xl font-black text-[#1A1410]">{orders.length}</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-[rgba(26,20,16,0.06)] text-center shadow-sm">
                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Delivered</p>
                        <p className="text-xl font-black text-[#1A1410]">{stats.deliveredCount}</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-[rgba(26,20,16,0.06)] text-center shadow-sm">
                        <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Earned</p>
                        <p className="text-xl font-black text-[#1A1410]">${stats.totalEarnings?.toFixed(0)}</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-[rgba(26,20,16,0.06)] text-center shadow-sm">
                        <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Avg Time</p>
                        <p className="text-xl font-black text-[#1A1410]">{stats.avgDeliveryTime}m</p>
                    </div>
                </div>
            )}

            {/* Orders List */}
            <div className="p-3 sm:p-4 space-y-4 max-w-md mx-auto pb-24">
                <AnimatePresence>
                    {orders.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <div className="text-6xl mb-4 opacity-50">🛵</div>
                            <p className="text-[#9B8D74] font-bold uppercase tracking-widest">No active deliveries</p>
                            <p className="text-xs text-[#5C554E] mt-2">Wait for assignments from the kitchen.</p>
                        </motion.div>
                    ) : (
                        orders.map(order => (
                            <motion.div
                                key={order._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, x: -100 }}
                                className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 border border-[rgba(26,20,16,0.06)] shadow-xl shadow-black/5"
                            >
                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-[rgba(26,20,16,0.06)]">
                                    <div className="flex-1 pr-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-black text-base md:text-lg text-[#1A1410]">#{order.orderNumber}</h3>
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] md:text-[9px] font-black rounded-md border border-blue-200 whitespace-nowrap">
                                                ⏱️ {times[order._id] || 0}m
                                            </span>
                                        </div>
                                        <p className="text-[#9B8D74] text-[10px] md:text-xs mt-1">
                                            {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[#1A1410] font-black text-sm md:text-base">${order.total?.toFixed(2)}</span>
                                        <span className="block mt-1 px-2 py-0.5 bg-ember-50 text-ember-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-md border border-ember-200">
                                            PAID
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {/* Customer & SMS */}
                                    <div className="flex justify-between items-end">
                                        <div className="flex-1">
                                            <p className="text-[10px] text-[#9B8D74] font-black uppercase tracking-widest mb-1">Customer</p>
                                            <p className="font-bold text-[#1A1410] text-sm">{order.customerInfo?.name}</p>
                                            <div className="flex gap-4 mt-2">
                                                <a href={`tel:${order.customerInfo?.phone}`} className="flex items-center gap-2 px-3 py-2 bg-[#F5F3EF] rounded-xl text-[#1A1410] font-bold text-xs border border-[rgba(26,20,16,0.06)] hover:bg-white hover:shadow-sm transition-all">
                                                    📞 Call
                                                </a>
                                                <button 
                                                    onClick={() => sendSMS(order.customerInfo?.phone, `Hi, this is your ${settings?.restaurantName || 'Pizza Blast'} driver. I'm arriving with your order!`)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-[#F5F3EF] rounded-xl text-blue-600 font-bold text-xs border border-[rgba(26,20,16,0.06)] hover:bg-white hover:shadow-sm transition-all"
                                                >
                                                    💬 SMS Arrival
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address & Map */}
                                    <div>
                                        <p className="text-[10px] text-[#9B8D74] font-black uppercase tracking-widest mb-1">Delivery Location</p>
                                        <p className="font-bold text-[#1A1410] text-sm leading-snug mb-2">
                                            {typeof order.address === 'string'
                                                ? order.address
                                                : `${order.address?.street || ''}, ${order.address?.city || ''} ${order.address?.zip || ''}`}
                                        </p>

                                        {/* Embedded GPS Map */}
                                        {order.address?.lat && order.address?.lng && (
                                          <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-[rgba(26,20,16,0.1)] mb-3 shadow-inner">
                                            <iframe
                                              className="absolute inset-0 w-full h-full"
                                              frameBorder="0" scrolling="no"
                                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${order.address.lng - 0.003}%2C${order.address.lat - 0.003}%2C${order.address.lng + 0.003}%2C${order.address.lat + 0.003}&layer=mapnik&marker=${order.address.lat}%2C${order.address.lng}`}
                                            />
                                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[8px] font-black text-green-700 border border-green-200 uppercase tracking-wider">
                                              📍 GPS Pin
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                  if (order.address?.lat && order.address?.lng) {
                                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.address.lat},${order.address.lng}`, '_blank')
                                                  } else {
                                                    openMaps(order.address, 'google')
                                                  }
                                                }}
                                                className="flex-1 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all text-[10px] font-black uppercase tracking-tighter rounded-xl border border-blue-200 hover:shadow-sm"
                                            >
                                                🗺️ Navigate (Google)
                                            </button>
                                            <button 
                                                onClick={() => {
                                                  if (order.address?.lat && order.address?.lng) {
                                                    window.open(`http://maps.apple.com/?daddr=${order.address.lat},${order.address.lng}`, '_blank')
                                                  } else {
                                                    openMaps(order.address, 'apple')
                                                  }
                                                }}
                                                className="flex-1 py-2.5 bg-[#F5F3EF] text-[#1A1410] hover:bg-white transition-all text-[10px] font-black uppercase tracking-tighter rounded-xl border border-[rgba(26,20,16,0.06)] hover:shadow-sm"
                                            >
                                                🍎 Navigate (Apple)
                                            </button>
                                        </div>
                                        {order.address?.instructions && (
                                            <div className="mt-3 text-xs bg-ember-50 p-3 rounded-xl text-ember-700 border border-ember-200 italic">
                                                <span className="block text-[8px] font-black uppercase tracking-widest text-ember-600 not-italic mb-1">Customer Instructions</span>
                                                "{order.address.instructions}"
                                            </div>
                                        )}
                                    </div>

                                    {/* Items & Modifiers */}
                                    <div>
                                        <p className="text-[10px] text-[#9B8D74] font-black uppercase tracking-widest mb-1">Handover Checklist</p>
                                        <div className="space-y-1.5 mt-1">
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} className="bg-[#FAFAF8] p-2 rounded-lg border border-[rgba(26,20,16,0.06)]">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-bold text-[#1A1410]"><span className="text-ember-600">{item.quantity}x</span> {item.name}</span>
                                                    </div>
                                                    {item.modifiers?.length > 0 && (
                                                        <p className="text-[10px] text-[#9B8D74] mt-0.5">
                                                            ↳ {item.modifiers.map(m => m.name).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Driver Notes */}
                                    <div>
                                        <p className="text-[10px] text-[#9B8D74] font-black uppercase tracking-widest mb-1">Delivery Notes (visible to admin)</p>
                                        <textarea 
                                            placeholder="e.g. Left at side door, customer was very friendly..."
                                            value={orderNotes[order._id] || ''}
                                            onChange={(e) => setOrderNotes({...orderNotes, [order._id]: e.target.value})}
                                            className="w-full bg-[#FAFAF8] border border-transparent focus:bg-white focus:border-ember-500/30 rounded-2xl p-3 text-xs text-[#1A1410] placeholder:text-[#9B8D74] focus:outline-none transition-all shadow-sm"
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeliver(order._id)}
                                    className="w-full py-4 bg-[#1A1410] hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-black/10 transition-all active:scale-95 flex items-center justify-center gap-2"
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
