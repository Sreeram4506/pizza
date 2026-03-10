import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'

export default function DeliveryPortal() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [token, setToken] = useState(localStorage.getItem('adminToken') || '')
    const [isDriver, setIsDriver] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (!token) {
            setLoading(false)
            return
        }

        // Try to connect and fetch orders
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/delivery/orders', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    setIsDriver(true)
                    setOrders(await res.json())
                } else {
                    setIsDriver(false)
                }
            } catch (err) {
                setIsDriver(false)
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()

        // Setup WebSocket
        const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
        const socket = io(apiUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        })

        socket.on('order:update', () => {
            fetchOrders() // refresh list when something changes
        })

        return () => socket.disconnect()
    }, [token])

    const handleDeliver = async (orderId) => {
        try {
            const res = await fetch(`/api/delivery/orders/${orderId}/deliver`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                setOrders(prev => prev.filter(o => o._id !== orderId))
            }
        } catch (err) {
            console.error('Delivery update failed', err)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-wood-900 flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!token || !isDriver) {
        return (
            <div className="min-h-screen bg-wood-900 flex items-center justify-center p-6">
                <div className="bg-wood-800 p-8 rounded-3xl max-w-sm w-full text-center border border-wood-700">
                    <div className="text-4xl mb-4">🚫</div>
                    <h2 className="text-xl font-black text-white mb-2">Access Denied</h2>
                    <p className="text-sm text-wood-400 mb-6">You must be logged in as a delivery driver to view this portal.</p>
                    <button
                        onClick={() => navigate('/admin/login')}
                        className="block w-full py-3 bg-tomato-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-tomato-700 transition-colors"
                    >
                        Driver Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-wood-900 text-white overflow-x-hidden">
            {/* Header */}
            <div className="bg-wood-800 border-b border-wood-700 p-4 sticky top-0 z-10 flex justify-between items-center shadow-lg">
                <div>
                    <h1 className="text-xl font-sans font-bold text-tomato-400">Driver Portal</h1>
                    <p className="text-[10px] text-wood-400 font-bold uppercase tracking-widest">{orders.length} Active Deliveries</p>
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
                                        <h3 className="font-black text-lg text-white">#{order.orderNumber}</h3>
                                        <p className="text-wood-400 text-xs mt-1">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                    <div>
                                        <p className="text-[10px] text-wood-500 font-black uppercase tracking-widest mb-1">Customer</p>
                                        <p className="font-bold text-white text-sm">{order.customerInfo?.name}</p>
                                        <a href={`tel:${order.customerInfo?.phone}`} className="text-tomato-400 font-bold text-sm block mt-1 hover:underline">
                                            📞 {order.customerInfo?.phone}
                                        </a>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-wood-500 font-black uppercase tracking-widest mb-1">Address</p>
                                        <p className="font-bold text-white text-sm leading-snug">
                                            {typeof order.address === 'string'
                                                ? order.address
                                                : `${order.address?.street}, ${order.address?.city}`}
                                        </p>
                                        {order.address?.instructions && (
                                            <div className="mt-2 text-xs bg-wood-900 p-2 rounded-xl text-wood-300 border border-wood-700">
                                                "{order.address.instructions}"
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-wood-500 font-black uppercase tracking-widest mb-1">Items ({order.items?.length})</p>
                                        <p className="text-xs text-wood-300">
                                            {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeliver(order._id)}
                                    className="w-full py-4 bg-tomato-600 hover:bg-tomato-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-tomato-600/20 transition-all active:scale-95"
                                >
                                    Mark Delivered
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
