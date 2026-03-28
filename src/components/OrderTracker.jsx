import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const STEPS = {
  delivery: [
    { key: 'confirmed', label: 'Confirmed', icon: '📝', desc: 'Order received' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳', desc: 'Being made fresh' },
    { key: 'out_for_delivery', label: 'On the Way', icon: '🛵', desc: 'Driver en route' },
    { key: 'delivered', label: 'Delivered', icon: '✅', desc: 'Enjoy your meal!' },
  ],
  pickup: [
    { key: 'confirmed', label: 'Confirmed', icon: '📝', desc: 'Order received' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳', desc: 'Being made fresh' },
    { key: 'ready', label: 'Ready', icon: '🔔', desc: 'Come pick it up!' },
  ],
  dine_in: [
    { key: 'confirmed', label: 'Confirmed', icon: '📝', desc: 'Order received' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳', desc: 'Being made fresh' },
    { key: 'ready', label: 'Served', icon: '🍽️', desc: 'At your table!' },
  ]
}

export default function OrderTracker() {
  const { orderNumber: urlOrderNumber } = useParams()
  const location = useLocation()
  const [orderNumber, setOrderNumber] = useState(urlOrderNumber || location.state?.orderNumber || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [driverLocation, setDriverLocation] = useState(null)
  const [pollingActive, setPollingActive] = useState(false)
  const navigate = useNavigate()
  const pollRef = useRef(null)

  // Auto-track on mount if number is available
  useEffect(() => {
    if (orderNumber) trackOrder()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // Live polling every 15 seconds for active orders
  useEffect(() => {
    if (!order || ['delivered', 'completed', 'cancelled'].includes(order.status)) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(() => trackOrder(null, true), 15000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [order?.status])

  // Real-time WebSocket updates
  useEffect(() => {
    if (!order?._id) return
    const socket = io('/', { transports: ['websocket', 'polling'] })
    socket.emit('join', `order:${order._id}`)
    socket.on('order:driver_location', (loc) => setDriverLocation(loc))
    socket.on('order:status_update', (data) => setOrder(prev => prev ? { ...prev, status: data.status } : null))
    return () => { socket.off('order:driver_location'); socket.off('order:status_update'); socket.disconnect() }
  }, [order?._id])

  const trackOrder = async (e, silent = false) => {
    if (e) e.preventDefault()
    const num = orderNumber || urlOrderNumber || location.state?.orderNumber
    if (!num) { setError('Please enter an order number'); return }
    if (!silent) { setLoading(true); setError('') }

    try {
      const res = await fetch(`/api/orders/track/${num.toUpperCase()}`)
      if (!res.ok) throw new Error('Order not found')
      const data = await res.json()
      setOrder(data)
      if (data.driverLocation) setDriverLocation(data.driverLocation)
    } catch {
      if (!silent) setError('Order not found. Please check your order number.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const steps = STEPS[order?.type] || STEPS.delivery
  const currentStepIdx = steps.findIndex(s => s.key === order?.status)
  const progressPct = order ? Math.min(100, ((currentStepIdx + 1) / steps.length) * 100) : 0

  const getETA = () => {
    const t = order?.estimatedDeliveryAt || order?.estimatedReadyAt || order?.estimatedDineInTime
    if (t) return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (['confirmed', 'preparing'].includes(order?.status)) return '~25 min'
    if (order?.status === 'out_for_delivery') return 'Arriving soon!'
    return 'Ready'
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-20 pb-24 sm:pt-28 sm:pb-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-10">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[#8A7A62] font-bold text-xs uppercase tracking-widest hover:text-[#1A1410] transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-[#1A1410]">Track Order</h1>
        </motion.div>

        {/* Search Bar */}
        <motion.form 
          onSubmit={trackOrder} 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex gap-3 mb-8"
        >
          <input
            type="text" value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. ORD-A1B2C3"
            className="flex-1 h-12 sm:h-14 bg-white border border-[#EBEBE6] rounded-2xl px-5 text-[15px] font-semibold outline-none focus:ring-2 focus:ring-[#1A1410]/20 focus:border-[#1A1410] transition-all placeholder:text-[#B8AA8F]"
          />
          <button type="submit" disabled={loading}
            className="h-12 sm:h-14 px-6 sm:px-8 bg-[#1A1410] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black disabled:opacity-50 transition-all shrink-0 shadow-lg">
            {loading ? '...' : 'Track'}
          </button>
        </motion.form>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-semibold text-center">
            {error}
          </motion.div>
        )}

        {/* Order Card */}
        <AnimatePresence mode="wait">
          {order && (
            <motion.div 
              key={order.orderNumber}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Status Hero */}
              <div className="bg-white rounded-[1.75rem] border border-[#EBEBE6] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                {/* Top banner */}
                <div className="bg-[#1A1410] text-white p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Order #{order.orderNumber}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      ['delivered', 'completed'].includes(order.status) ? 'bg-green-500/20 text-green-400' :
                      order.status === 'out_for_delivery' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-[#EBB250]/20 text-[#EBB250]'
                    }`}>
                      {order.status === 'out_for_delivery' ? 'On the way' : order.status}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl sm:text-3xl font-serif tracking-tight">{steps[currentStepIdx]?.icon || '📋'} {steps[currentStepIdx]?.label || order.status}</p>
                      <p className="text-white/50 text-xs font-bold mt-1">{steps[currentStepIdx]?.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">ETA</p>
                      <p className="text-lg sm:text-xl font-black text-[#EBB250]">{getETA()}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="px-5 sm:px-6 py-6">
                  {/* Progress bar */}
                  <div className="relative h-1.5 bg-[#F0EDE7] rounded-full mb-6 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#EBB250] to-[#C1440E] rounded-full"
                    />
                  </div>

                  {/* Step indicators */}
                  <div className="flex justify-between">
                    {steps.map((step, i) => {
                      const isActive = i <= currentStepIdx
                      const isCurrent = i === currentStepIdx
                      return (
                        <div key={step.key} className={`flex flex-col items-center transition-all ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm sm:text-base mb-2 transition-all ${
                            isCurrent ? 'bg-[#1A1410] text-white shadow-lg scale-110' : isActive ? 'bg-[#EBB250]/15 text-[#1A1410]' : 'bg-[#F0EDE7] text-[#B8AA8F]'
                          }`}>
                            {step.icon}
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-center leading-tight w-14 sm:w-16">{step.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Live Map (delivery + out_for_delivery) */}
              <AnimatePresence>
                {order.status === 'out_for_delivery' && driverLocation && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="bg-white rounded-[1.75rem] border border-[#EBEBE6] overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0EDE7]">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1410] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Location
                        </h3>
                        <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-tight">GPS Active</span>
                      </div>
                      <div className="relative w-full h-48 sm:h-64">
                        <iframe
                          key={`${driverLocation.lat}-${driverLocation.lng}`}
                          className="absolute inset-0 w-full h-full"
                          frameBorder="0" scrolling="no"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${driverLocation.lng - 0.005}%2C${driverLocation.lat - 0.005}%2C${driverLocation.lng + 0.005}%2C${driverLocation.lat + 0.005}&layer=mapnik&marker=${driverLocation.lat}%2C${driverLocation.lng}`}
                        />
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-[10px] font-bold text-[#1A1410]/60 pointer-events-none">
                          📍 Driver's Position
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Order Details */}
              <div className="bg-white rounded-[1.75rem] border border-[#EBEBE6] overflow-hidden shadow-sm">
                {/* Summary Header */}
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-[#F0EDE7]">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1410]/40">Order Summary</h3>
                    <span className="text-[10px] font-bold text-[#8A7A62]">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-bold text-[#8A7A62] mt-2">
                    <span className="capitalize">{order.type === 'dine_in' ? 'Dine-In' : order.type}</span>
                    <span>•</span>
                    <span className="capitalize">{order.payment?.method || 'N/A'} — {order.payment?.status || 'N/A'}</span>
                    {order.type === 'delivery' && order.address?.street && (
                      <>
                        <span>•</span>
                        <span>{order.address.street}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="px-5 sm:px-6 py-4 space-y-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13px] sm:text-[14px] font-bold text-[#1A1410] truncate">{item.name}</span>
                          <span className="text-[12px] text-[#8A7A62] font-medium shrink-0">×{item.quantity}</span>
                        </div>
                        {item.modifiers?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.modifiers.map((mod, mi) => (
                              <span key={mi} className="text-[9px] font-bold bg-[#F5F3EF] text-[#8A7A62] px-1.5 py-0.5 rounded uppercase tracking-tight">+{mod}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[13px] sm:text-[14px] font-bold text-[#1A1410] shrink-0">
                        ${(Number(item.price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="px-5 sm:px-6 py-4 bg-[#FAFAF8] border-t border-[#F0EDE7] space-y-1.5">
                  {order.subtotal > 0 && (
                    <div className="flex justify-between text-[12px] font-semibold text-[#8A7A62]">
                      <span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-[12px] font-semibold text-[#8A7A62]">
                      <span>Tax</span><span>${Number(order.tax).toFixed(2)}</span>
                    </div>
                  )}
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-[12px] font-semibold text-[#8A7A62]">
                      <span>Delivery</span><span>${Number(order.deliveryFee).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-[#EBEBE6]">
                    <span className="text-[15px] sm:text-[16px] font-black text-[#1A1410]">Total</span>
                    <span className="text-[15px] sm:text-[16px] font-black text-[#1A1410]">${Number(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => navigate('/#contact')}
                  className="flex-1 h-12 sm:h-14 bg-white border border-[#EBEBE6] text-[#1A1410] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#F5F3EF] transition-all shadow-sm">
                  Contact Us
                </button>
                <button onClick={() => navigate('/menu')}
                  className="flex-1 h-12 sm:h-14 bg-[#1A1410] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-lg">
                  Order Again
                </button>
              </div>

              {/* Customer info footer */}
              <div className="text-center mt-2">
                <p className="text-[10px] text-[#B8AA8F] font-bold">
                  {order.customerInfo?.name} · Placed {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
