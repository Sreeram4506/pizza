import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatbot } from '../context/ChatbotContext'
import { OrderService } from '../services/OrderService'
import wsService from '../services/websocket.js'
import StripePayment from './StripePayment'

export default function Chatbot() {
  const {
    isOpen,
    setIsOpen,
    initialMessage,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal
  } = useChatbot()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [view, setView] = useState('chat') // 'chat' | 'menu' | 'cart' | 'checkout'
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [menuItems, setMenuItems] = useState([])
  const [customerProfile, setCustomerProfile] = useState(null)
  const [orderType, setOrderType] = useState('delivery') // Default to delivery
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [dineInTime, setDineInTime] = useState('')
  const [pickupDateTime, setPickupDateTime] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card') // Default to card
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  // Get logged-in customer profile
  useEffect(() => {
    const getCustomerProfile = async () => {
      try {
        const token = localStorage.getItem('customerToken')
        if (token) {
          const res = await fetch('/api/customers/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (res.ok) {
            const data = await res.json()
            setCustomerProfile(data.user)
          }
        }
      } catch (err) {
        console.error('Failed to fetch customer profile:', err)
      }
    }

    getCustomerProfile()
  }, [])

  // Get logged-in customer info for orders
  const getCustomerInfo = () => {
    if (customerProfile) {
      return {
        name: customerProfile.name,
        email: customerProfile.email,
        phone: customerProfile.phone
      }
    }
    return {
      name: guestName || 'Guest Customer',
      phone: guestPhone || '000-000-0000',
      email: guestEmail || ''
    }
  }
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchMenuData()

    // Connect to WebSocket for real-time updates
    wsService.connect()

    // Listen for menu updates
    wsService.on('menu_updated', (data) => {
      console.log('Menu updated via WebSocket:', data)
      fetchMenuData()

      // Show notification to user
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `🎉 Menu updated! ${data.message || 'New items are available!'}`,
        showMenuBtn: true,
      }])
    })

    wsService.on('item_added', (data) => {
      console.log('Item added via WebSocket:', data)
      fetchMenuData()

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `🍕 New item added: **${data.item.name}** - $${data.item.price}`,
        showMenuBtn: true,
      }])
    })

    wsService.on('item_updated', (data) => {
      console.log('Item updated via WebSocket:', data)
      fetchMenuData()

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `🔄 Item updated: **${data.item.name}**`,
        showMenuBtn: true,
      }])
    })

    wsService.on('item_removed', (data) => {
      console.log('Item removed via WebSocket:', data)
      fetchMenuData()

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `🗑️ Item removed: **${data.itemName}**`,
        showMenuBtn: true,
      }])
    })

    return () => {
      wsService.disconnect()
    }
  }, [])

  const fetchMenuData = async () => {
    setLoading(true)
    try {
      // Fetch categories
      const categoriesRes = await fetch('/api/menu/categories')
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
        console.log('Chatbot: Categories loaded:', categoriesData.length)
      }

      // Fetch menu items
      const itemsRes = await fetch('/api/menu/items')
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json()
        setMenuItems(itemsData)
        console.log('Chatbot: Menu items loaded:', itemsData.length, itemsData.map(i => i.name))
      }
    } catch (err) {
      console.error('Failed to fetch menu data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        type: 'bot',
        text: "Hey! 👋 Welcome to **Pizza Blast**! I'm your AI ordering assistant.\n\nBrowse our menu below, add your favourites to the cart, then hit checkout!",
        showMenuBtn: true,
      }])
    }
  }, [isOpen])

  // Handle intents from other components
  useEffect(() => {
    if (initialMessage && isOpen) {
      handleIntent(initialMessage.intent, initialMessage.data)
    }
  }, [initialMessage, isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  const handleIntent = (intent, data) => {
    switch (intent) {
      case 'add_to_cart':
        if (data.item) {
          // Handle custom pizza items
          const customItem = {
            ...data.item,
            _id: `custom-${Date.now()}`, // Generate unique ID for custom items
            name: `Custom Pizza (${data.item.base})`,
            available: true
          }
          addToCart(customItem)
          setMessages(prev => [...prev, {
            type: 'bot',
            text: `🍕 **Custom Pizza Added!**\n\nBase: ${data.item.base}\nSauce: ${data.item.sauce}\nToppings: ${data.item.toppings.join(', ')}\nPrice: $${data.item.price}\n\nKeep adding or go to cart to checkout!`,
            cartAction: true,
          }])
          setView('chat')
        }
        break
      case 'checkout_now':
        if (data.item) {
          const customItem = {
            ...data.item,
            _id: `custom-${Date.now()}`,
            name: `Custom Pizza (${data.item.base})`,
            available: true
          }
          addToCart(customItem)
          setView('checkout')
        }
        break
      case 'menu':
        setView('menu')
        break
      case 'order':
        setView('menu')
        break
      case 'cart':
        setView('cart')
        break
      case 'checkout':
        setView('checkout')
        break
      default:
        break
    }
  }

  const handleAddToCart = (item) => {
    addToCart(item)
    setMessages(prev => [...prev, {
      type: 'bot',
      text: `Added **${item.name}** to your cart! 🍕 Keep adding or go to cart to checkout.`,
      cartAction: true,
    }])
    setView('chat')
  }

  const handleCheckoutIntent = () => {
    if (cart.length === 0) return
    setView('checkout')
  }

  const handleCheckoutSuccess = async (paymentIntent) => {
    setIsPlacingOrder(true)
    setView('chat')
    setMessages(prev => [...prev, { type: 'user', text: `Paid $${cartTotal.toFixed(2)} - Place my order` }])
    setIsTyping(true)
    try {
      const customerInfo = getCustomerInfo()
      const order = await OrderService.placeOrder({
        items: cart.map(i => ({
          itemId: i._id, // Add itemId for the order
          name: i.name,
          quantity: i.qty,  // Changed from qty to quantity
          price: i.price,
          modifiers: i.modifiers || []
        })),
        type: orderType,
        customerInfo: customerInfo,
        address: orderType === 'delivery' && deliveryAddress ? { street: deliveryAddress, city: '', zip: '' } : undefined,
        pickupDateTime: orderType === 'pickup' && pickupDateTime ? pickupDateTime : undefined,
        dineInTime: orderType === 'dine_in' && dineInTime ? dineInTime : undefined,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cash' ? 'pending' : 'paid',
          transactionId: paymentIntent.id || 'cash_order'
        }
      })
      setIsTyping(false)
      if (order) {
        const orderId = order._id || order.id;

        // Store in local storage for tracking
        const activeOrders = JSON.parse(localStorage.getItem('activeOrders') || '[]');
        if (orderId && !activeOrders.includes(orderId)) {
          activeOrders.push(orderId);
          localStorage.setItem('activeOrders', JSON.stringify(activeOrders));
        }

        const eta = new Date(order.eta || new Date(Date.now() + 30 * 60000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setMessages(prev => [...prev, {
          type: 'bot',
          text: `✅ **Order Confirmed!**\n\nOrder ID: \`${orderId}\`\nItems: ${cart.map(i => `${i.qty}× ${i.name}`).join(', ')}\nTotal: $${cartTotal.toFixed(2)}\n⏱️ Estimated delivery: **${eta}**\n💳 Status: **Paid via Card**`,
          confirmed: true,
        }])
        clearCart()
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: "❌ Something went wrong placing your order. Please try again or call us directly!",
        }])
      }
    } catch (error) {
      console.error('Order placement error:', error)
      setIsTyping(false)
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `❌ Order failed: ${error.message || 'Please try again or call us directly!'}`
      }])
    }
    setIsPlacingOrder(false)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setIsPlacingOrder(true)
    setView('chat')
    setMessages(prev => [...prev, { type: 'user', text: 'Place my order' }])
    setIsTyping(true)
    try {
      const customerInfo = getCustomerInfo()
      const order = await OrderService.placeOrder({
        items: cart.map(i => ({
          itemId: i._id, // Add itemId for the order
          name: i.name,
          quantity: i.qty,  // Changed from qty to quantity
          price: i.price,
          modifiers: i.modifiers || []
        })),
        type: orderType,
        customerInfo: customerInfo,
        address: orderType === 'delivery' && deliveryAddress ? { street: deliveryAddress, city: '', zip: '' } : undefined,
        pickupDateTime: orderType === 'pickup' && pickupDateTime ? pickupDateTime : undefined,
        dineInTime: orderType === 'dine_in' && dineInTime ? dineInTime : undefined,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cash' ? 'pending' : 'paid',
          transactionId: paymentMethod === 'cash' ? 'cash_order' : 'mock_payment_id'
        }
      })
      setIsTyping(false)
      if (order) {
        const orderId = order._id || order.id;

        // Store in local storage for tracking
        const activeOrders = JSON.parse(localStorage.getItem('activeOrders') || '[]');
        if (orderId && !activeOrders.includes(orderId)) {
          activeOrders.push(orderId);
          localStorage.setItem('activeOrders', JSON.stringify(activeOrders));
        }

        const eta = new Date(order.eta || new Date(Date.now() + 30 * 60000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setMessages(prev => [...prev, {
          type: 'bot',
          text: `✅ **Order Confirmed!**\n\nOrder ID: \`${orderId}\`\nItems: ${cart.map(i => `${i.qty}× ${i.name}`).join(', ')}\nTotal: $${cartTotal.toFixed(2)}\n⏱️ Estimated delivery: **${eta}**`,
          confirmed: true,
        }])
        clearCart()
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: "❌ Something went wrong placing your order. Please try again or call us directly!",
        }])
      }
    } catch (error) {
      console.error('Order placement error:', error)
      setIsTyping(false)
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `❌ Order failed: ${error.message || 'Please try again or call us directly!'}`
      }])
    }
    setIsPlacingOrder(false)
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    const msg = input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { type: 'user', text: msg }])
    setIsTyping(true)
    try {
      const res = await OrderService.chat(msg, {
        items: cart,
        customer: getCustomerInfo(),
        orderType,
        deliveryAddress
      })
      setIsTyping(false)
      if (res.action === 'PLACE_ORDER') {
        // Instead of immediate placement, move to checkout view so user can review/fill details
        handleCheckoutIntent()
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: res.text || "I'm here to help! 🍕" }])
      }
    } catch {
      setIsTyping(false)
      setMessages(prev => [...prev, { type: 'bot', text: "I'm having trouble right now. Try again! 🍕" }])
    }
  }

  return (
    <>
      {/* Floating Chat Button with cart badge */}
      <motion.button
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-tomato-500 to-tomato-700 shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-center justify-center text-white"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
        whileHover={{ scale: 1.1, shadow: '0 0 50px rgba(244,162,97,0.6)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.span className="text-2xl" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          {isOpen ? '✕' : '💬'}
        </motion.span>
        {cartCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-black text-xs flex items-center justify-center font-black shadow-lg">
            {cartCount}
          </span>
        )}
      </motion.button>



      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-mozzarella-100 flex flex-col border-none text-wood-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-tomato-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(220,38,38,0.2)] text-white">
                  🍕
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-wood-800 tracking-tight uppercase">Pizza Assistant</h3>
                  <p className="text-[10px] text-basil-600 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-basil-600 animate-pulse" /> System Active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Tab buttons - Visible on all screens for better nav */}
                <div className="flex items-center bg-white/50 rounded-full p-1 border border-gray-100 overflow-x-auto">
                  {['chat', 'menu', 'cart'].map(tab => (
                    <motion.button
                      key={tab}
                      onClick={() => setView(tab)}
                      className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${view === tab ? 'bg-tomato-600 text-white shadow-lg shadow-tomato-600/20' : 'text-wood-600 hover:text-tomato-600'}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tab === 'cart' ? `Cart ${cartCount > 0 ? `(${cartCount})` : ''}` : tab}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 rounded-full border border-crust-100 flex items-center justify-center text-wood-500 hover:text-tomato-600 hover:border-tomato-200 transition-all font-bold"
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* PAYMENT VIEW */}
              {view === 'payment' && (
                <div className="p-8 max-w-lg mx-auto w-full flex flex-col items-center justify-center min-h-[60vh]">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full bg-white rounded-[3rem] p-10 shadow-crust border border-crust-100 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-tomato-500/5 rounded-full blur-2xl -mr-12 -mt-12" />

                    <div className="text-center mb-10">
                      <div className="w-20 h-20 bg-tomato-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-tomato-600/20 mb-6 text-white">
                        💳
                      </div>
                      <h2 className="font-display font-black text-3xl text-wood-800 tracking-tight uppercase">Secure Payment</h2>
                      <p className="text-xs text-wood-400 font-bold uppercase tracking-widest mt-2">Paying ${(cartTotal + (orderType === 'delivery' ? 3.99 : 0)).toFixed(2)} to Pizza Blast</p>
                    </div>

                    <StripePayment
                      amount={cartTotal + (orderType === 'delivery' ? 3.99 : 0)}
                      onPaymentSuccess={handleCheckoutSuccess}
                      onCancel={() => setView('checkout')}
                    />

                    <div className="mt-10 flex items-center justify-center gap-2 text-wood-200">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">SSL Secure 256-bit Encryption</span>
                    </div>
                  </motion.div>
                </div>
              )}
              {/* CHAT VIEW */}
              {view === 'chat' && (
                <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
                  {messages.map((msg, i) => (
                    <ChatMessage key={i} message={msg}
                      onMenuOpen={() => setView('menu')}
                      onCartOpen={() => setView('cart')}
                      onCheckoutOpen={() => setView('checkout')}
                    />
                  ))}

                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* MENU VIEW */}
              {view === 'menu' && (
                <div className="p-6 max-w-4xl mx-auto w-full">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="font-display font-black text-4xl text-wood-800 tracking-tighter">🍕 Our Selection</h2>
                    <button
                      onClick={fetchMenuData}
                      className="px-4 py-2 bg-tomato-100 text-tomato-700 rounded-lg hover:bg-tomato-200 transition-colors"
                      title="Refresh menu"
                    >
                      Refresh
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-tomato-600"></div>
                      <p className="text-wood-600 mt-4">Loading menu...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {menuItems.map((item, i) => (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-white border border-crust-100 hover:border-tomato-300 transition-all group ${!item.available ? 'opacity-60' : ''
                            }`}
                        >
                          <div className="flex items-center gap-6">
                            <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-transform group-hover:scale-125">🍕</span>
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-display font-black text-lg text-wood-800 uppercase tracking-tight">{item.name}</span>
                                {item.isPopular && <span className="text-[9px] bg-tomato-600 text-white font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">Popular</span>}
                                {!item.available && <span className="text-[9px] bg-gray-400 text-white font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">Out of Stock</span>}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 font-light">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <span className="text-wood-800 font-black text-xl tracking-tighter">${item.price.toFixed(2)}</span>
                            <motion.button
                              onClick={() => handleAddToCart(item)}
                              disabled={!item.available}
                              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${item.available
                                ? 'bg-tomato-600 text-white shadow-tomato-600/20'
                                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                }`}
                              whileHover={item.available ? { scale: 1.05 } : {}}
                              whileTap={item.available ? { scale: 0.95 } : {}}
                            >
                              {item.available ? '+ ADD' : 'UNAVAILABLE'}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CART VIEW */}
              {view === 'cart' && (
                <div className="p-6 max-w-2xl mx-auto w-full h-full">
                  <h2 className="font-display font-black text-4xl text-slate-900 mb-8 tracking-tighter">🛒 Your Cart</h2>

                  {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-wood-300 py-20">
                      <span className="text-8xl">🍕</span>
                      <p className="text-xl font-medium">Your cart is empty!</p>

                      <motion.button
                        onClick={() => setView('menu')}
                        className="px-10 py-4 rounded-2xl bg-tomato-600 text-white font-bold shadow-pizza"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Explore Menu
                      </motion.button>

                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {cart.map(item => (
                        <div key={item._id} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-white border border-crust-100">
                          <div className="flex items-center gap-6">
                            <span className="text-5xl">🍕</span>
                            <div>
                              <p className="font-display font-black text-wood-800 text-xl uppercase tracking-tight">{item.name}</p>
                              <p className="text-tomato-600 font-black text-lg tracking-tight">${(item.price * item.qty).toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <motion.button
                              onClick={() => removeFromCart(item._id)}
                              className="w-12 h-12 rounded-2xl bg-mozzarella-100 border border-crust-100 flex items-center justify-center text-wood-700 font-black hover:bg-mozzarella-200 transition-colors"
                              whileTap={{ scale: 0.9 }}
                            >−</motion.button>
                            <span className="text-wood-800 font-black w-8 text-center text-2xl tracking-tighter">{item.qty}</span>
                            <motion.button
                              onClick={() => addToCart(item)}
                              className="w-12 h-12 rounded-2xl bg-tomato-600 flex items-center justify-center text-white font-black shadow-lg shadow-tomato-600/10"
                              whileTap={{ scale: 0.9 }}
                            >+</motion.button>
                          </div>
                        </div>
                      ))}


                      <div className="mt-12 p-10 rounded-[3rem] bg-white text-black shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="flex justify-between items-center mb-10">
                          <div>
                            <p className="text-wood-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Amount Due</p>
                            <h3 className="text-5xl font-black tracking-tighter">${cartTotal.toFixed(2)}</h3>
                          </div>
                          <div className="w-16 h-16 rounded-3xl bg-mozzarella-100 flex items-center justify-center text-4xl shadow-inner italic font-black text-tomato-600 border border-crust-100">PB</div>
                        </div>
                        <motion.button
                          onClick={handleCheckoutIntent}
                          disabled={isPlacingOrder}
                          className="w-full py-6 rounded-[2rem] bg-tomato-600 text-white font-black text-lg shadow-xl shadow-tomato-600/20 disabled:opacity-50 tracking-widest uppercase"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isPlacingOrder ? '⏳ Processing Order...' : 'Secure Checkout'}
                        </motion.button>


                        <button
                          onClick={() => setView('menu')}
                          className="w-full mt-4 text-sm text-wood-400 font-bold uppercase tracking-widest hover:text-tomato-600 transition-colors"
                        >
                          + Add more items
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* CHECKOUT VIEW */}
              {view === 'checkout' && (
                <div className="p-8 max-w-lg mx-auto w-full flex flex-col items-center justify-center min-h-[60vh]">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full bg-white rounded-[3rem] p-10 shadow-crust border border-crust-100 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-tomato-500/5 rounded-full blur-2xl -mr-12 -mt-12" />

                    <div className="text-center mb-10">
                      <div className="w-20 h-20 bg-tomato-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-tomato-600/20 mb-6 text-white">
                        💳
                      </div>
                      <h2 className="font-display font-black text-3xl text-wood-800 tracking-tight uppercase">Secure Payment</h2>
                      <p className="text-xs text-wood-400 font-bold uppercase tracking-widest mt-2">Paying ${cartTotal.toFixed(2)} to Pizza Blast</p>

                      <button
                        onClick={() => setView('cart')}
                        className="mt-4 text-tomato-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        ← Back to Cart
                      </button>
                    </div>

                    {!customerProfile && (
                      <div className="mb-8 p-6 bg-wood-50 rounded-2xl border border-crust-100">
                        <h3 className="text-lg font-semibold text-wood-800 mb-4">Guest Information</h3>
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-wood-200 focus:border-tomato-500 outline-none text-wood-800"
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-wood-200 focus:border-tomato-500 outline-none text-wood-800"
                          />
                          <input
                            type="email"
                            placeholder="Email Address (for confirmation)"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-wood-200 focus:border-tomato-500 outline-none text-wood-800"
                          />
                        </div>
                      </div>
                    )}

                    {/* Order Type Selection */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-wood-800 mb-4">Choose Order Type</h3>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <button
                          type="button"
                          onClick={() => setOrderType('delivery')}
                          className={`p-4 rounded-xl border-2 transition-all ${orderType === 'delivery'
                            ? 'bg-tomato-600 text-white border-tomato-600'
                            : 'bg-white text-wood-700 border-wood-200 hover:border-tomato-300'
                            }`}
                        >
                          <div className="text-2xl mb-2">🚚</div>
                          <div className="font-semibold">Delivery</div>
                          <div className="text-sm text-wood-600">25-40 min</div>
                          <div className="text-xs text-wood-500 mt-1">+ $3.99 delivery fee</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('pickup')}
                          className={`p-4 rounded-xl border-2 transition-all ${orderType === 'pickup'
                            ? 'bg-tomato-600 text-white border-tomato-600'
                            : 'bg-white text-wood-700 border-wood-200 hover:border-tomato-300'
                            }`}
                        >
                          <div className="text-2xl mb-2">🛒</div>
                          <div className="font-semibold">Pickup</div>
                          <div className="text-sm text-wood-600">20 min</div>
                          <div className="text-xs text-green-600 mt-1">No delivery fee</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('dine_in')}
                          className={`p-4 rounded-xl border-2 transition-all ${orderType === 'dine_in'
                            ? 'bg-tomato-600 text-white border-tomato-600'
                            : 'bg-white text-wood-700 border-wood-200 hover:border-tomato-300'
                            }`}
                        >
                          <div className="text-2xl mb-2">🍽</div>
                          <div className="font-semibold">Dine In</div>
                          <div className="text-sm text-wood-600">45 min</div>
                          <div className="text-xs text-green-600 mt-1">No delivery fee</div>
                        </button>
                      </div>

                      {/* Delivery Address for delivery orders */}
                      {orderType === 'delivery' && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-wood-800 mb-4">Delivery Address</h3>
                          <input
                            type="text"
                            placeholder="Enter your delivery address"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-wood-200 focus:border-tomato-500 focus:ring-2 focus:ring-tomato-200 outline-none text-wood-800"
                          />
                        </div>
                      )}

                      {/* Pickup Date and Time */}
                      {orderType === 'pickup' && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-wood-800 mb-4">Pickup Date & Time</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-wood-700 mb-2">Date</label>
                              <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]} // Today's date
                                value={pickupDateTime.split('T')[0] || ''}
                                onChange={(e) => setPickupDateTime(e.target.value + 'T' + (pickupDateTime.split('T')[1] || ''))}
                                className="w-full px-4 py-3 rounded-xl border border-wood-200 focus:border-tomato-500 focus:ring-2 focus:ring-tomato-200 outline-none text-wood-800"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-wood-700 mb-2">Time</label>
                              <input
                                type="time"
                                value={pickupDateTime.split('T')[1] || ''}
                                onChange={(e) => setPickupDateTime((pickupDateTime.split('T')[0] || '') + 'T' + e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-wood-200 focus:border-tomato-500 focus:ring-2 focus:ring-tomato-200 outline-none text-wood-800"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dine In Time for dine-in orders */}
                      {orderType === 'dine_in' && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-wood-800 mb-4">Dine In Time</h3>
                          <input
                            type="time"
                            value={dineInTime}
                            onChange={(e) => setDineInTime(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-wood-200 focus:border-tomato-500 focus:ring-2 focus:ring-tomato-200 outline-none text-wood-800"
                          />
                        </div>
                      )}

                      {/* Payment Method Selection */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-wood-800 mb-4">Payment Method</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card'
                              ? 'bg-tomato-600 text-white border-tomato-600'
                              : 'bg-white text-wood-700 border-wood-200 hover:border-tomato-300'
                              }`}
                          >
                            <div className="text-2xl mb-2">💳</div>
                            <div className="font-semibold">Card Payment</div>
                            <div className="text-sm text-wood-600">Pay now online</div>
                            <div className="text-xs text-green-600 mt-1">Secure & instant</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cash')}
                            className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash'
                              ? 'bg-tomato-600 text-white border-tomato-600'
                              : 'bg-white text-wood-700 border-wood-200 hover:border-tomato-300'
                              }`}
                          >
                            <div className="text-2xl mb-2">💵</div>
                            <div className="font-semibold">Cash on Delivery</div>
                            <div className="text-sm text-wood-600">Pay when delivered</div>
                            <div className="text-xs text-blue-600 mt-1">No payment now</div>
                          </button>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="mb-6 p-4 bg-wood-50 rounded-xl">
                        <h3 className="text-lg font-semibold text-wood-800 mb-2">Order Summary</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${cartTotal.toFixed(2)}</span>
                          </div>
                          {orderType === 'delivery' && (
                            <div className="flex justify-between">
                              <span>Delivery Fee:</span>
                              <span>$3.99</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold text-base pt-2 border-t">
                            <span>Total:</span>
                            <span>${(cartTotal + (orderType === 'delivery' ? 3.99 : 0)).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (orderType === 'delivery' && !deliveryAddress) {
                            alert('Please enter a delivery address');
                            return;
                          }
                          if (!customerProfile && (!guestName || !guestPhone || !guestEmail)) {
                            alert('Please fill in your guest information (Name, Phone, and Email) so we can send you a confirmation.');
                            return;
                          }
                          paymentMethod === 'card' ? setView('payment') : handleCheckout()
                        }}
                        className="w-full bg-tomato-600 text-white py-4 rounded-xl font-semibold hover:bg-tomato-700 transition-colors"
                      >
                        {paymentMethod === 'card' ? 'Proceed to Payment' : 'Place Order (Cash on Delivery)'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Input — only in chat view */}
            {view === 'chat' && (
              <div className="p-8 bg-white border-t border-crust-100">
                <div className="max-w-4xl mx-auto w-full">
                  <div className="flex gap-4 mb-6">
                    <motion.button type="button" onClick={() => setView('menu')}
                      className="px-8 py-2.5 rounded-full border border-crust-100 text-wood-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-tomato-600 hover:border-tomato-200 transition-all shadow-sm"
                      whileTap={{ scale: 0.95 }}>Browse Menu</motion.button>
                    {cart.length > 0 && (
                      <motion.button type="button" onClick={() => setView('cart')}
                        className="px-8 py-2.5 rounded-full bg-tomato-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-tomato-600/10"
                        whileTap={{ scale: 0.95 }}>Cart ({cartCount})</motion.button>
                    )}
                  </div>
                  <form onSubmit={handleSend} className="flex gap-4">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Message your pizza assistant..."
                      className="flex-1 px-8 py-5 rounded-[2rem] bg-mozzarella-100 border-none focus:ring-2 focus:ring-tomato-600/10 outline-none text-wood-800 font-bold placeholder:text-wood-300 transition-all"
                    />
                    <motion.button
                      type="submit"
                      className="w-16 h-16 bg-tomato-600 text-white font-black rounded-full shadow-lg shadow-tomato-600/20 flex items-center justify-center shrink-0"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </motion.button>
                  </form>
                </div>
              </div>
            )}


          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ChatMessage({ message, onMenuOpen, onCartOpen, onCheckoutOpen }) {
  const isBot = message.type === 'bot'
  // Simple bold markdown transform
  const formatText = (text) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code style="background:rgba(244,162,97,0.2);padding:2px 5px;border-radius:4px;font-family:monospace">$1</code>')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-[85%] ${isBot ? 'text-left' : 'text-right'}`}>
        <div className={`inline-block px-6 py-5 rounded-[2.5rem] shadow-sm ${isBot
          ? 'bg-white rounded-tl-sm text-wood-700 font-medium border border-crust-100'
          : 'bg-tomato-600 text-white rounded-tr-sm shadow-xl shadow-tomato-600/10 font-bold'
          }`}>
          <p className="text-base whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatText(message.text) }} />
        </div>


        {/* Action buttons on bot messages */}
        {isBot && (message.showMenuBtn || message.cartAction || message.confirmed) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(message.showMenuBtn || message.cartAction) && (
              <motion.button
                onClick={onMenuOpen}
                className="px-6 py-2.5 rounded-2xl bg-wood-800 text-white text-sm font-bold shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🍕 Explore Menu
              </motion.button>
            )}
            {message.cartAction && (
              <motion.button
                onClick={onCartOpen}
                className="px-6 py-2.5 rounded-2xl border-2 border-crust-100 text-wood-800 text-sm font-bold hover:bg-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🛒 View Cart
              </motion.button>
            )}
            {message.cartAction && (
              <motion.button
                onClick={onCheckoutOpen}
                className="px-6 py-2.5 rounded-2xl bg-tomato-600 text-white text-sm font-bold shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                💳 Checkout
              </motion.button>
            )}

          </div>
        )}
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
      <div className="px-5 py-4 rounded-[2rem] rounded-tl-sm bg-white flex gap-2 border border-crust-100 shadow-sm">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-tomato-600"
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

