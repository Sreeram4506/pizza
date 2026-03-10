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
  const [deliveryUsers, setDeliveryUsers] = useState([])
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
    fetchDeliveryUsers()
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
        setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) fetchOrders()
    } catch (err) {
      console.error('Failed to update order status:', err)
    }
  }

  const assignDriver = async (orderId, driverId) => {
    if (!driverId) return;
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPersonId: driverId })
      })
      if (res.ok) {
        fetchOrders()
        setSelectedOrder(null)
      }
    } catch (err) {
      console.error('Failed to assign driver:', err)
    }
  }

  const fetchDeliveryUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/delivery-users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setDeliveryUsers(await res.json())
    } catch (err) {
      console.error('Failed to fetch delivery users', err)
    }
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter)

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-100'
      case 'preparing': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'ready': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      case 'out_for_delivery': return 'bg-indigo-50 text-indigo-600 border-indigo-100'
      case 'delivered':
      case 'completed': return 'bg-gray-50 text-gray-500 border-gray-100'
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100'
      default: return 'bg-slate-50 text-slate-500 border-slate-100'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-ember-100 border-t-ember-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-ember-600 rounded-full animate-ping" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-sans font-bold text-xl text-[#1A1410]">Syncing Kitchen...</p>
          <p className="text-sm text-[#9B8D74] mt-1">Connecting to live order stream</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 space-y-8 pb-32">
      {/* ── LIVE TOAST ────────────────────── */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-4 sm:right-12 z-[100] bg-white border border-ember-100 rounded-3xl shadow-2xl p-6 w-[calc(100%-2rem)] sm:max-w-md backdrop-blur-xl"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-ember-50 rounded-2xl flex items-center justify-center text-3xl shadow-ember-600/10 shadow-lg">🍕</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-sans font-bold text-xl text-[#1A1410]">New Order Incoming!</h4>
                  <button onClick={() => setNewOrderAlert(null)} className="text-[#9B8D74] hover:text-[#1A1410]">✕</button>
                </div>
                <p className="text-sm font-medium text-[#5C554E]">Order #{newOrderAlert.orderNumber} • ${newOrderAlert.total?.toFixed(2)}</p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => { setSelectedOrder(newOrderAlert); setNewOrderAlert(null) }}
                    className="flex-1 py-3 bg-[#F5F3EF] text-[#1A1410] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#EAE8E4] transition-all"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => { updateOrderStatus(newOrderAlert._id, 'preparing'); setNewOrderAlert(null) }}
                    className="flex-1 py-3 bg-ember-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:shadow-xl hover:shadow-ember-600/20 transition-all"
                  >
                    Start Cooking
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-ember-600 font-bold px-2 py-1 bg-ember-50 rounded-lg">Real-time Dashboard</span>
            {socket?.connected && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-emerald-600">Active</span>
              </div>
            )}
          </div>
          <h2 className="text-4xl sm:text-5xl font-sans font-bold text-[#1A1410] tracking-tight underline decoration-ember-600/20 underline-offset-8">
            Live Orders
          </h2>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[rgba(26,20,16,0.06)] shadow-sm">
          <div className="px-4 py-2 bg-[#F5F3EF] rounded-xl">
            <span className="font-sans font-bold text-[#1A1410] pr-2">{orders.length}</span>
            <span className="font-sans text-[10px] text-[#9B8D74] uppercase tracking-widest">Orders</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${soundEnabled ? 'bg-ember-50 text-ember-600' : 'bg-gray-100 text-gray-400 opacity-60'}`}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button onClick={fetchOrders} className="w-10 h-10 bg-white border border-[rgba(26,20,16,0.08)] text-[#1A1410] rounded-xl flex items-center justify-center hover:bg-[#F5F3EF] transition-all active:scale-95">
            🔄
          </button>
        </div>
      </header>

      {/* ── FILTERS ────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {['all', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => {
          const count = orders.filter(o => status === 'all' ? true : o.status === status).length
          const isActive = filter === status

          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all h-12 whitespace-nowrap border ${isActive
                  ? 'bg-[#1A1410] text-[#FAFAFA] border-[#1A1410] shadow-xl'
                  : 'bg-white text-[#5C554E] border-[rgba(26,20,16,0.08)] hover:border-ember-600/30'
                }`}
            >
              <span>{status.replace(/_/g, ' ')}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-ember-500' : 'bg-[#F5F3EF] text-[#9B8D74]'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── ORDERS GRID ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-[40px] py-32 px-4 border border-[rgba(26,20,16,0.06)] text-center shadow-sm">
            <div className="w-24 h-24 bg-[#FAFAF8] rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner">📦</div>
            <h3 className="font-sans font-bold text-3xl text-[#1A1410] mb-2">No {filter !== 'all' ? filter : ''} orders Found</h3>
            <p className="text-sm text-[#9B8D74]">New orders will appear here automatically when they arrive.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              layout
              key={order._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group bg-white rounded-[32px] p-6 border transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${(order.status === 'confirmed' || order.status === 'pending') ? 'border-ember-500 ring-4 ring-ember-500/5' : 'border-[rgba(26,20,16,0.06)]'
                }`}
            >
              <div className="flex flex-col h-full">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-sans font-bold text-2xl text-[#1A1410]">#{order.orderNumber}</span>
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-colors ${getStatusStyle(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#9B8D74]">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.type}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-sans text-ember-600">${order.total?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 mb-6">
                  <div className="space-y-2 mt-4 max-h-[160px] overflow-y-auto scrollbar-hide pr-1">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-[#F5F3EF] rounded-2xl group/item hover:bg-[#EAE8E4] transition-colors border border-transparent hover:border-[rgba(26,20,16,0.04)]">
                        <span className="flex-shrink-0 w-7 h-7 bg-white rounded-lg flex items-center justify-center font-sans text-[10px] font-bold text-ember-600 shadow-sm">{item.quantity}</span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#1A1410] truncate">{item.name}</p>
                          {item.modifiers?.length > 0 && (
                            <p className="text-[10px] text-[#9B8D74] font-medium leading-none mt-1">
                              {item.modifiers.map(m => m.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Details Summary */}
                <div className="pt-4 border-t border-[rgba(26,20,16,0.04)] mb-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-[#5C554E] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-ember-500 opacity-40"></span>
                      {order.customerInfo?.name || 'Guest'}
                    </p>
                    {order.type === 'delivery' && (
                      <div className="px-2 py-0.5 bg-[#1A1410] text-amber-100 rounded text-[8px] font-black uppercase tracking-widest">Dlvry</div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="py-3.5 bg-[#F5F3EF] text-[#1A1410] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#EAE8E4] transition-all active:scale-95"
                  >
                    Details
                  </button>
                  {order.status === 'confirmed' && (
                    <button onClick={() => updateOrderStatus(order._id, 'preparing')} className="py-3.5 bg-ember-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-ember-600/10 hover:shadow-ember-600/30 transition-all active:scale-95">
                      Start Prep
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => updateOrderStatus(order._id, 'ready')} className="py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/30 transition-all active:scale-95">
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && order.type !== 'delivery' && (
                    <button onClick={() => updateOrderStatus(order._id, 'delivered')} className="py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:shadow-slate-900/30 transition-all active:scale-95">
                      Complete
                    </button>
                  )}
                  {order.status === 'ready' && order.type === 'delivery' && (
                    <button onClick={() => setSelectedOrder(order)} className="py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/30 transition-all active:scale-95">
                      Assign
                    </button>
                  )}
                  {(order.status === 'delivered' || order.status === 'out_for_delivery' || order.status === 'cancelled') && (
                    <button disabled className="py-3.5 bg-gray-50 text-gray-300 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-gray-100 cursor-not-allowed">
                      Locked
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── DETAIL MODAL ──────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-[#1A1410]/40 backdrop-blur-md z-[100] p-4 flex items-end sm:items-center justify-center overflow-y-auto" onClick={() => setSelectedOrder(null)}>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-[640px] rounded-[48px] border border-[rgba(26,20,16,0.06)] p-8 sm:p-12 shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-8 right-8 w-12 h-12 bg-[#F5F3EF] rounded-full flex items-center justify-center text-[#1A1410] hover:bg-ember-50 hover:text-ember-600 transition-all active:scale-95"
              >
                ✕
              </button>

              <div className="mb-10 pt-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-ember-600 font-bold px-3 py-1 bg-ember-50 rounded-lg">Invoice Master</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyle(selectedOrder.status)}`}>{selectedOrder.status}</span>
                </div>
                <h3 className="text-5xl font-sans font-bold text-[#1A1410] tracking-tight">#{selectedOrder.orderNumber}</h3>
                <p className="text-[#9B8D74] text-sm mt-1 font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                {/* Left Column: Customer & Delivery */}
                <div className="space-y-8">
                  <div>
                    <h4 className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#9B8D74] mb-4">Customer Details</h4>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-[#1A1410]">{selectedOrder.customerInfo?.name || 'Guest Customer'}</p>
                      <p className="text-sm font-medium text-[#5C554E] hover:text-ember-600 transition-colors cursor-pointer">{selectedOrder.customerInfo?.phone || 'No Phone provided'}</p>
                      <p className="text-[11px] text-[#9B8D74] font-medium uppercase tracking-widest mt-2 px-2 py-0.5 bg-[#F5F3EF] inline-block rounded-md">{selectedOrder.type}</p>
                    </div>
                  </div>

                  {selectedOrder.type === 'delivery' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <h4 className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#9B8D74] mb-4">Logistics Information</h4>
                      <div className="p-5 bg-ember-50/30 rounded-3xl border border-ember-100/50">
                        <p className="text-[13px] font-bold text-[#1A1410] leading-relaxed">
                          {typeof selectedOrder.address === 'string'
                            ? selectedOrder.address
                            : `${selectedOrder.address?.street}, ${selectedOrder.address?.city}, ${selectedOrder.address?.zip}`}
                        </p>
                        {selectedOrder.address?.instructions && (
                          <div className="mt-4 pt-4 border-t border-ember-100/30">
                            <span className="text-[9px] font-bold uppercase text-ember-600 tracking-widest block mb-1">Kitchen Note</span>
                            <p className="text-xs italic text-[#5C554E] leading-relaxed">"{selectedOrder.address.instructions}"</p>
                          </div>
                        )}
                      </div>

                      {/* Driver Assignment Flow within details */}
                      {(selectedOrder.status === 'ready' || selectedOrder.status === 'out_for_delivery') && (
                        <div className="mt-6">
                          <label className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#9B8D74] block mb-3">Courier Selection</label>
                          {selectedOrder.status === 'out_for_delivery' ? (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-lg">🛵</div>
                              <div>
                                <p className="text-xs font-bold text-emerald-800">{selectedOrder.deliveryPersonId?.name?.toUpperCase() || 'Assigned Driver'}</p>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">In Transit</p>
                              </div>
                            </div>
                          ) : (
                            <select
                              onChange={(e) => assignDriver(selectedOrder._id, e.target.value)}
                              className="w-full h-14 bg-white border-2 border-[rgba(26,20,16,0.06)] rounded-2xl px-5 text-sm font-bold text-[#1A1410] focus:border-ember-600 outline-none transition-all appearance-none cursor-pointer"
                              defaultValue=""
                            >
                              <option value="" disabled>Deploy Courier...</option>
                              {deliveryUsers.map(driver => (
                                <option key={driver._id} value={driver._id}>{driver.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Right Column: Order Items */}
                <div>
                  <h4 className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#9B8D74] mb-4">Cart Inventory</h4>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-3 scrollbar-hide">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-start gap-4 p-4 bg-[#FAFAF8] rounded-3xl group/hover transition-all border border-transparent hover:border-[rgba(26,20,16,0.04)]">
                        <div className="flex gap-4 min-w-0">
                          <span className="w-8 h-8 bg-white border border-[rgba(26,20,16,0.06)] rounded-xl flex items-center justify-center text-[11px] font-bold text-[#1A1410]">{item.quantity}</span>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-[#1A1410] truncate">{item.name}</p>
                            {item.modifiers?.length > 0 && (
                              <p className="text-[10px] text-[#9B8D74] font-medium mt-0.5">
                                {item.modifiers.map(m => m.name).join(' • ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-sans font-bold text-ember-600">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t-2 border-dashed border-[rgba(26,20,16,0.06)]">
                    <div className="flex justify-between items-center px-4">
                      <span className="font-sans font-bold text-2xl text-[#1A1410]">Total Value</span>
                      <span className="text-4xl font-sans font-bold text-ember-600">${selectedOrder.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update Master Controller */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                    className="w-full h-16 bg-[#F5F3EF] border-none rounded-3xl px-8 text-sm font-bold uppercase tracking-[0.1em] text-[#1A1410] focus:ring-4 focus:ring-ember-500/10 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready for Handover</option>
                    <option value="out_for_delivery">In Transit</option>
                    <option value="delivered">Completed / Delivered</option>
                    <option value="cancelled">Void / Cancelled</option>
                  </select>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-[#9B8D74]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-12 h-16 bg-[#1A1410] text-white rounded-3xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:bg-ember-600 transition-all active:scale-95"
                >
                  Confirm Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  )
}
