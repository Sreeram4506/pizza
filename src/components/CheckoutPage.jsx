import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import { resolveMenuItemImage } from '../utils/menuArtwork'
import { OrderService } from '../services/OrderService'
import QuickLoginModal from './QuickLoginModal'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
if (!stripeKey) {
    console.warn('[STRIPE] VITE_STRIPE_PUBLISHABLE_KEY is missing from environment variables!');
}
const stripePromise = loadStripe(stripeKey);

export default function CheckoutPage() {
  const { cart, cartTotal, orderType, addToCart, removeFromCart, clearCart } = useChatbot()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const [tipPercent, setTipPercent] = useState(20)
  const [customTip, setCustomTip] = useState('')
  const [showCustomTip, setShowCustomTip] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [isPromoOpen, setIsPromoOpen] = useState(false)
  // Payment Method: 'card' or 'cash'
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setForm] = useState({
    mobile: '',
    firstName: '',
    lastName: '',
    email: '',
    promoEmail: true,
    promoText: false,
    street: '',
    city: '',
    zip: ''
  })

  const [userProfile, setUserProfile] = useState(null)
  const [addressBook, setAddressBook] = useState([])
  const [showAddressBook, setShowAddressBook] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('customerToken')
    if (!token) {
      setIsLoginModalOpen(true)
      return
    }
    fetchProfile(token)
  }, [])

  const fetchProfile = async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUserProfile(data.user)
        setAddressBook(data.user.addressBook || [])
        
        // Auto-fill
        const names = data.user.name.split(' ')
        setForm(prev => ({
          ...prev,
          firstName: names[0] || '',
          lastName: names.slice(1).join(' ') || '',
          email: data.user.email || '',
          mobile: data.user.phone || ''
        }))

        // Auto-select default address
        const defaultAddr = data.user.addressBook?.find(a => a.isDefault)
        if (defaultAddr) {
          setForm(prev => ({
            ...prev,
            street: defaultAddr.street,
            city: defaultAddr.city,
            zip: defaultAddr.zip
          }))
        }
      } else {
        localStorage.removeItem('customerToken')
        setIsLoginModalOpen(true)
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  const handleSelectAddress = (addr) => {
    setForm(prev => ({
      ...prev,
      street: addr.street,
      city: addr.city,
      zip: addr.zip
    }))
    setShowAddressBook(false)
    toast.success(`Selected ${addr.label}`)
  }

  // Calculations (Matched to Backend PricingService for Scaling)
  const taxRate = settings?.taxRate || 0.08 // Default to 8% to match backend
  const subtotal = cartTotal
  const taxes = subtotal * taxRate
  
  // Calculate Tip
  let tipAmount = 0
  if (showCustomTip && customTip) {
    tipAmount = parseFloat(customTip) || 0
  } else if (!showCustomTip) {
    tipAmount = subtotal * (tipPercent / 100)
  }

  const finalTotal = subtotal + taxes + tipAmount
  const pointsToEarn = Math.floor(finalTotal * (settings?.loyaltyPointsPerDollar || 10))


  const handlePlaceOrder = async (stripePaymentIntent) => {
    if (!formData.firstName || !formData.mobile || !formData.email) {
      alert('Please fill out your name, mobile, and email address.')
      return
    }

    if (orderType === 'delivery' && (!formData.street || !formData.city)) {
      alert('Please provide a delivery address.')
      return
    }

    setIsSubmitting(true)
    try {
      const order = await OrderService.placeOrder({
        items: cart.map((i) => ({
          itemId: i.itemId || i._id,
          name: i.name,
          quantity: i.qty || 1,
          price: i.price,
          modifiers: i.modifiers || []
        })),
        type: orderType || 'pickup',
        address: orderType === 'delivery' ? {
          street: formData.street,
          city: formData.city,
          zip: formData.zip || '',
          instructions: formData.instructions || ''
        } : null,
        customerInfo: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.mobile,
          email: formData.email,
          promoEmail: formData.promoEmail,
          promoText: formData.promoText
        },
        promoCode: promoCode,
        tip: tipAmount,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cash' ? 'pending' : 'paid',
          transactionId: paymentMethod === 'cash' ? '' : (stripePaymentIntent?.id || `CARD-${Date.now()}`)
        }
      })
      
      if (order && order.success) {
        clearCart()
        toast.success('Order placed successfully!')
        navigate(`/track/${order.orderNumber}`, { state: { order: order, isNew: true } })
      } else {
        alert(order?.error || 'Failed to place order. Please check your information.')
      }
    } catch (err) {
      console.error('Order placement fail:', err)
      alert('Network error or server issue. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold font-serif text-[#1A1410] mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/menu')} className="bg-[#EBB250] text-[#1A1410] px-6 py-3 rounded-full font-bold">Return to Menu</button>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
    <CheckoutInner
      cart={cart}
      cartTotal={cartTotal}
      orderType={orderType}
      addToCart={addToCart}
      removeFromCart={removeFromCart}
      clearCart={clearCart}
      settings={settings}
      formData={formData}
      setForm={setForm}
      tipPercent={tipPercent}
      setTipPercent={setTipPercent}
      customTip={customTip}
      setCustomTip={setCustomTip}
      showCustomTip={showCustomTip}
      setShowCustomTip={setShowCustomTip}
      promoCode={promoCode}
      setPromoCode={setPromoCode}
      isPromoOpen={isPromoOpen}
      setIsPromoOpen={setIsPromoOpen}
      paymentMethod={paymentMethod}
      setPaymentMethod={setPaymentMethod}
      isSubmitting={isSubmitting}
      setIsSubmitting={setIsSubmitting}
      userProfile={userProfile}
      addressBook={addressBook}
      showAddressBook={showAddressBook}
      setShowAddressBook={setShowAddressBook}
      isLoginModalOpen={isLoginModalOpen}
      setIsLoginModalOpen={setIsLoginModalOpen}
      handleSelectAddress={handleSelectAddress}
      fetchProfile={fetchProfile}
      handlePlaceOrder={handlePlaceOrder}
      subtotal={subtotal}
      taxes={taxes}
      tipAmount={tipAmount}
      finalTotal={finalTotal}
      pointsToEarn={pointsToEarn}
    />
    </Elements>
  )
}

function CheckoutInner({
  cart, cartTotal, orderType, addToCart, removeFromCart, clearCart, settings,
  formData, setForm, tipPercent, setTipPercent, customTip, setCustomTip,
  showCustomTip, setShowCustomTip, promoCode, setPromoCode, isPromoOpen, setIsPromoOpen,
  paymentMethod, setPaymentMethod, isSubmitting, setIsSubmitting,
  userProfile, addressBook, showAddressBook, setShowAddressBook,
  isLoginModalOpen, setIsLoginModalOpen, handleSelectAddress, fetchProfile,
  handlePlaceOrder, subtotal, taxes, tipAmount, finalTotal, pointsToEarn
}) {
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()
  const [cardError, setCardError] = useState(null)
  const [clientSecret, setClientSecret] = useState('')

  // Create PaymentIntent when card payment is selected
  useEffect(() => {
    if (paymentMethod === 'card' && finalTotal > 0) {
      const totalWithDelivery = finalTotal + (orderType === 'delivery' ? 3.99 : 0)
      fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalWithDelivery }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret)
          }
        })
        .catch(err => console.error('Payment intent error:', err))
    }
  }, [paymentMethod, finalTotal, orderType])

  const handleSubmitOrder = async () => {
    if (paymentMethod === 'card') {
      if (!stripe || !elements) {
        toast.error('Payment system is loading. Please wait...')
        return
      }
      setIsSubmitting(true)
      setCardError(null)

      if (!clientSecret) {
        toast.error('Payment not ready. Please wait a moment and try again.')
        setIsSubmitting(false)
        return
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      })

      if (error) {
        setCardError(error.message)
        setIsSubmitting(false)
        toast.error(`Payment failed: ${error.message}`)
        return
      }

      // Payment succeeded - place the order
      await handlePlaceOrder(paymentIntent)
    } else {
      // Cash payment - place order directly
      await handlePlaceOrder(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1410] font-sans selection:bg-[#EBB250] pb-24 md:pb-0 pt-[80px]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Main Grid Layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
          
          {/* LEFT COLUMN - Forms */}
          <div className="flex-1 w-full max-w-[600px] lg:max-w-none lg:pr-8">
            
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <button onClick={() => navigate('/menu')} className="flex items-center gap-2 text-[#1A1410]/60 hover:text-[#1A1410] font-bold text-sm mb-4 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Menu
              </button>
              <h1 className="text-4xl md:text-5xl font-serif tracking-tight font-bold text-[#1A1410]">Checkout</h1>
              
              {userProfile && (
                <div className="mt-4 flex items-center gap-3 bg-[#1A1410]/5 inline-flex px-4 py-2 rounded-full border border-[#1A1410]/10">
                  <div className="w-8 h-8 rounded-full bg-[#1A1410] text-[#FAFAF8] flex items-center justify-center text-xs font-bold">
                    {userProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[14px] font-bold text-[#1A1410]">Logged in as <span className="text-[#EBB250]">{userProfile.name}</span></span>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              
              {/* Details Box */}
              <section>
                <h3 className="text-[17px] font-bold text-[#1A1410] mb-4 font-serif">
                  {orderType === 'delivery' ? 'Delivery details' : 'Pickup details'}
                </h3>
                <div className="bg-white border border-[#EBEBE6] rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  {orderType === 'delivery' ? (
                    <div className="p-5 space-y-4">
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 shrink-0 text-[#1A1410]/50 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <div className="flex-1 space-y-3">
                          <span className="text-[15px] font-semibold text-[#1A1410] block">Deliver to:</span>
                          <input 
                            type="text" 
                            placeholder="Street address"
                            value={formData.street}
                            onChange={e => setForm({...formData, street: e.target.value})}
                            className="w-full bg-white border border-[#EBEBE6] rounded-[12px] px-4 py-3 outline-none focus:border-[#1A1410] transition-colors text-[14px] font-semibold"
                          />

                          {addressBook.length > 0 && (
                            <div className="relative">
                              <button 
                                onClick={() => setShowAddressBook(!showAddressBook)}
                                className="text-[13px] font-bold text-[#EBB250] flex items-center gap-1 hover:underline"
                              >
                                📖 Choose from address book ({addressBook.length})
                              </button>
                              
                              <AnimatePresence>
                                {showAddressBook && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute left-0 top-7 w-full max-w-[300px] bg-white border border-[#EBEBE6] rounded-xl shadow-xl z-20 p-2 space-y-1"
                                  >
                                    {addressBook.map((addr) => (
                                      <button
                                        key={addr._id}
                                        onClick={() => handleSelectAddress(addr)}
                                        className="w-full text-left p-3 hover:bg-[#F5F5F0] rounded-lg transition-colors group"
                                      >
                                        <p className="text-[14px] font-black text-[#1A1410] flex items-center justify-between">
                                          {addr.label}
                                          {addr.isDefault && <span className="text-[9px] bg-[#EBB250] text-[#1A1410] px-1.5 py-0.5 rounded uppercase">Default</span>}
                                        </p>
                                        <p className="text-[12px] text-[#1A1410]/60 truncate">{addr.street}, {addr.city}</p>
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              placeholder="City"
                              value={formData.city}
                              onChange={e => setForm({...formData, city: e.target.value})}
                              className="w-full bg-white border border-[#EBEBE6] rounded-[12px] px-4 py-3 outline-none focus:border-[#1A1410] transition-colors text-[14px] font-semibold"
                            />
                            <input 
                              type="text" 
                              placeholder="Zip code"
                              value={formData.zip}
                              onChange={e => setForm({...formData, zip: e.target.value})}
                              className="w-full bg-white border border-[#EBEBE6] rounded-[12px] px-4 py-3 outline-none focus:border-[#1A1410] transition-colors text-[14px] font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 shrink-0 text-[#1A1410]/50 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[15px] font-semibold text-[#1A1410]">
                          Estimated delivery: <span className="font-bold">40-55 min</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 shrink-0 text-[#1A1410]/50 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        <span className="text-[15px] font-semibold text-[#1A1410]">
                          Pick up from <span className="font-bold">{settings?.address || '997 Boston Providence Hwy, Norwood'}</span>
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 shrink-0 text-[#1A1410]/50 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[15px] font-semibold text-[#1A1410]">
                          Today by <span className="font-bold">ASAP (20 min)</span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="bg-[#FFFDF7] px-5 py-3 border-t border-[#EBEBE6]">
                    <span className="text-[13px] font-medium text-[#1A1410]/80">
                      You're saving <span className="font-bold text-[#EBB250]">$2.75</span> by ordering directly from us vs. other websites
                    </span>
                  </div>
                </div>
              </section>

              {/* Tip Selection */}
              <section>
                <h3 className="text-[17px] font-bold text-[#1A1410] mb-4 font-serif">Tip</h3>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {[10, 15, 20].map(pct => {
                    const tipVal = subtotal * (pct / 100);
                    const isActive = !showCustomTip && tipPercent === pct;
                    return (
                      <button 
                        key={pct}
                        onClick={() => { setTipPercent(pct); setShowCustomTip(false); }}
                        className={`h-16 rounded-[12px] flex flex-col items-center justify-center border transition-all ${
                          isActive 
                            ? 'bg-white border-[#1A1410] ring-1 ring-[#1A1410]' 
                            : 'bg-white border-[#EBEBE6] opacity-70 hover:opacity-100 hover:border-[#1A1410]/30'
                        }`}
                      >
                        <span className={`text-[15px] font-bold ${isActive ? 'text-[#1A1410]' : 'text-[#1A1410]'}`}>${tipVal.toFixed(2)}</span>
                        <span className={`text-[12px] font-semibold ${isActive ? 'text-[#1A1410]' : 'text-[#1A1410]/50'}`}>{pct}%</span>
                      </button>
                    )
                  })}
                  <button 
                    onClick={() => setShowCustomTip(!showCustomTip)}
                    className={`h-16 rounded-[12px] flex items-center justify-center border transition-all ${
                      showCustomTip 
                        ? 'bg-white border-[#1A1410] ring-1 ring-[#1A1410]' 
                        : 'bg-white border-[#EBEBE6] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="text-[14px] font-bold text-[#1A1410]">Custom</span>
                  </button>
                </div>
                {showCustomTip && (
                  <div className="mt-3">
                    <input 
                      type="number" 
                      placeholder="Enter custom amount" 
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      className="w-full bg-white border border-[#EBEBE6] rounded-[12px] px-4 py-3.5 outline-none focus:border-[#1A1410] transition-colors font-bold text-[15px]" 
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}
              </section>

              {/* Information Form */}
              <section>
                <h3 className="text-[17px] font-bold text-[#1A1410] mb-4 font-serif">Your information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#1A1410]/70 mb-1.5 ml-1">Mobile number</label>
                    <input 
                      type="tel" 
                      placeholder="(555) 555-5555"
                      value={formData.mobile}
                      onChange={e => setForm({...formData, mobile: e.target.value})}
                      className="w-full bg-white border border-[#EBEBE6] rounded-[12px] px-4 py-3.5 outline-none focus:border-[#1A1410] transition-colors text-[15px] font-semibold shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-bold text-[#1A1410]/70 mb-1.5 ml-1">First name</label>
                      <input 
                        type="text" 
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={e => setForm({...formData, firstName: e.target.value})}
                        className="w-full bg-white border border-[#EBEBE6] rounded-[12px] px-4 py-3.5 outline-none focus:border-[#1A1410] transition-colors text-[15px] font-semibold shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#1A1410]/70 mb-1.5 ml-1">Last name</label>
                      <input 
                        type="text" 
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={e => setForm({...formData, lastName: e.target.value})}
                        className="w-full bg-white border border-[#EBEBE6] rounded-[12px] px-4 py-3.5 outline-none focus:border-[#1A1410] transition-colors text-[15px] font-semibold shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#1A1410]/70 mb-1.5 ml-1">Email address</label>
                    <input 
                      type="email" 
                      placeholder="Email address"
                      value={formData.email}
                      onChange={e => setForm({...formData, email: e.target.value})}
                      className="w-full bg-white border border-[#EBEBE6] rounded-[12px] px-4 py-3.5 outline-none focus:border-[#1A1410] transition-colors text-[15px] font-semibold shadow-sm"
                    />
                  </div>

                  <div className="pt-2 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.promoEmail ? 'bg-[#1A1410] border-[#1A1410]' : 'border-[#1A1410]/30 group-hover:border-[#1A1410]/60'}`}>
                        {formData.promoEmail && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-[14px] font-semibold text-[#1A1410]/80 group-hover:text-[#1A1410] select-none">Get promotional emails from {settings?.restaurantName || 'Restaurant'}</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.promoText ? 'bg-[#1A1410] border-[#1A1410]' : 'border-[#1A1410]/30 group-hover:border-[#1A1410]/60'}`}>
                        {formData.promoText && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-[14px] font-semibold text-[#1A1410]/80 group-hover:text-[#1A1410] select-none">Get promotional texts from {settings?.restaurantName || 'Restaurant'}</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Payment Mock */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[17px] font-bold text-[#1A1410] font-serif">Payment</h3>
                </div>
                
                <div className="flex p-1 bg-[#F5F5F0] rounded-[14px] mb-6 shadow-inner w-full">
                  {[
                    { id: 'card', label: 'Credit/Debit Card' },
                    { id: 'cash', label: 'Cash on Delivery' }
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex-1 py-3 rounded-[10px] text-[13.5px] font-bold transition-all ${
                        paymentMethod === pm.id 
                          ? 'bg-white text-[#1A1410] shadow-sm ring-1 ring-[#EBEBE6]' 
                          : 'text-[#1A1410]/60 hover:text-[#1A1410]'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  
                  {paymentMethod === 'card' && (
                    <>
                      <div>
                        <label className="block text-[13px] font-bold text-[#1A1410]/70 mb-1.5 ml-1">Card details</label>
                        <div className="bg-white border border-[#EBEBE6] rounded-[12px] px-4 py-4 shadow-sm focus-within:border-[#1A1410] transition-colors">
                          <CardElement
                            options={{
                              style: {
                                base: {
                                  fontSize: '16px',
                                  color: '#1A1410',
                                  '::placeholder': { color: '#a8a29e' },
                                  fontFamily: 'Inter, system-ui, sans-serif',
                                },
                                invalid: { color: '#dc2626' },
                              },
                            }}
                          />
                        </div>
                        {cardError && (
                          <p className="text-red-500 text-[13px] font-semibold mt-2 ml-1">{cardError}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[#1A1410]/40 mt-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[11px] font-bold uppercase tracking-widest">Secured by Stripe · 256-bit SSL</span>
                      </div>
                    </>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="bg-[#F5F5F0] border border-[#EBEBE6] rounded-[14px] p-6 text-center shadow-inner">
                      <svg className="w-10 h-10 mx-auto text-[#1A1410]/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      <h4 className="text-[16px] font-bold text-[#1A1410] mb-2">Pay securely with Cash</h4>
                      <p className="text-[13px] font-medium text-[#1A1410]/60 text-balance leading-relaxed">
                        Please have exact change ready. A recipient must be present to accept and pay for the delivery.
                      </p>
                    </div>
                  )}

                  <button 
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || (paymentMethod === 'card' && (!stripe || !clientSecret))}
                    className={`w-full mt-6 flex items-center justify-center gap-2 bg-[#EBB250] hover:bg-[#DCA440] text-[#1A1410] text-[18px] font-black py-5 rounded-[16px] transition-all active:scale-[0.98] shadow-md hover:shadow-xl ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                        <div className="flex items-center gap-3">
                            <svg className="animate-spin h-6 w-6 text-[#1A1410]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                            {paymentMethod === 'card' ? 'Processing Payment...' : 'Placing Order...'}
                        </div>
                    ) : (
                        <>
                            {paymentMethod === 'card' ? `Pay $${(finalTotal + (orderType === 'delivery' ? 3.99 : 0)).toFixed(2)}` : 'Place order'}
                            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                        </>
                    )}
                  </button>

                  <p className="text-[11.5px] leading-relaxed text-[#1A1410]/50 mt-4 px-1 font-medium">
                    By signing up, you agree to receive email marketing communications from {settings?.restaurantName || 'Restaurant'} and our technology partner Owner.com and consent to our Terms & Policies. You may receive email or SMS notifications from us for order updates and account access and can opt out any time.
                  </p>
                </div>
              </section>

              <div className="flex gap-4 pt-4 border-t border-[#EBEBE6] opacity-60">
                <span className="text-[12px] font-bold hover:underline cursor-pointer">Terms & Policies</span>
                <span className="text-[12px] font-bold hover:underline cursor-pointer">Accessibility Statement</span>
              </div>

            </motion.div>
          </div>

          {/* RIGHT COLUMN - Fixed Order Summary */}
          <div className="w-full lg:w-[420px] shrink-0 sticky top-28">
            <div className="bg-white border border-[#EBEBE6] rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] hidden lg:block">
              {/* Summary Header */}
              <div className="p-6">
                <h3 className="text-xl font-bold font-serif text-[#1A1410] mb-6">Order summary</h3>
                
                <div className="space-y-3 shrink-0">
                  <div className="flex justify-between text-[15px] font-semibold text-[#1A1410]/70">
                    <span>Subtotal</span>
                    <span className="text-[#1A1410]">${subtotal.toFixed(2)}</span>
                  </div>
                  {orderType === 'delivery' && (
                    <div className="flex justify-between text-[15px] font-semibold text-[#1A1410]/70">
                      <span>Delivery Fee</span>
                      <span className="text-[#1A1410]">$3.99</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[15px] font-semibold text-[#1A1410]/70 items-center">
                    <span className="flex items-center gap-1 cursor-pointer">
                      Taxes & fees
                      <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                    <span className="text-[#1A1410]">${taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[15px] font-semibold text-[#1A1410]/70">
                    <span>Tip</span>
                    <span className="text-[#1A1410]">${tipAmount.toFixed(2)}</span>
                  </div>
                  <div className="pt-2">
                    {!isPromoOpen ? (
                        <button 
                            onClick={() => setIsPromoOpen(true)}
                            className="text-[14px] font-bold text-[#1A1410] underline decoration-1 cursor-pointer underline-offset-4 hover:opacity-70 transition-opacity"
                        >
                            Add coupon or gift card
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={promoCode}
                                onChange={e => setPromoCode(e.target.value)}
                                placeholder="PROMO CODE"
                                className="flex-1 bg-white border border-[#EBEBE6] rounded-[8px] px-3 py-1.5 text-[12px] font-bold outline-none focus:border-[#1A1410]"
                            />
                            <button 
                                onClick={() => setIsPromoOpen(false)}
                                className="bg-[#1A1410] text-[#FAFAF8] px-3 py-1.5 rounded-[8px] text-[11px] font-bold"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                  </div>
                  
                  <div className="mt-4 p-3 bg-black/[0.03] rounded-xl border border-black/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className="text-xl">🏆</span>
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase tracking-wider text-black/40 leading-none">Loyalty Reward</span>
                          <span className="text-[13px] font-bold text-[#1A1410]">Earn {pointsToEarn} points</span>
                       </div>
                    </div>
                    <span className="text-[10px] font-black bg-[#EBB250] text-[#1A1410] px-1.5 py-0.5 rounded-md leading-none">PENDING</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#EBEBE6] flex justify-between items-center">
                  <span className="text-[18px] font-black text-[#1A1410]">Total</span>
                  <span className="text-[22px] font-black text-[#1A1410] tracking-tight">
                    ${(finalTotal + (orderType === 'delivery' ? 3.99 : 0)).toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Item List matching screenshot design */}
              <div className="bg-[#FAFAF8] p-4 border-t border-[#EBEBE6] space-y-2 border-b-2 border-b-[#EBEBE6]">
                {cart.map((item) => (
                  <div key={item._id} className="bg-white border border-[#EBEBE6] rounded-[16px] p-4 flex gap-4 shadow-sm relative group overflow-hidden">
                    <div className="w-[52px] h-[52px] rounded-xl overflow-hidden shrink-0 bg-[#F5F5F0] border border-[#EBEBE6]">
                      <img src={resolveMenuItemImage(item)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <h4 className="text-[#1A1410] text-[14px] font-bold leading-snug truncate pr-14">
                        {item.name} {item.modifiers?.length ? `(${item.modifiers.join(', ')})` : ''}
                      </h4>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 bg-[#F5F5F0] border border-[#EBEBE6] rounded-full px-2 py-1 w-fit mt-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFromCart(item._id); }}
                            className="w-6 h-6 flex items-center justify-center text-[#1A1410]/70 hover:text-[#1A1410] rounded-full hover:bg-white transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                          </button>
                          <span className="text-[#1A1410] text-[13px] font-black w-4 text-center">{item.qty}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart({ ...item, qty: 1 }); }}
                            className="w-6 h-6 flex items-center justify-center text-[#1A1410]/70 hover:text-[#1A1410] rounded-full hover:bg-white transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <span className="absolute top-4 right-4 text-[#1A1410] font-black text-[15px]">
                      ${(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mobile Fallback purely stacking the summary instead of sticky */}
            <div className="lg:hidden mt-10 p-6 bg-white border border-[#EBEBE6] rounded-[24px]">
              <h3 className="text-xl font-bold font-serif text-[#1A1410] mb-6">Order summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-[15px] font-semibold text-[#1A1410]/70">
                  <span>Subtotal</span><span className="text-[#1A1410]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[15px] font-semibold text-[#1A1410]/70 items-center">
                  <span>Taxes & fees</span><span className="text-[#1A1410]">${taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[15px] font-semibold text-[#1A1410]/70">
                  <span>Tip</span><span className="text-[#1A1410]">${tipAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-[#EBEBE6] flex justify-between items-center">
                <span className="text-[18px] font-black text-[#1A1410]">Total</span>
                <span className="text-[22px] font-black text-[#1A1410] tracking-tight">
                    ${(finalTotal + (orderType === 'delivery' ? 3.99 : 0)).toFixed(2)}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Login Requirement Modal */}
      <QuickLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => {
          if (!localStorage.getItem('customerToken')) {
            navigate('/menu')
            toast.error('Login required for checkout')
          } else {
            setIsLoginModalOpen(false)
            fetchProfile(localStorage.getItem('customerToken'))
          }
        }} 
      />
    </div>
  )
}

