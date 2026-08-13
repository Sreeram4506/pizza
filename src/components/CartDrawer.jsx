import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import { OrderService } from '../services/OrderService'
import { resolveAssetUrl } from '../utils/env'

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
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [orderId, setOrderId] = useState(null)
  const [orderTotal, setOrderTotal] = useState(0)

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0)
  }, [cart])

  const deliveryFee = orderType === 'delivery' ? 3.99 : 0
  const tax = (cartTotal + deliveryFee) * 0.08
  const total = cartTotal + deliveryFee + tax
  const pointsToEarn = Math.floor(total * 0.05)

  const handleCheckout = () => {
    setView('checkout')
  }

  const handlePlaceOrder = async () => {
    if (!guestName || !guestPhone) {
      toast.error('Please fill in name and phone')
      return
    }
    if (!pickupDate || !pickupTime) {
      toast.error('Please select date and time')
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
        }
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
      setPickupDate('')
      setPickupTime('')
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
            className="fixed inset-0 bg-mozzarella-100 z-50 flex flex-col overflow-y-auto"
          >
            {/* Checkout Header */}
            <div className="sticky top-0 z-50 flex items-center justify-between p-6 bg-white border-b border-crust-100 shadow-sm">
              <h2 className="font-display font-black text-2xl text-wood-800">Checkout</h2>
              <button
                onClick={() => setView('cart')}
                className="p-2 hover:bg-crust-50 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-wood-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Checkout Content - Two Column */}
            <div className="flex flex-col lg:flex-row flex-1">
              {/* Left: Form */}
              <div className="flex-1 p-8 lg:p-12 overflow-y-auto max-w-2xl">
                {/* Guest Info */}
                <div className="space-y-4 mb-8">
                  <h3 className="font-bold text-wood-800 text-lg mb-4">Delivery Information</h3>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-4 py-3 border border-crust-100 rounded-lg focus:ring-2 focus:ring-tomato-600 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-crust-100 rounded-lg focus:ring-2 focus:ring-tomato-600 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-crust-100 rounded-lg focus:ring-2 focus:ring-tomato-600 focus:border-transparent"
                  />
                </div>

                {/* Pickup Date & Time */}
                <div className="space-y-4 mb-8">
                  <h3 className="font-bold text-wood-800 text-lg mb-4">Pickup Date & Time</h3>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-4 py-3 border border-crust-100 rounded-lg focus:ring-2 focus:ring-tomato-600 focus:border-transparent"
                  />
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-4 py-3 border border-crust-100 rounded-lg focus:ring-2 focus:ring-tomato-600 focus:border-transparent"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="font-bold text-wood-800 text-lg mb-4">Payment Method</h3>
                  <div className="space-y-2">
                    {['card', 'cash'].map(method => (
                      <label key={method} className="flex items-center gap-3 p-4 border border-crust-100 rounded-lg cursor-pointer hover:bg-crust-50 transition-colors">
                        <input
                          type="radio"
                          name="payment"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="font-semibold text-wood-800 capitalize">{method === 'card' ? 'Card Payment' : 'Cash on Delivery'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Order Summary (sticky) */}
              <div className="lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-crust-100 p-8 flex flex-col gap-6 lg:sticky lg:top-0 lg:h-screen">
                <div>
                  <h3 className="font-bold text-wood-800 mb-4 text-lg">Order Summary</h3>

                  {/* Cart Items */}
                  <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item._id} className="flex justify-between text-sm pb-3 border-b border-crust-50">
                        <div>
                          <p className="font-semibold text-wood-800">{item.name}</p>
                          <p className="text-xs text-wood-500">Qty: {item.qty}</p>
                        </div>
                        <span className="font-semibold text-wood-800">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-3 p-4 bg-crust-50 rounded-xl border border-crust-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-wood-600">Subtotal</span>
                    <span className="font-semibold text-wood-800">${cartTotal.toFixed(2)}</span>
                  </div>
                  {orderType === 'delivery' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-wood-600">Delivery Fee</span>
                      <span className="font-semibold text-wood-800">${deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t border-crust-200 pt-3">
                    <span className="text-wood-600">Tax</span>
                    <span className="font-semibold text-wood-800">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-crust-200 pt-3">
                    <span className="text-wood-800">Total</span>
                    <span className="text-tomato-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Points */}
                {pointsToEarn > 0 && (
                  <div className="bg-tomato-50 border border-tomato-100 rounded-lg p-4 text-center text-sm text-tomato-700 font-semibold">
                    You'll earn {pointsToEarn} points
                  </div>
                )}

                {/* Action Button */}
                <motion.button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full py-4 rounded-xl bg-tomato-600 text-white font-bold shadow-lg shadow-tomato-600/20 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </motion.button>
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
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer Sidebar */}
      {view !== 'checkout' && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: isOpen ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-screen w-full sm:w-96 bg-mozzarella-100 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-crust-100 bg-white">
            <h2 className="font-display font-black text-2xl text-wood-800">
              {view === 'confirmation' ? 'Order Confirmed' : 'Cart'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-crust-50 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-wood-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="flex gap-2 mb-4 bg-white rounded-full p-1 border border-crust-100 w-fit">
                    {['pickup', 'delivery'].map(t => (
                      <button
                        key={t}
                        onClick={() => setOrderType(t)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                          orderType === t ? 'bg-tomato-600 text-white shadow-md' : 'text-wood-500 hover:text-tomato-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2 text-xs font-semibold text-wood-700 w-fit border border-crust-100">
                    <svg className="w-4 h-4 text-tomato-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11.3 1.046A1 1 0 0112 2v6h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 19v-6H4a1 1 0 01-.82-1.573l7-10a1 1 0 01.98-.38z" />
                    </svg>
                    ASAP (20 min)
                  </div>
                </div>

                {/* Cart Items */}
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-6 text-wood-300 py-12">
                    <span className="text-5xl">🛒</span>
                    <p className="text-lg font-medium text-wood-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item._id} className="flex gap-3 pb-4 border-b border-crust-100">
                        <img
                          src={item.image ? resolveAssetUrl(item.image) : '/pizza-hero-poster.svg'}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover bg-white border border-crust-100"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-wood-800 text-sm">{item.name}</p>
                          <p className="text-xs text-wood-500 mt-1">${item.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="w-6 h-6 rounded-full bg-white border border-crust-100 flex items-center justify-center text-wood-600 text-xs font-bold hover:text-tomato-600"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-xs font-semibold text-wood-800">{item.qty}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-6 h-6 rounded-full bg-white border border-crust-100 flex items-center justify-center text-wood-600 text-xs font-bold hover:text-tomato-600"
                            >
                              +
                            </button>
                            <button
                              onClick={() => deleteItem(item._id)}
                              className="ml-auto p-1 text-wood-400 hover:text-tomato-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <span className="font-semibold text-wood-800 text-sm">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {cart.length > 0 && (
                  <>
                    <div className="space-y-2 mb-6 p-4 bg-white rounded-xl border border-crust-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-wood-600">Subtotal</span>
                        <span className="font-semibold text-wood-800">${cartTotal.toFixed(2)}</span>
                      </div>
                      {orderType === 'delivery' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-wood-600">Delivery Fee</span>
                          <span className="font-semibold text-wood-800">${deliveryFee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm border-t border-crust-100 pt-2">
                        <span className="text-wood-600">Tax</span>
                        <span className="font-semibold text-wood-800">${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t border-crust-100 pt-2">
                        <span className="text-wood-800">Total</span>
                        <span className="text-tomato-600">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {pointsToEarn > 0 && (
                      <div className="bg-tomato-50 border border-tomato-100 rounded-lg p-3 mb-6 text-center text-sm text-tomato-700 font-semibold">
                        You'll earn {pointsToEarn} points with this order
                      </div>
                    )}

                    <motion.button
                      onClick={handleCheckout}
                      className="w-full py-4 rounded-xl bg-tomato-600 text-white font-bold shadow-lg shadow-tomato-600/20"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Go to Checkout
                    </motion.button>
                  </>
                )}
              </>
            )}

            {view === 'confirmation' && (
              <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-wood-800 mb-2">Order Confirmed!</h3>
                  <p className="text-sm text-wood-500">Order ID: {orderId}</p>
                  <p className="text-lg font-bold text-tomato-600 mt-4">${orderTotal.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  )
}
