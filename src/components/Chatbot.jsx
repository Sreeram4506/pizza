import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import { OrderService } from '../services/OrderService'
import wsService from '../services/websocket.js'
import StripePayment from './StripePayment'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function Chatbot() {
  const {
    isOpen,
    setIsOpen,
    initialMessage,
    cart,
    setCart,
    addToCart,
    addMultipleToCart,
    removeFromCart,
    clearCart,
    cartCount,
    isVoiceEnabled,
    setIsVoiceEnabled,
    setIsCartOpen
  } = useChatbot()
  const { settings } = useSettings()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const restaurantName = settings?.restaurantName || 'Mustang Pizza'

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
  const [availableRewards, setAvailableRewards] = useState([])
  const [selectedReward, setSelectedReward] = useState(null)
  const [isListening, setIsListening] = useState(false)

  // Get logged-in customer profile
  useEffect(() => {
    const getCustomerProfile = async () => {
      try {
        const token = localStorage.getItem('customerToken')
        if (token) {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (res.ok) {
            const data = await res.json()
            setCustomerProfile(data.user)
            setAvailableRewards(data.availableRewards || [])
          }
        }
      } catch (err) {
        console.error('Failed to fetch customer profile:', err)
      }
    }

    getCustomerProfile()
  }, [])

  // Prevent background scroll when chatbot is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [isOpen])


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
      name: guestName || 'Guest',
      phone: guestPhone || '',
      email: guestEmail || ''
    }
  }
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const sectionLabelClass = 'chatbot-section-label font-display mb-6'
  const fieldClass = 'w-full px-4 py-3 rounded-[1.25rem] chatbot-input-field outline-none text-sm sm:text-[15px] font-medium'
  const choiceCardClass = (isActive) => `p-4 rounded-[1.5rem] border transition-all text-left ${isActive ? 'chatbot-choice-card chatbot-choice-card-active' : 'chatbot-choice-card'}`

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)

  let discountAmount = 0
  if (selectedReward) {
    if (selectedReward.discountType === 'percentage') {
      discountAmount = cartSubtotal * (selectedReward.discountValue / 100)
    } else {
      discountAmount = selectedReward.discountValue
    }
  }
  const cartTotal = Math.max(0, cartSubtotal - discountAmount)

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
        text: `Menu updated! ${data.message || 'New items are available!'}`,
        showMenuBtn: true,
      }])
    })

    wsService.on('item_added', (data) => {
      console.log('Item added via WebSocket:', data)
      fetchMenuData()

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `New item added: **${data.item.name}** - $${data.item.price}`,
        showMenuBtn: true,
      }])
    })

    wsService.on('item_updated', (data) => {
      console.log('Item updated via WebSocket:', data)
      fetchMenuData()

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Item updated: **${data.item.name}**`,
        showMenuBtn: true,
      }])
    })

    wsService.on('item_removed', (data) => {
      console.log('Item removed via WebSocket:', data)
      fetchMenuData()

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Item removed: **${data.itemName}**`,
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
      // Fetch categories with cache busting
      const categoriesRes = await fetch(`/api/menu/categories?t=${Date.now()}`)
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
        console.log('Chatbot: Categories loaded:', categoriesData.length)
      } else {
        console.error('Failed to fetch categories:', categoriesRes.status, categoriesRes.statusText)
      }
 
      // Fetch menu items with cache busting
      const itemsRes = await fetch(`/api/menu/items?t=${Date.now()}`)
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json()
        setMenuItems(itemsData)
        console.log('Chatbot: Menu items loaded:', itemsData.length, itemsData.map(i => i.name))
      } else {
        console.error('Failed to fetch menu items:', itemsRes.status, itemsRes.statusText)
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
        text: `Hey! Welcome to **${settings?.restaurantName || 'Pizza Blast'}**! I'm your AI ordering assistant.

Browse our menu below, add your favourites to the cart, then hit checkout!`,
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

  // Voice Interaction Logic (TTS - Text to Speech)
  useEffect(() => {
    if (isVoiceEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.type === 'bot' && !isTyping) {
        speak(lastMsg.text)
      }
    }
  }, [messages, isVoiceEnabled, isTyping])

  const speak = (text) => {
    if (!window.speechSynthesis) return
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    // Remove markdown formatting for cleaner speech
    const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`(.*?)`/g, '$1')
    
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = i18n.language

    // Try to find a nice premium-sounding voice for the current language
    const voices = window.speechSynthesis.getVoices()
    const langVoice = voices.find(v => v.lang.startsWith(i18n.language.split('-')[0]))
    utterance.voice = langVoice || voices.find(v => v.name.includes('Google') || v.name.includes('Premium')) || voices[0]
    utterance.rate = 1.0
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }

  // Voice Interaction Logic (STT - Speech to Text)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = i18n.language
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      toast.success(t('chatbot.voice.listening'))
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      // Auto-send voice command
      setTimeout(() => handleVoiceSubmit(transcript), 500)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      toast.error(t('chatbot.voice.error', { error: event.error }))
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleVoiceSubmit = async (transcript) => {
    if (!transcript.trim()) return
    setMessages(prev => [...prev, { type: 'user', text: transcript }])
    setIsTyping(true)
    try {
      const res = await OrderService.chat(transcript, {
        items: cart,
        customer: getCustomerInfo(),
        orderType,
        deliveryAddress,
        settings
      })
      setIsTyping(false)
      if (res.action === 'PLACE_ORDER') {
        handleCheckoutIntent()
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: res.text || "I'm here to help with your order." }])
      }
    } catch {
      setIsTyping(false)
      setMessages(prev => [...prev, { type: 'bot', text: "I'm having trouble right now. Try again!" }])
    }
  }

  const handleIntent = (intent, data) => {
    switch (intent) {
      case 'add_to_cart':
        if (data.item) {
          // Handle custom pizza items
          const customItem = {
            ...data.item,
            _id: `custom-${Date.now()}`, // Generate unique ID for custom items
            name: `Custom Pizza (${data.item.base.name})`,
            available: true
          }
          addToCart(customItem)
          setMessages(prev => [...prev, {
            type: 'bot',
            text: `**Custom Pizza Added!**

Base: ${data.item.base}
Sauce: ${data.item.sauce}
Toppings: ${data.item.toppings.join(', ')}
Price: $${data.item.price}

Keep adding or go to cart to checkout!`,
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
          setIsOpen(false)
          navigate('/checkout')
        }
        break
      case 'menu':
        navigate('/menu')
        setIsOpen(false)
        break
      case 'order':
        navigate('/menu')
        setIsOpen(false)
        break
      case 'cart':
        setIsOpen(false)
        setIsCartOpen(true)
        break
      case 'reorder':
        if (data.items && Array.isArray(data.items)) {
          addMultipleToCart(data.items)
          setMessages(prev => [...prev, {
            type: 'bot',
            text: `**Order Added to Cart!**

I've added all items from your past order. Would you like to add anything else or proceed to checkout?`,
            cartAction: true,
          }])
          setView('chat')
        }
        break
      case 'checkout':
        if (data.item && typeof data.item === 'object') {
          const customItem = {
            ...data.item,
            _id: `custom-${Date.now()}`,
            name: data.item.name || `Custom Pizza (${data.item.base || 'Classic'})`,
            qty: 1,
            available: true
          }
          addToCart(customItem)
        }
        setIsOpen(false)
        navigate('/checkout')
        break
      default:
        break
    }
  }

  const handleAddToCart = (item) => {
    addToCart(item)
    setMessages(prev => [...prev, {
      type: 'bot',
      text: `Added **${item.name}** to your cart! Keep adding or go to cart to checkout.`,
      cartAction: true,
    }])
    setView('chat')
  }

  const handleCheckoutIntent = () => {
    if (cart.length === 0) return
    setIsOpen(false)
    navigate('/checkout')
  }

  const handleCheckoutSuccess = async (paymentIntent) => {
    setIsPlacingOrder(true)
    setView('chat')
    setMessages(prev => [...prev, { type: 'user', text: `Paid $${cartTotal.toFixed(2)} - Place my order` }])
    setIsTyping(true)
    try {
      const customerInfo = getCustomerInfo()
      const order = await OrderService.placeOrder({
        items: cart.map((i, index) => ({
          itemId: i.itemId || i._id || `custom-checkout-${index}-${Date.now()}`,
          name: i.name,
          quantity: i.qty,
          price: i.price,
          modifiers: i.modifiers || []
        })),
        type: orderType,
        customerInfo: customerInfo,
        address: orderType === 'delivery' && deliveryAddress ? { street: deliveryAddress, city: '', zip: '' } : undefined,
        pickupDateTime: orderType === 'pickup' && pickupDateTime ? pickupDateTime : undefined,
        dineInTime: orderType === 'dine_in' && dineInTime ? dineInTime : undefined,
        appliedReward: selectedReward ? selectedReward._id : undefined,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cash' ? 'pending' : 'paid',
          transactionId: paymentIntent.id || 'cash_order'
        }
      })
      setIsTyping(false)
      if (order) {
        const orderId = order._id || order.id;
        const dispOrderId = order.orderNumber || orderId;

        // Store in local storage for tracking
        const activeOrders = JSON.parse(localStorage.getItem('activeOrders') || '[]');
        if (orderId && !activeOrders.includes(orderId)) {
          activeOrders.push(orderId);
          localStorage.setItem('activeOrders', JSON.stringify(activeOrders));
        }

        const estimatedTime = order.estimatedDeliveryAt || order.estimatedReadyAt || order.estimatedDineInTime;
        const eta = estimatedTime 
          ? new Date(estimatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(Date.now() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setMessages(prev => [...prev, {
          type: 'bot',
          text: [
            'Order confirmed!',
            '',
            `Order ID: \`${dispOrderId}\``,
            `Items: ${cart.map(i => `${i.qty}x ${i.name}`).join(', ')}`,
            `Total: $${cartTotal.toFixed(2)}`,
            `Estimated ${orderType === 'delivery' ? 'delivery' : 'ready'}: **${eta}**`,
            'Status: **Paid via Card**'
          ].join('\n'),
          confirmed: true,
        }])
        clearCart()
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: "Something went wrong placing your order. Please try again or call us directly!",
        }])
      }
    } catch (error) {
      console.error('Order placement error:', error)
      setIsTyping(false)
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Order failed: ${error.message || 'Please try again or call us directly!'}`
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
        items: cart.map((i, index) => ({
          itemId: i.itemId || i._id || `custom-checkout-${index}-${Date.now()}`,
          name: i.name,
          quantity: i.qty,
          price: i.price,
          modifiers: i.modifiers || []
        })),
        type: orderType,
        customerInfo: customerInfo,
        address: orderType === 'delivery' && deliveryAddress ? { street: deliveryAddress, city: '', zip: '' } : undefined,
        pickupDateTime: orderType === 'pickup' && pickupDateTime ? pickupDateTime : undefined,
        dineInTime: orderType === 'dine_in' && dineInTime ? dineInTime : undefined,
        appliedReward: selectedReward ? selectedReward._id : undefined,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cash' ? 'pending' : 'paid',
          transactionId: paymentMethod === 'cash' ? `CASH-${Date.now()}` : `CARD-${Date.now()}`
        }
      })
      setIsTyping(false)
      if (order) {
        const orderId = order._id || order.id;
        const dispOrderId = order.orderNumber || orderId;

        // Store in local storage for tracking
        const activeOrders = JSON.parse(localStorage.getItem('activeOrders') || '[]');
        if (orderId && !activeOrders.includes(orderId)) {
          activeOrders.push(orderId);
          localStorage.setItem('activeOrders', JSON.stringify(activeOrders));
        }

        const estimatedTime = order.estimatedDeliveryAt || order.estimatedReadyAt || order.estimatedDineInTime;
        const eta = estimatedTime 
          ? new Date(estimatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(Date.now() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setMessages(prev => [...prev, {
          type: 'bot',
          text: [
            'Order confirmed!',
            '',
            `Order ID: \`${dispOrderId}\``,
            `Items: ${cart.map(i => `${i.qty}x ${i.name}`).join(', ')}`,
            `Total: $${cartTotal.toFixed(2)}`,
            `Estimated ${orderType === 'delivery' ? 'delivery' : 'ready'}: **${eta}**`
          ].join('\n'),
          confirmed: true,
        }])
        clearCart()
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: "Something went wrong placing your order. Please try again or call us directly!",
        }])
      }
    } catch (error) {
      console.error('Order placement error:', error)
      setIsTyping(false)
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Order failed: ${error.message || 'Please try again or call us directly!'}`
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
        deliveryAddress,
        settings
      })
      setIsTyping(false)
      if (res.action === 'PLACE_ORDER') {
        // Instead of immediate placement, move to checkout view so user can review/fill details
        handleCheckoutIntent()
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: res.text || "I'm here to help with your order." }])
      }
    } catch {
      setIsTyping(false)
      setMessages(prev => [...prev, { type: 'bot', text: "I'm having trouble right now. Try again!" }])
    }
  }

  return (
    <>
      {createPortal(<>
        {/* Floating Chat Button with cart badge */}
        <motion.button
          className="chatbot-float-btn fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9998] w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-2xl"
          style={{ position: 'fixed', right: '1.5rem', bottom: '1.5rem', background: 'linear-gradient(135deg, #C1440E 0%, #8B2F0A 100%)' }}
        whileHover={{ scale: 1.1, shadow: '0 8px 30px rgba(244,162,97,0.4)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.span className="text-xl sm:text-2xl font-serif-1947" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
            {isOpen ? 'X' : settings?.restaurantName?.[0] || 'M'}
        </motion.span>
        {cartCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-black text-[10px] sm:text-xs flex items-center justify-center font-black shadow-lg">
            {cartCount}
          </span>
        )}
      </motion.button>



      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] chatbot-overlay flex flex-col w-screen h-screen overflow-hidden" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {/* Header */}
            <div className="chatbot-header flex items-center justify-between p-4 sm:p-8 shrink-0 relative z-10">
              <button 
                type="button"
                className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:opacity-80 transition-opacity text-left outline-none"
                onClick={() => {
                  navigate('/')
                  setIsOpen(false)
                }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 font-serif text-xl sm:text-2xl" style={{ background: 'linear-gradient(135deg, #1A1410, #2A2420)' }}>
                  {settings?.restaurantName?.[0] || 'M'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-black text-sm sm:text-xl text-[#1A1410] truncate mt-1">{restaurantName}</h3>
                  <p className="text-[7px] sm:text-[9px] text-[#8A7A62] font-black uppercase tracking-[0.3em] flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> <span className="hidden xs:inline">System Active</span>
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-3 sm:gap-6">
                {/* Tab buttons - Visible on all screens for better nav */}
                <div className="chatbot-tab-rail flex items-center p-1 rounded-full">
                  {['chat', 'menu'].map(tab => (
                    <motion.button
                      key={tab}
                      onClick={() => tab === 'menu' ? (navigate('/menu'), setIsOpen(false)) : setView(tab)}
                      className={`px-3 sm:px-8 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all ${view === tab ? 'chatbot-tab-active' : 'chatbot-tab-inactive'}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tab}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  onClick={() => {
                    setIsVoiceEnabled(!isVoiceEnabled)
                    if (isVoiceEnabled) window.speechSynthesis.cancel()
                  }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${isVoiceEnabled ? 'chatbot-btn-primary' : 'chatbot-btn-secondary'}`}
                  whileTap={{ scale: 0.9 }}
                  title={isVoiceEnabled ? "Mute Bot Voice" : "Enable Bot Voice"}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    {isVoiceEnabled ? (
                      <path d="M12 3v18c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 2c3.87 0 7 3.13 7 7s-3.13 7-7 7V5zM7.27 10.11l2.73 2.73V7.12l-2.73 2.99z" />
                    ) : (
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    )}
                  </svg>
                </motion.button>

                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full chatbot-btn-secondary flex items-center justify-center transition-all font-bold shrink-0"
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto chatbot-scroll relative z-10 p-4 sm:p-10">
              {/* PAYMENT VIEW */}
              {view === 'payment' && (
                <div className="p-8 max-w-lg mx-auto w-full flex flex-col items-center justify-center min-h-[60vh] relative z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full chatbot-glass-card rounded-[3rem] p-10 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-tomato-500/5 rounded-full blur-2xl -mr-12 -mt-12" />

                    <div className="text-center mb-10">
                      <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl mb-6 text-white" style={{ background: 'linear-gradient(135deg, #C1440E, #8B2F0A)' }}>
                        {"\uD83D\uDCB3"}
                      </div>
                      <h2 className="font-serif-1947 text-3xl sm:text-4xl text-wood-800 tracking-tight">Secure Payment</h2>
                      <p className="text-xs text-wood-400 font-bold uppercase tracking-widest mt-2">Paying ${(cartTotal + (orderType === 'delivery' ? 3.99 : 0)).toFixed(2)} to {settings?.restaurantName || 'Pizza Blast'}</p>
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
                      onMenuOpen={() => { navigate('/menu'); setIsOpen(false); }}
                      onCartOpen={() => { setIsOpen(false); setIsCartOpen(true); }}
                      onCheckoutOpen={() => { navigate('/checkout'); setIsOpen(false); }}
                    />
                  ))}

                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* MENU VIEW */}
              {view === 'menu' && (
                <div className="p-6 max-w-4xl mx-auto w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <h2 className="font-display font-black text-3xl sm:text-4xl text-wood-800 tracking-tighter">Our Selection</h2>
                    <button
                      onClick={fetchMenuData}
                      className="px-4 py-2 rounded-full chatbot-btn-secondary text-xs uppercase font-black tracking-widest"
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
                          className={`chatbot-surface-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] group ${!item.available ? 'opacity-60' : ''
                            }`}
                        >
                          <div className="flex items-center gap-4 sm:gap-6">
                            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-transform group-hover:scale-125 shrink-0">{"\uD83C\uDF55"}</span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-serif-1947 text-lg sm:text-2xl text-wood-800 tracking-tight">{item.name}</span>
                                {item.isPopular && <span className="text-[8px] bg-tomato-600 text-white font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full">Popular</span>}
                                {!item.available && <span className="text-[8px] bg-gray-400 text-white font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full">Out of Stock</span>}
                              </div>
                              <p className="mt-1 text-sm text-wood-500 leading-relaxed line-clamp-2">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#1A1410]/8 shrink-0">
                            <span className="text-wood-800 font-black text-lg sm:text-xl tracking-tighter">${item.price.toFixed(2)}</span>
                            <motion.button
                              onClick={() => handleAddToCart(item)}
                              disabled={!item.available}
                              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest ${item.available
                                ? 'chatbot-btn-primary'
                                : 'bg-gray-300 text-gray-100 cursor-not-allowed'
                                }`}
                              whileHover={item.available ? { scale: 1.05 } : {}}
                              whileTap={item.available ? { scale: 0.95 } : {}}
                            >
                              {item.available ? '+ ADD' : 'UN'}
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
                <div className="p-6 max-w-2xl mx-auto w-full h-full relative z-10">
                  <h2 className="font-display font-black text-4xl text-slate-900 mb-8 tracking-tighter">Your Cart</h2>

                  {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-wood-400 py-20">
                      <span className="text-8xl">{"\uD83C\uDF55"}</span>
                      <p className="text-xl font-medium">Your cart is empty!</p>

                      <motion.button
                        onClick={() => { navigate('/menu'); setIsOpen(false); }}
                        className="px-10 py-4 rounded-2xl chatbot-btn-primary font-bold"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Explore Menu
                      </motion.button>

                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {cart.map(item => (
                        <div key={item._id} className="chatbot-surface-card flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] gap-6">
                          <div className="flex items-center gap-4 sm:gap-6">
                            <span className="text-3xl sm:text-5xl">{"\uD83C\uDF55"}</span>
                            <div>
                              <p className="font-serif-1947 text-lg sm:text-2xl text-wood-800 tracking-tight truncate max-w-[150px] sm:max-w-none">{item.name}</p>
                              <p className="text-tomato-600 font-black text-base sm:text-lg tracking-tight">${(item.price * item.qty).toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                            <p className="sm:hidden text-[10px] font-black uppercase tracking-widest text-wood-400">Quantity</p>
                            <div className="flex items-center gap-3 sm:gap-4">
                              <motion.button
                                onClick={() => removeFromCart(item._id)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl chatbot-btn-secondary flex items-center justify-center font-black"
                                whileTap={{ scale: 0.9 }}
                              >-</motion.button>
                              <span className="text-wood-800 font-black w-6 sm:w-8 text-center text-xl sm:text-2xl tracking-tighter">{item.qty}</span>
                              <motion.button
                                onClick={() => addToCart(item)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl chatbot-btn-primary flex items-center justify-center font-black"
                                whileTap={{ scale: 0.9 }}
                              >+</motion.button>
                            </div>
                          </div>
                        </div>
                      ))}


                      <div className="mt-8 sm:mt-12 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] chatbot-surface-card relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="flex justify-between items-center mb-8 sm:mb-10">
                          <div>
                            <p className="text-wood-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1 sm:mb-2 text-[8px] sm:text-[10px]">Total Amount Due</p>
                            <h3 className="text-3xl sm:text-5xl font-black tracking-tighter">${cartTotal.toFixed(2)}</h3>
                          </div>
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl chatbot-surface-card flex items-center justify-center text-2xl sm:text-4xl font-black text-tomato-600">
                            {settings?.restaurantName ? settings.restaurantName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'PB'}
                          </div>
                        </div>
                        <motion.button
                          onClick={handleCheckoutIntent}
                          disabled={isPlacingOrder}
                          className="w-full py-5 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] chatbot-btn-primary font-black text-base sm:text-lg disabled:opacity-50 tracking-widest uppercase"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isPlacingOrder ? 'Processing...' : 'Checkout Now'}
                        </motion.button>


                        <button
                          onClick={() => { navigate('/menu'); setIsOpen(false); }}
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
                <div className="p-8 max-w-lg mx-auto w-full flex flex-col items-center justify-center min-h-[60vh] relative z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full chatbot-glass-card rounded-[3rem] p-10 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-tomato-500/5 rounded-full blur-2xl -mr-12 -mt-12" />

                    <div className="text-center mb-10">
                      <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl mb-6 text-white" style={{ background: 'linear-gradient(135deg, #C1440E, #8B2F0A)' }}>
                        {"\uD83D\uDCB3"}
                      </div>
                      <h2 className="font-serif-1947 text-3xl sm:text-4xl text-wood-800 tracking-tight">Secure Payment</h2>
                      <p className="text-xs text-wood-400 font-bold uppercase tracking-widest mt-2 flex flex-col items-center">
                        <span>Subtotal: ${cartSubtotal.toFixed(2)}</span>
                        {selectedReward && <span className="text-green-500 font-bold">- Discount: ${discountAmount.toFixed(2)}</span>}
                        <span>Paying ${(cartTotal + (orderType === 'delivery' ? 3.99 : 0)).toFixed(2)} to {settings?.restaurantName || 'Pizza Blast'}</span>
                      </p>

                      <button
                        onClick={() => setView('cart')}
                        className="mt-4 text-tomato-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        {'<- Back to Cart'}
                      </button>
                    </div>

                    {!customerProfile && (
                      <div className="chatbot-surface-card mb-8 p-6 rounded-[1.75rem]">
                        <h3 className={sectionLabelClass}>Guest Information</h3>
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className={fieldClass}
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            className={fieldClass}
                          />
                          <input
                            type="email"
                            placeholder="Email Address (for confirmation)"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className={fieldClass}
                          />
                        </div>
                      </div>
                    )}

                    {customerProfile && availableRewards.length > 0 && (
                      <div className="mb-8">
                        <h3 className={`${sectionLabelClass} flex justify-between items-center`}>
                          Apply Loyalty Reward
                          <span className="text-tomato-500 text-sm font-black">{customerProfile.loyalty?.points || 0} PTS</span>
                        </h3>
                        <div className="space-y-3">
                          {availableRewards.map((reward) => {
                            const canAfford = (customerProfile.loyalty?.points || 0) >= reward.pointsCost;
                            const isSelected = selectedReward?._id === reward._id;
                            return (
                              <button
                                key={reward._id}
                                disabled={!canAfford && !isSelected}
                                onClick={() => isSelected ? setSelectedReward(null) : setSelectedReward(reward)}
                                className={`chatbot-surface-card w-full text-left p-4 rounded-[1.25rem] flex justify-between items-center ${isSelected ? 'border-tomato-500 bg-tomato-50' : canAfford ? '' : 'opacity-60 cursor-not-allowed'}`}
                              >
                                <div>
                                  <div className="font-semibold text-wood-800">{reward.name}</div>
                                  <div className="text-xs text-wood-500">{reward.pointsCost} Points - {reward.discountType === 'percentage' ? `${reward.discountValue}%` : `$${reward.discountValue}`} OFF</div>
                                </div>
                                {isSelected ? (
                                  <span className="text-tomato-500 font-bold text-sm">Applied</span>
                                ) : canAfford ? (
                                  <span className="text-tomato-500 text-sm font-semibold">Apply</span>
                                ) : (
                                  <span className="text-wood-400 text-sm">Need {reward.pointsCost - (customerProfile.loyalty?.points || 0)} more</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Order Type Selection */}
                    <div className="mb-8">
                      <h3 className={sectionLabelClass}>Choose Order Type</h3>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <button
                          type="button"
                          onClick={() => setOrderType('delivery')}
                          className={choiceCardClass(orderType === 'delivery')}
                        >
                          <div className="text-2xl mb-2">{"\uD83D\uDE9A"}</div>
                          <div className="font-semibold">Delivery</div>
                          <div className={`text-sm mt-1 ${orderType === 'delivery' ? 'text-white/85' : 'text-wood-600'}`}>25-40 min</div>
                          <div className={`text-xs mt-1 ${orderType === 'delivery' ? 'text-white/75' : 'text-wood-500'}`}>+ $3.99 delivery fee</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('pickup')}
                          className={choiceCardClass(orderType === 'pickup')}
                        >
                          <div className="text-2xl mb-2">{"\uD83D\uDED2"}</div>
                          <div className="font-semibold">Pickup</div>
                          <div className={`text-sm mt-1 ${orderType === 'pickup' ? 'text-white/85' : 'text-wood-600'}`}>20 min</div>
                          <div className={`text-xs mt-1 ${orderType === 'pickup' ? 'text-white/75' : 'text-green-600'}`}>No delivery fee</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('dine_in')}
                          className={choiceCardClass(orderType === 'dine_in')}
                        >
                          <div className="text-2xl mb-2">{"\uD83C\uDF7D"}</div>
                          <div className="font-semibold">Dine In</div>
                          <div className={`text-sm mt-1 ${orderType === 'dine_in' ? 'text-white/85' : 'text-wood-600'}`}>45 min</div>
                          <div className={`text-xs mt-1 ${orderType === 'dine_in' ? 'text-white/75' : 'text-green-600'}`}>No delivery fee</div>
                        </button>
                      </div>

                      {/* Delivery Address for delivery orders */}
                      {orderType === 'delivery' && (
                        <div className="mb-6">
                          <h3 className={sectionLabelClass}>Delivery Address</h3>
                          <input
                            type="text"
                            placeholder="Enter your delivery address"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className={fieldClass}
                          />
                        </div>
                      )}

                      {/* Pickup Date and Time */}
                      {orderType === 'pickup' && (
                        <div className="mb-6">
                          <h3 className={sectionLabelClass}>Pickup Date & Time</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-wood-700 mb-2">Date</label>
                              <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]} // Today's date
                                value={pickupDateTime.split('T')[0] || ''}
                                onChange={(e) => setPickupDateTime(e.target.value + 'T' + (pickupDateTime.split('T')[1] || ''))}
                                className={fieldClass}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-wood-700 mb-2">Time</label>
                              <input
                                type="time"
                                value={pickupDateTime.split('T')[1] || ''}
                                onChange={(e) => setPickupDateTime((pickupDateTime.split('T')[0] || '') + 'T' + e.target.value)}
                                className={fieldClass}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dine In Time for dine-in orders */}
                      {orderType === 'dine_in' && (
                        <div className="mb-6">
                          <h3 className={sectionLabelClass}>Dine In Time</h3>
                          <input
                            type="time"
                            value={dineInTime}
                            onChange={(e) => setDineInTime(e.target.value)}
                            className={fieldClass}
                          />
                        </div>
                      )}

                      {/* Payment Method Selection */}
                      <div className="mb-6">
                        <h3 className={sectionLabelClass}>Payment Method</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={choiceCardClass(paymentMethod === 'card')}
                          >
                            <div className="text-2xl mb-2">{"\uD83D\uDCB3"}</div>
                            <div className="font-semibold">Card Payment</div>
                            <div className={`text-sm mt-1 ${paymentMethod === 'card' ? 'text-white/85' : 'text-wood-600'}`}>Pay now online</div>
                            <div className={`text-xs mt-1 ${paymentMethod === 'card' ? 'text-white/75' : 'text-green-600'}`}>Secure & instant</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cash')}
                            className={choiceCardClass(paymentMethod === 'cash')}
                          >
                            <div className="text-2xl mb-2">{"\uD83D\uDCB5"}</div>
                            <div className="font-semibold">Cash on Delivery</div>
                            <div className={`text-sm mt-1 ${paymentMethod === 'cash' ? 'text-white/85' : 'text-wood-600'}`}>Pay when delivered</div>
                            <div className={`text-xs mt-1 ${paymentMethod === 'cash' ? 'text-white/75' : 'text-blue-600'}`}>No payment now</div>
                          </button>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="chatbot-summary-card mb-6 p-5 rounded-[1.5rem]">
                        <h3 className="font-serif-1947 text-2xl text-wood-800 mb-3 tracking-tight">Order Summary</h3>
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
                          <div className="flex justify-between font-semibold text-base pt-2 border-t border-[#1A1410]/8">
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
                            toast.error('Please enter a delivery address');
                            return;
                          }
                          if (!customerProfile && (!guestName || !guestPhone || !guestEmail)) {
                            toast.error('Please fill in your guest information (Name, Phone, and Email) so we can send you a confirmation.');
                            return;
                          }
                          paymentMethod === 'card' ? setView('payment') : handleCheckout()
                        }}
                        className="w-full chatbot-btn-primary py-4 rounded-[1.25rem] font-semibold"
                      >
                        {paymentMethod === 'card' ? 'Proceed to Payment' : 'Place Order (Cash on Delivery)'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Input - only in chat view */}
            {view === 'chat' && (
              <div className="chatbot-input-area p-4 sm:p-8">
                <div className="max-w-4xl mx-auto w-full">
                  <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2">
                    <motion.button type="button" onClick={() => { navigate('/menu'); setIsOpen(false); }}
                      className="px-4 sm:px-8 py-2 sm:py-2.5 rounded-full chatbot-btn-secondary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap"
                      whileTap={{ scale: 0.95 }}>{t('chatbot.browseMenu')}</motion.button>
                    {cart.length > 0 && (
                      <motion.button type="button" onClick={() => { setIsOpen(false); setIsCartOpen(true); }}
                        className="px-4 sm:px-8 py-2 sm:py-2.5 rounded-full chatbot-btn-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap"
                        whileTap={{ scale: 0.95 }}>Cart ({cartCount})</motion.button>
                    )}
                  </div>
                  <form onSubmit={handleSend} className="flex gap-2 sm:gap-4">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="How can I help you?"
                      className="flex-1 px-5 py-4 chatbot-input-field outline-none font-medium text-sm sm:text-base tracking-tight"
                    />
                    <motion.button
                      type="button"
                      onClick={toggleListening}
                      className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full transition-all ${isListening ? 'chatbot-btn-primary animate-pulse' : 'chatbot-btn-secondary'}`}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="w-12 h-12 sm:w-16 sm:h-16 chatbot-btn-primary font-black rounded-full flex items-center justify-center shrink-0"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </motion.button>
                  </form>
                </div>
              </div>
            )}


          </motion.div>
        )}
      </AnimatePresence></>, document.body)}
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
          ? 'chatbot-msg-bot rounded-tl-sm font-medium'
          : 'chatbot-msg-user rounded-tr-sm font-bold shadow-lg'
          }`}>
          <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: formatText(message.text) }} />
        </div>


        {/* Action buttons on bot messages */}
        {isBot && (message.showMenuBtn || message.cartAction || message.confirmed) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(message.showMenuBtn || message.cartAction) && (
              <motion.button
                onClick={onMenuOpen}
                className="px-6 py-2.5 rounded-2xl chatbot-btn-primary text-sm font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Menu
              </motion.button>
            )}
            {message.cartAction && (
              <motion.button
                onClick={onCartOpen}
                className="px-6 py-2.5 rounded-2xl chatbot-btn-secondary text-sm font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Cart
              </motion.button>
            )}
            {message.cartAction && (
              <motion.button
                onClick={onCheckoutOpen}
                className="px-6 py-2.5 rounded-2xl chatbot-btn-primary text-sm font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Checkout
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
      <div className="px-5 py-4 rounded-[2rem] rounded-tl-sm chatbot-msg-bot flex gap-2 shadow-lg">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#C1440E]"
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  )
}
