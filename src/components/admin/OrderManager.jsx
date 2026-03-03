import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { showPushNotification, playNotificationSound } from '../../utils/notifications'

// Notification sound utility moved to /utils/notifications.js

export default function OrderManager() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [socket, setSocket] = useState(null)
  const [newOrderAlert, setNewOrderAlert] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioContextRef = useRef(null)

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
    }
    window.addEventListener('click', initAudio, { once: true })
    return () => window.removeEventListener('click', initAudio)
  }, [])

  // Setup Socket.IO connection
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

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    newSocket.on('order:new', (order) => {
      console.log('New order received:', order)
      setOrders(prev => [order, ...prev])
      setNewOrderAlert(order)

      if (soundRef.current) playNotificationSound('success')

      // Browser Push Notification
      showPushNotification('🔥 New Order Received!', {
        body: `Order #${order.orderNumber} - $${order.total?.toFixed(2)}`,
        tag: order._id
      })

      setTimeout(() => setNewOrderAlert(null), 8000)
    })

    // Listen for order updates
    newSocket.on('order:update', (updatedOrder) => {
      console.log('Order updated:', updatedOrder)
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o))
      if (selectedOrder?._id === updatedOrder._id) setSelectedOrder(updatedOrder)
    })

    // Listen for order deletion
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

      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        fetchOrders() // Refresh orders
      }
    } catch (err) {
      console.error('Failed to update order status:', err)
    }
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'preparing': return '👨‍🍳'
      case 'ready': return '✅'
      case 'completed': return '🎉'
      case 'cancelled': return '❌'
      default: return '📋'
    }
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tomato-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 relative max-w-6xl mx-auto">
      {/* New Order Alert Banner */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-24 right-6 z-50 bg-white border border-tomato-100 rounded-2xl shadow-2xl p-6 max-w-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-tomato-50 rounded-full flex items-center justify-center text-2xl">
                🍕
              </div>
              <div className="flex-1">
                <h4 className="font-black text-stone-900 text-lg tracking-tight">New Order!</h4>
                <p className="text-stone-500 text-sm mt-1">
                  Order <span className="text-tomato-600 font-bold">#{newOrderAlert.orderNumber}</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-widest">{newOrderAlert.items?.length || 0} items</span>
                  <span className="text-stone-300">•</span>
                  <span className="text-sm font-bold text-stone-900">${newOrderAlert.total?.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="text-stone-300 hover:text-stone-900 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setSelectedOrder(newOrderAlert)
                  setNewOrderAlert(null)
                }}
                className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-200 transition-all"
              >
                View
              </button>
              <button
                onClick={() => {
                  updateOrderStatus(newOrderAlert._id, 'preparing')
                  setNewOrderAlert(null)
                }}
                className="flex-1 py-3 bg-tomato-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-tomato-700 shadow-lg shadow-tomato-100 transition-all"
              >
                Prepare
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight">Live Orders</h2>
          <p className="text-stone-500 mt-2 text-lg">
            Real-time tracking • <span className="text-stone-900 font-bold">{orders.length} total</span>
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-tomato-50 text-tomato-600 rounded text-sm font-bold border border-tomato-100">
                {pendingCount} Pending
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-stone-100 shadow-sm">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl transition-all ${soundEnabled
              ? 'bg-tomato-50 text-tomato-600'
              : 'bg-stone-50 text-stone-400'
              }`}
          >
            {soundEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${socket?.connected
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-stone-50 text-stone-400 border-stone-100'
            }`}>
            <span className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
            <span className="text-xs font-black uppercase tracking-widest">{socket?.connected ? 'Live' : 'Syncing'}</span>
          </div>

          <button
            onClick={fetchOrders}
            className="px-6 py-2 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-800 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-1 bg-stone-100 rounded-2xl w-fit">
        {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === status
              ? 'bg-white text-tomato-600 shadow-sm'
              : 'text-stone-500 hover:text-stone-900'
              }`}
          >
            {status}
            {status !== 'all' && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${filter === status ? 'bg-tomato-50' : 'bg-stone-200'}`}>
                {orders.filter(o => o.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 border border-stone-100 text-center shadow-sm">
            <div className="text-6xl mb-6">📦</div>
            <h3 className="text-xl font-black text-stone-900 uppercase tracking-widest">No orders found</h3>
            <p className="text-stone-500 mt-2">Change your filter or wait for new orders.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              layout
              className={`bg-white rounded-3xl p-8 border hover:shadow-md transition-all group ${order.status === 'pending' ? 'border-tomato-200 ring-4 ring-tomato-50/50' : 'border-stone-100'
                }`}
            >
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-2xl font-black text-stone-900">#{order.orderNumber}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'pending' ? 'bg-tomato-50 text-tomato-600 border border-tomato-100' :
                      order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        'bg-stone-50 text-stone-500 border border-stone-100'
                      }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-stone-500 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-stone-50 rounded-full flex items-center justify-center text-stone-400">👤</div>
                      <span className="text-stone-900 font-bold">{order.customerInfo?.name || (order.customerId ? 'Registered User' : 'Guest')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">🕒</span>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">📍</span>
                      {order.type || 'delivery'}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-stone-50">
                    <div className="flex flex-wrap gap-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="bg-stone-50 px-3 py-2 rounded-xl border border-stone-100 flex items-center gap-2">
                          <span className="w-6 h-6 bg-stone-900 text-white rounded-lg flex items-center justify-center text-[10px] font-bold">
                            {item.quantity}
                          </span>
                          <span className="text-stone-700 font-bold text-xs">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-48 flex flex-col justify-between items-end gap-6 border-l border-stone-50 pl-8">
                  <div className="text-right">
                    <span className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Amount</span>
                    <span className="text-3xl font-black text-stone-900">${order.total?.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2 w-full">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'preparing')}
                        className="w-full py-3 bg-tomato-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-tomato-700 transition-all shadow-lg shadow-tomato-100"
                      >
                        Accept
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'ready')}
                        className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-600 transition-all"
                      >
                        Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'completed')}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="w-full py-3 bg-stone-50 text-stone-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-100 transition-all"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans" onClick={() => setSelectedOrder(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full p-10 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h2 className="text-4xl font-black text-stone-900 tracking-tight">Order #{selectedOrder.orderNumber}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                  </div>
                  <p className="text-stone-500 font-medium">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all border border-stone-100"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-10 mb-10">
                <div>
                  <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Customer Info</h4>
                  <div className="space-y-2">
                    <p className="font-black text-stone-900 leading-none">{selectedOrder.customerInfo?.name || (selectedOrder.customerId ? 'Registered User' : 'Guest')}</p>
                    <p className="text-sm text-stone-500 font-medium">{selectedOrder.customerInfo?.email || 'No email provided'}</p>
                    <p className="text-sm text-stone-500 font-medium">{selectedOrder.customerInfo?.phone || 'No phone provided'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Delivery Method</h4>
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <p className="font-bold text-stone-900 capitalize">{selectedOrder.type || 'delivery'}</p>
                    {selectedOrder.deliveryAddress && <p className="text-xs text-stone-500 mt-1">{selectedOrder.deliveryAddress}</p>}
                  </div>
                </div>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Order Items</h4>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-4 border-b border-stone-50 last:border-0 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center font-black">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="font-black text-stone-900">{item.name}</p>
                          <p className="text-sm text-stone-400 font-bold">{item.modifiers?.map(m => m.name).join(', ') || 'No extras'}</p>
                        </div>
                      </div>
                      <p className="font-black text-stone-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-stone-900 rounded-3xl p-8 text-white">
                <div className="space-y-3">
                  <div className="flex justify-between text-stone-400 text-sm font-bold">
                    <span>Subtotal</span>
                    <span>${(selectedOrder.subtotal || selectedOrder.total * 0.9).toFixed(2)}</span>
                  </div>
                  {selectedOrder.deliveryFee > 0 && (
                    <div className="flex justify-between text-stone-400 text-sm font-bold">
                      <span>Delivery Fee</span>
                      <span>${selectedOrder.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-stone-800 flex justify-between items-end">
                    <span className="font-black text-lg">Total</span>
                    <span className="text-4xl font-black text-tomato-500">${selectedOrder.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                  className="flex-1 px-6 py-4 bg-stone-100 rounded-2xl font-bold text-stone-600 outline-none border-none appearance-none cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-10 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-200"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
