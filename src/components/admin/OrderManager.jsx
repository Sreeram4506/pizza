import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { showPushNotification, playNotificationSound } from '../../utils/notifications'

export default function OrderManager() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [socket, setSocket] = useState(null)
  const [newOrderAlert, setNewOrderAlert] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioContextRef = useRef(null)

  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
    }
    window.addEventListener('click', initAudio, { once: true })
    return () => window.removeEventListener('click', initAudio)
  }, [])

  const soundRef = useRef(soundEnabled)
  useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Connected to live order system')
      newSocket.emit('join-admin')
    })

    newSocket.on('order:new', (order) => {
      setOrders(prev => [order, ...prev])
      setNewOrderAlert(order)
      if (soundRef.current) playNotificationSound('success')
      showPushNotification('🔥 New Order Received!', {
        body: `Order #${order.orderNumber} - $${order.total?.toFixed(2)}`,
        tag: order._id
      })
      setTimeout(() => setNewOrderAlert(null), 8000)
    })

    newSocket.on('order:update', (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o))
      if (selectedOrder?._id === updatedOrder._id) setSelectedOrder(updatedOrder)
    })

    newSocket.on('order:deleted', (deletedOrderId) => {
      setOrders(prev => prev.filter(o => o._id !== deletedOrderId))
    })

    setSocket(newSocket)
    fetchOrders()
    return () => newSocket.disconnect()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setOrders(await res.json())
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) fetchOrders()
    } catch (err) {
      console.error('Failed to update order status:', err)
    }
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-tomato-50 text-tomato-600 border-tomato-100'
      case 'preparing': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'ready': return 'bg-green-50 text-green-600 border-green-100'
      case 'completed': return 'bg-stone-50 text-stone-500 border-stone-100'
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100'
      default: return 'bg-stone-50 text-stone-500 border-stone-100'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
        <p className="text-xs font-bold text-wood-400 uppercase tracking-widest animate-pulse">Syncing...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-20 lg:pb-6">
      {/* ── New Order Toast ────────────────── */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-4 sm:right-6 lg:top-24 lg:bottom-auto z-50 bg-white border border-tomato-100 rounded-2xl shadow-2xl p-4 sm:p-5 w-[calc(100%-2rem)] sm:max-w-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-tomato-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🍕</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-stone-900 text-sm leading-tight">🔥 New Order!</h4>
                <p className="text-stone-500 text-xs mt-1 truncate">#{newOrderAlert.orderNumber} • ${newOrderAlert.total?.toFixed(2)}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setSelectedOrder(newOrderAlert); setNewOrderAlert(null) }} className="flex-1 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-black uppercase tracking-wider">Details</button>
                  <button onClick={() => { updateOrderStatus(newOrderAlert._id, 'preparing'); setNewOrderAlert(null) }} className="flex-1 py-1.5 bg-tomato-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md shadow-tomato-100">Prepare</button>
                </div>
              </div>
              <button onClick={() => setNewOrderAlert(null)} className="text-stone-300">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">Live Orders</h2>
          <p className="text-wood-400 text-sm mt-1">
            <span className="text-white font-bold">{orders.length} total</span>
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-tomato-600 text-white rounded-full text-[10px] font-black uppercase">
                {orders.filter(o => o.status === 'pending').length} Pending
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-wood-800 p-1.5 rounded-2xl border border-wood-700">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-xl transition-all ${soundEnabled ? 'text-tomato-400' : 'text-wood-500'}`}>
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wood-700 border border-wood-600">
            <span className={`w-1.5 h-1.5 rounded-full ${socket?.connected ? 'bg-green-500 animate-pulse' : 'bg-wood-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{socket?.connected ? 'Live' : 'Off'}</span>
          </div>
          <button onClick={fetchOrders} className="p-2 bg-wood-700 text-white rounded-xl text-xs hover:bg-wood-600 transition-colors">🔄</button>
        </div>
      </div>

      {/* ── Filters ────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all h-9 whitespace-nowrap ${filter === status ? 'bg-tomato-600 text-white shadow-lg' : 'bg-wood-800 text-wood-400 border border-wood-700'
              }`}
          >
            {status} ({orders.filter(o => status === 'all' ? true : o.status === status).length})
          </button>
        ))}
      </div>

      {/* ── Orders List ────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-wood-800 rounded-3xl py-16 px-4 border border-wood-700 text-center">
            <span className="text-4xl mb-4 block">📦</span>
            <p className="text-xs font-black uppercase tracking-widest text-wood-400">No matching orders</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              layout
              className={`bg-wood-800 rounded-2xl p-4 sm:p-5 border transition-all ${order.status === 'pending' ? 'border-tomato-500/50 ring-2 ring-tomato-500/10' : 'border-wood-700'
                }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base sm:text-lg font-black text-white leading-none">#{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                    <p className="text-wood-400 text-xs font-bold truncate">👤 {order.customerInfo?.name || 'Guest'} • {order.type?.toUpperCase()}</p>
                    {order.type === 'delivery' && (
                      <p className="text-tomato-400/80 text-[10px] font-bold mt-1 truncate max-w-[200px]">
                        📍 {typeof order.address === 'string' ? order.address : `${order.address?.street}, ${order.address?.city}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-tomato-400">${order.total?.toFixed(2)}</span>
                    <p className="text-wood-500 text-[10px] mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 py-3 border-y border-wood-700/50">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="bg-wood-700/50 px-2 py-1 rounded-lg border border-wood-600 text-[10px] font-bold text-wood-100">
                      <span className="text-tomato-400">{item.quantity}×</span> {item.name}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSelectedOrder(order)} className="flex-1 py-2.5 bg-wood-700 text-wood-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-wood-600 transition-colors">Details</button>
                  {order.status === 'pending' && <button onClick={() => updateOrderStatus(order._id, 'preparing')} className="flex-1 py-2.5 bg-tomato-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-tomato-700 shadow-lg shadow-tomato-600/20">Accept</button>}
                  {order.status === 'preparing' && <button onClick={() => updateOrderStatus(order._id, 'ready')} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20">Ready</button>}
                  {order.status === 'ready' && <button onClick={() => updateOrderStatus(order._id, 'completed')} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-500/20">Deliver</button>}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── Detail Modal ──────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] p-3 flex items-end sm:items-center justify-center" onClick={() => setSelectedOrder(null)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-wood-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-wood-700 p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-display font-black text-white">#{selectedOrder.orderNumber}</h3>
                  <p className="text-wood-400 text-xs mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-9 h-9 bg-wood-700 rounded-full flex items-center justify-center text-wood-300">✕</button>
              </div>

              <div className="space-y-6">
                <section>
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest block mb-2">Customer Info</label>
                  <div className="bg-wood-700/50 p-4 rounded-xl border border-wood-600 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-white">{selectedOrder.customerInfo?.name || 'Guest User'}</p>
                        <p className="text-xs text-wood-400 mt-0.5">{selectedOrder.customerInfo?.phone || 'No phone'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedOrder.type === 'delivery' ? 'bg-tomato-600/20 text-tomato-400 border border-tomato-500/30' : 'bg-wood-600 text-wood-400'}`}>
                        {selectedOrder.type}
                      </span>
                    </div>

                    {selectedOrder.type === 'delivery' && (
                      <div className="pt-3 border-t border-wood-600/50">
                        <label className="text-[9px] font-black text-wood-500 uppercase tracking-widest block mb-1">Delivery Address</label>
                        <p className="text-xs text-wood-100 leading-relaxed">
                          {typeof selectedOrder.address === 'string'
                            ? selectedOrder.address
                            : (
                              <>
                                <span className="block font-bold">{selectedOrder.address?.street}</span>
                                <span className="block">{selectedOrder.address?.city}{selectedOrder.address?.zip ? `, ${selectedOrder.address.zip}` : ''}</span>
                              </>
                            )
                          }
                        </p>
                        {selectedOrder.address?.instructions && (
                          <div className="mt-2 p-2 bg-tomato-600/5 rounded-lg border border-tomato-600/10">
                            <label className="text-[8px] font-black text-tomato-400 uppercase tracking-widest block mb-0.5">Instructions</label>
                            <p className="text-[10px] text-wood-300 italic">"{selectedOrder.address.instructions}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest block mb-2">Items</label>
                  <div className="divide-y divide-wood-700">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="py-3 flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 bg-wood-600 rounded flex items-center justify-center text-[10px]">{item.quantity}×</span>
                            {item.name}
                          </p>
                          <p className="text-[10px] text-wood-400 mt-1 pl-8">{item.modifiers?.map(m => m.name).join(', ') || 'Regular'}</p>
                        </div>
                        <p className="text-sm font-bold text-tomato-400 flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="pt-4 border-t border-wood-700">
                  <div className="flex justify-between items-end">
                    <span className="text-wood-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Amount</span>
                    <span className="text-3xl font-black text-white">${selectedOrder.total?.toFixed(2)}</span>
                  </div>
                  <div className="mt-6 flex flex-col gap-2">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                      className="w-full py-4 bg-wood-700 rounded-xl px-4 text-sm font-bold text-white border-none focus:ring-2 focus:ring-tomato-500 outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button onClick={() => setSelectedOrder(null)} className="w-full py-4 bg-tomato-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-tomato-600/20">Done</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
