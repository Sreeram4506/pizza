import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import { OrderService } from '../services/OrderService'
import { resolveAssetUrl } from '../utils/env'

const todayISO = () => new Date().toISOString().split('T')[0]

const formatScheduled = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return ''
  const d = new Date(`${dateStr}T${timeStr}`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function CartDrawer({ isOpen, onClose }) {
  const {
    cart,
    addToCart,
    removeFromCart,
    deleteItem,
    clearCart,
  } = useChatbot()
  const { settings } = useSettings()

  const [view, setView] = useState('cart') // 'cart' | 'checkout' | 'confirmation'
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [orderType, setOrderType] = useState('pickup')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [timing, setTiming] = useState('asap') // 'asap' | 'scheduled'
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [orderId, setOrderId] = useState(null)
  const [orderTotal, setOrderTotal] = useState(0)

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0)
  }, [cart])

  const deliveryFee = orderType === 'delivery' ? 3.99 : 0
  const tax = (cartTotal + deliveryFee) * 0.08
  const total = cartTotal + deliveryFee + tax
  const pointsToEarn = Math.floor(total * 0.05)
  const scheduledLabel = formatScheduled(scheduledDate, scheduledTime)

  const handleCheckout = () => {
    if (timing === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      toast.error('Pick a date and time for your scheduled order')
      return
    }
    setView('checkout')
  }

  const handlePlaceOrder = async () => {
    if (!guestName || !guestPhone) {
      toast.error('Please fill in name and phone')
      return
    }
    if (timing === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      toast.error('Please select a date and time')
      return
    }

    setIsPlacingOrder(true)
    try {
      const orderData = {
        items: cart.map(item => ({
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.qty || 1,
          modifiers: [],
          notes: ''
        })),
        type: orderType,
        customerInfo: {
          name: guestName,
          phone: guestPhone,
          email: guestEmail
        },
        address: {
          street: orderType === 'delivery' ? '' : 'Pickup',
          city: '',
          zip: ''
        },
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cash' ? 'pending' : 'pending'
        },
        ...(timing === 'scheduled' && scheduledDate && scheduledTime
          ? { pickupDateTime: new Date(`${scheduledDate}T${scheduledTime}`).toISOString() }
          : {})
      }

      const result = await OrderService.placeOrder(orderData)
      setOrderId(result._id)
      setOrderTotal(result.total)
      clearCart()
      setView('confirmation')
      toast.success('Order placed successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to place order')
      console.error(err)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const handleClose = () => {
    if (view === 'confirmation') {
      setView('cart')
      setGuestName('')
      setGuestPhone('')
      setGuestEmail('')
      setOrderType('pickup')
      setPaymentMethod('cash')
      setTiming('asap')
      setScheduledDate('')
      setScheduledTime('')
    }
    onClose()
  }

  return (
    <>
      {/* Fullscreen Checkout Overlay */}
      <AnimatePresence>
        {isOpen && view === 'checkout' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#FAFAF8] z-50 flex flex-col overflow-y-auto"
          >
            {/* Checkout Header */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-5 bg-white/90 backdrop-blur-md border-b border-[#EBEBE6]">
              <button
                onClick={() => setView('cart')}
                className="flex items-center gap-2 text-[#1A1410]/60 hover:text-[#1A1410] font-bold text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to cart
              </button>
              <h2 className="font-display font-black italic text-xl text-[#1A1410] tracking-tight">Checkout</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-[#1A1410]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Checkout Content - Two Column */}
            <div className="flex flex-col lg:flex-row flex-1 max-w-[1200px] w-full mx-auto lg:gap-10 px-6 lg:px-0 py-8 lg:py-12">
              {/* Left: Form */}
              <div className="flex-1 min-w-0 max-w-xl">
                <div className="space-y-8">
                  {/* Contact */}
                  <section>
                    <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B8D74] font-bold mb-4">Contact</h3>
                    <div className="bg-white rounded-[20px] border border-[#EBEBE6] p-6 space-y-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <div>
                        <label className="block text-[13px] font-bold text-[#1A1410]/70 mb-1.5 ml-1">Full name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full px-4 py-3 border border-[#EBEBE6] rounded-[12px] bg-white placeholder:text-[#1A1410]/30
                            focus:outline-none focus:border-[#1A1410] transition-colors text-[15px] font-semibold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[13px] font-bold text-[#1A1410]/70 mb-1.5 ml-1">Phone</label>
                          <input
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            className="w-full px-4 py-3 border border-[#EBEBE6] rounded-[12px] bg-white placeholder:text-[#1A1410]/30
                              focus:outline-none focus:border-[#1A1410] transition-colors text-[15px] font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-bold text-[#1A1410]/70 mb-1.5 ml-1">Email (optional)</label>
                          <input
                            type="email"
                            placeholder="john@example.com"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-[#EBEBE6] rounded-[12px] bg-white placeholder:text-[#1A1410]/30
                              focus:outline-none focus:border-[#1A1410] transition-colors text-[15px] font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* When & where */}
                  <section>
                    <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B8D74] font-bold mb-4">When &amp; where</h3>
                    <div className="bg-white rounded-[20px] border border-[#EBEBE6] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 shrink-0 text-[#1A1410]/40 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {orderType === 'delivery' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                          )}
                        </svg>
                        <div>
                          <p className="text-[15px] font-bold text-[#1A1410] capitalize">{orderType}</p>
                          <p className="text-[13px] font-semibold text-[#1A1410]/50 mt-0.5">
                            {timing === 'scheduled' && scheduledLabel ? scheduledLabel : `ASAP · ${orderType === 'delivery' ? '35-45' : '15-20'} min`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setView('cart')}
                        className="text-[12px] font-bold text-ember-600 hover:underline shrink-0 mt-0.5"
                      >
                        Change
                      </button>
                    </div>
                  </section>

                  {/* Payment */}
                  <section>
                    <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B8D74] font-bold mb-4">Payment</h3>
                    <div className="bg-white rounded-[20px] border border-[#EBEBE6] p-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex gap-2">
                      {['cash', 'card'].map(method => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-[13.5px] font-bold transition-all ${
                            paymentMethod === method
                              ? 'bg-[#1A1410] text-white shadow-md'
                              : 'text-[#1A1410]/50 hover:bg-[#F5F5F0]'
                          }`}
                        >
                          {method === 'card' ? 'Card on delivery' : 'Cash on delivery'}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Right: Order Summary (sticky, dark surface) */}
              <div className="lg:w-[380px] shrink-0 mt-8 lg:mt-0">
                <div className="lg:sticky lg:top-28 bg-[#1A1410] rounded-[28px] p-7 flex flex-col gap-6 shadow-[0_20px_60px_rgba(26,20,16,0.25)]">
                  <div>
                    <h3 className="font-display font-black italic text-lg text-white mb-5">Order summary</h3>

                    {/* Cart Items */}
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {cart.map(item => (
                        <div key={item._id} className="flex justify-between gap-3 text-sm pb-3 border-b border-white/10">
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{item.name}</p>
                            <p className="text-xs text-white/40 mt-0.5">Qty {item.qty}</p>
                          </div>
                          <span className="font-bold text-white shrink-0">${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[13.5px] font-semibold text-white/50">
                      <span>Subtotal</span>
                      <span className="text-white/80">${cartTotal.toFixed(2)}</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-[13.5px] font-semibold text-white/50">
                        <span>Delivery fee</span>
                        <span className="text-white/80">${deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13.5px] font-semibold text-white/50">
                      <span>Tax</span>
                      <span className="text-white/80">${tax.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/10" />

                  {/* Grand Total */}
                  <div className="flex justify-between items-baseline">
                    <span className="font-display font-black text-white text-lg">Total</span>
                    <span className="font-display font-black text-ember-400 text-3xl tracking-tight">${total.toFixed(2)}</span>
                  </div>

                  {/* Points */}
                  {pointsToEarn > 0 && (
                    <div className="bg-white/[0.06] border border-white/10 rounded-[14px] px-4 py-3 flex items-center gap-2.5 text-[13px] text-amber-400 font-bold">
                      <span className="text-base">🏆</span> Earn {pointsToEarn} points with this order
                    </div>
                  )}

                  {/* Action Button */}
                  <motion.button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="w-full py-4 rounded-full bg-ember-600 text-white font-bold text-[15px] tracking-wide
                      shadow-lg shadow-ember-600/30
                      hover:bg-ember-500 active:scale-[0.98]
                      disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none disabled:cursor-not-allowed
                      transition-all duration-150"
                    whileHover={!isPlacingOrder ? { scale: 1.02 } : {}}
                    whileTap={!isPlacingOrder ? { scale: 0.98 } : {}}
                  >
                    {isPlacingOrder ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block animate-spin">⏳</span>
                        Placing order...
                      </span>
                    ) : (
                      `Place order · $${total.toFixed(2)}`
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for cart drawer */}
      <AnimatePresence>
        {isOpen && view !== 'checkout' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#1A1410]/40 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer Sidebar */}
      {view !== 'checkout' && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: isOpen ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-screen w-full sm:w-[420px] bg-[#FAFAF8] shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBEBE6] bg-white">
            <h2 className="font-display font-black italic text-2xl text-[#1A1410] tracking-tight">
              {view === 'confirmation' ? 'Order confirmed' : 'Your cart'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-[#1A1410]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {view === 'cart' && (
              <>
                {/* Order Type Toggle */}
                <div className="mb-6">
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B8D74] font-bold mb-2">Order type</p>
                  <div className="flex gap-2 bg-white rounded-full p-1 border border-[#EBEBE6] w-fit">
                    {['pickup', 'delivery'].map(t => (
                      <button
                        key={t}
                        onClick={() => setOrderType(t)}
                        className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-all ${
                          orderType === t ? 'bg-[#1A1410] text-white shadow-md' : 'text-[#1A1410]/50 hover:text-[#1A1410]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scheduled delivery / pickup time */}
                <div className="mb-6">
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B8D74] font-bold mb-2">
                    When would you like it?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTiming('asap')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] border text-[13.5px] font-bold transition-all ${
                        timing === 'asap'
                          ? 'border-ember-600 bg-ember-50 text-ember-700'
                          : 'border-[#EBEBE6] bg-white text-[#1A1410]/60 hover:border-[#1A1410]/20'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      ASAP
                    </button>
                    <button
                      onClick={() => setTiming('scheduled')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] border text-[13.5px] font-bold transition-all ${
                        timing === 'scheduled'
                          ? 'border-ember-600 bg-ember-50 text-ember-700'
                          : 'border-[#EBEBE6] bg-white text-[#1A1410]/60 hover:border-[#1A1410]/20'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Schedule
                    </button>
                  </div>

                  <AnimatePresence>
                    {timing === 'scheduled' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 grid grid-cols-2 gap-3 p-4 bg-white rounded-[16px] border border-[#EBEBE6]">
                          <div>
                            <label className="block text-[11px] font-bold text-[#1A1410]/50 uppercase tracking-wider mb-1.5">Date</label>
                            <input
                              type="date"
                              min={todayISO()}
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="w-full px-3 py-2.5 border border-[#EBEBE6] rounded-[10px] bg-white text-[13.5px] font-semibold
                                focus:outline-none focus:border-[#1A1410] transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#1A1410]/50 uppercase tracking-wider mb-1.5">Time</label>
                            <input
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="w-full px-3 py-2.5 border border-[#EBEBE6] rounded-[10px] bg-white text-[13.5px] font-semibold
                                focus:outline-none focus:border-[#1A1410] transition-colors"
                            />
                          </div>
                        </div>
                        {scheduledLabel && (
                          <p className="mt-2 text-[12px] font-semibold text-ember-600 ml-1">
                            Scheduled for {scheduledLabel}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {timing === 'asap' && (
                    <div className="flex items-center gap-2 mt-2 ml-1 text-xs font-semibold text-[#1A1410]/40">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11.3 1.046A1 1 0 0112 2v6h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 19v-6H4a1 1 0 01-.82-1.573l7-10a1 1 0 01.98-.38z" />
                      </svg>
                      Ready in {orderType === 'delivery' ? '35-45' : '15-20'} minutes
                    </div>
                  )}
                </div>

                {/* Cart Items */}
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-6 text-[#1A1410]/20 py-12">
                    <span className="text-5xl">🛒</span>
                    <p className="text-lg font-medium text-[#1A1410]/40">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {cart.map(item => (
                      <div key={item._id} className="flex gap-3 p-3 bg-white rounded-[16px] border border-[#EBEBE6]">
                        <img
                          src={item.image ? resolveAssetUrl(item.image) : '/pizza-hero-poster.svg'}
                          alt={item.name}
                          className="w-16 h-16 rounded-[12px] object-cover bg-[#F5F5F0] border border-[#EBEBE6] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#1A1410] text-sm truncate">{item.name}</p>
                          <p className="text-xs text-[#1A1410]/40 mt-0.5">${item.price.toFixed(2)}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-2 bg-[#F5F5F0] rounded-full px-1.5 py-1">
                              <button
                                onClick={() => removeFromCart(item._id)}
                                className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#1A1410]/70 text-xs font-bold hover:text-ember-600 shadow-sm"
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-[#1A1410]">{item.qty}</span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#1A1410]/70 text-xs font-bold hover:text-ember-600 shadow-sm"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => deleteItem(item._id)}
                              className="ml-auto p-1 text-[#1A1410]/25 hover:text-ember-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <span className="font-bold text-[#1A1410] text-sm shrink-0">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {cart.length > 0 && (
                  <>
                    <div className="p-5 bg-[#1A1410] rounded-[20px] mb-6">
                      <div className="space-y-2.5 mb-3">
                        <div className="flex justify-between text-[13.5px] font-semibold text-white/50">
                          <span>Subtotal</span>
                          <span className="text-white/80">${cartTotal.toFixed(2)}</span>
                        </div>
                        {orderType === 'delivery' && (
                          <div className="flex justify-between text-[13.5px] font-semibold text-white/50">
                            <span>Delivery fee</span>
                            <span className="text-white/80">${deliveryFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[13.5px] font-semibold text-white/50">
                          <span>Tax</span>
                          <span className="text-white/80">${tax.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                        <span className="font-display font-black text-white">Total</span>
                        <span className="font-display font-black text-2xl text-ember-400">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {pointsToEarn > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-3 mb-6 text-center text-sm text-amber-700 font-bold">
                        🏆 You'll earn {pointsToEarn} points with this order
                      </div>
                    )}

                    <motion.button
                      onClick={handleCheckout}
                      className="w-full py-4 rounded-full bg-ember-600 text-white font-bold text-[15px]
                        shadow-lg shadow-ember-600/25
                        hover:bg-ember-500 active:scale-[0.98]
                        transition-all duration-150"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Go to checkout
                    </motion.button>
                  </>
                )}
              </>
            )}

            {view === 'confirmation' && (
              <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
                <div className="w-16 h-16 bg-ember-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-ember-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-black italic text-[#1A1410] mb-2">Order confirmed!</h3>
                  <p className="text-sm text-[#1A1410]/40">Order ID: {orderId}</p>
                  <p className="text-lg font-bold text-ember-600 mt-4">${orderTotal.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  )
}
