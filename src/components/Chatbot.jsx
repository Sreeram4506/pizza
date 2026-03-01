import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatbot } from '../context/ChatbotContext'
import { OrderService } from '../services/OrderService'
import wsService from '../services/websocket.js'

export default function Chatbot() {
  const { isOpen, setIsOpen, initialMessage } = useChatbot()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [cart, setCart] = useState([])
  const [view, setView] = useState('chat') // 'chat' | 'menu' | 'cart'
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [menuItems, setMenuItems] = useState([])
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
          setCart(prev => [...prev, { ...customItem, qty: 1 }])
          setMessages(prev => [...prev, {
            type: 'bot',
            text: `🍕 **Custom Pizza Added!**\n\nBase: ${data.item.base}\nSauce: ${data.item.sauce}\nToppings: ${data.item.toppings.join(', ')}\nPrice: $${data.item.price}\n\nKeep adding or go to cart to checkout!`,
            cartAction: true,
          }])
          setView('chat')
        }
        break
      case 'menu':
        setView('menu')
        break
      case 'order':
        setView('menu')
        break
      default:
        break
    }
  }

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id)
      if (existing) return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...item, qty: 1 }]
    })
    setMessages(prev => [...prev, {
      type: 'bot',
      text: `Added **${item.name}** to your cart! 🍕 Keep adding or go to cart to checkout.`,
      cartAction: true,
    }])
    setView('chat')
  }

  const removeFromCart = (id) => {
    setCart(prev => {
      const item = prev.find(i => i._id === id)
      if (item.qty === 1) return prev.filter(i => i._id !== id)
      return prev.map(i => i._id === id ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setIsPlacingOrder(true)
    setView('chat')
    setMessages(prev => [...prev, { type: 'user', text: 'Place my order' }])
    setIsTyping(true)
    try {
      const order = await OrderService.placeOrder({
        items: cart.map(i => ({ 
          itemId: i._id, // Add itemId for the order
          name: i.name, 
          quantity: i.qty,  // Changed from qty to quantity
          price: i.price,
          modifiers: i.modifiers || []
        })),
        type: 'delivery',
        customerInfo: {
          name: 'Chat Customer',
          phone: '000-000-0000'
        }
      })
      setIsTyping(false)
      if (order) {
        const eta = new Date(order.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setMessages(prev => [...prev, {
          type: 'bot',
          text: `✅ **Order Confirmed!**\n\nOrder ID: \`${order.id}\`\nItems: ${cart.map(i => `${i.qty}× ${i.name}`).join(', ')}\nTotal: $${cartTotal.toFixed(2)}\n⏱️ Estimated delivery: **${eta}**`,
          confirmed: true,
        }])
        setCart([])
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
      const res = await OrderService.chat(msg, { items: cart })
      setIsTyping(false)
      if (res.action === 'PLACE_ORDER') {
        await handleCheckout()
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
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-brand-gold to-orange-500 shadow-[0_0_30px_rgba(244,162,97,0.4)] flex items-center justify-center text-black"
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
            className="fixed inset-0 z-50 bg-white flex flex-col border-none text-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-gold flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(244,162,97,0.2)]">
                  🍕
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900 tracking-tight uppercase">Pizza Assistant</h3>
                  <p className="text-[10px] text-brand-gold font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" /> System Active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Tab buttons */}
                <div className="hidden md:flex items-center bg-white/50 rounded-full p-1 border border-gray-100">
                  {['chat', 'menu', 'cart'].map(tab => (
                    <motion.button
                      key={tab}
                      onClick={() => setView(tab)}
                      className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${view === tab ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/20' : 'text-slate-600 hover:text-brand-gold'}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tab === 'cart' ? `Cart ${cartCount > 0 ? `(${cartCount})` : ''}` : tab}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center text-slate-600 hover:text-brand-gold hover:border-gray-300 transition-all"
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
              {/* CHAT VIEW */}
              {view === 'chat' && (
                <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
                  {messages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} onMenuOpen={() => setView('menu')} onCartOpen={() => setView('cart')} />
                  ))}

                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* MENU VIEW */}
              {view === 'menu' && (
                <div className="p-6 max-w-4xl mx-auto w-full">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="font-display font-black text-4xl text-slate-900 tracking-tighter">🍕 Our Selection</h2>
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
                          className={`flex items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-white/50 border border-gray-100 hover:border-tomato-300 transition-all group ${
                            !item.available ? 'opacity-60' : ''
                          }`}
                        >
                        <div className="flex items-center gap-6">
                          <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(244,162,97,0.4)] transition-transform group-hover:scale-125">🍕</span>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-display font-black text-lg text-slate-900 uppercase tracking-tight">{item.name}</span>
                              {item.isPopular && <span className="text-[9px] bg-tomato-600 text-white font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">Popular</span>}
                              {!item.available && <span className="text-[9px] bg-gray-400 text-white font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">Out of Stock</span>}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 font-light">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <span className="text-slate-900 font-black text-xl tracking-tighter">${item.price.toFixed(2)}</span>
                          <motion.button
                            onClick={() => addToCart(item)}
                            disabled={!item.available}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${
                              item.available 
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
                      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-slate-400 py-20">
                      <span className="text-8xl">🍕</span>
                      <p className="text-xl font-medium">Your cart is empty!</p>

                      <motion.button
                        onClick={() => setView('menu')}
                        className="px-10 py-4 rounded-2xl bg-primary-600 text-white font-bold shadow-glow"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Explore Menu
                      </motion.button>

                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {cart.map(item => (
                        <div key={item._id} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-white/50 border border-gray-100">
                          <div className="flex items-center gap-6">
                            <span className="text-5xl">🍕</span>
                            <div>
                              <p className="font-display font-black text-slate-900 text-xl uppercase tracking-tight">{item.name}</p>
                              <p className="text-tomato-600 font-black text-lg tracking-tight">${(item.price * item.qty).toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <motion.button
                              onClick={() => removeFromCart(item._id)}
                              className="w-12 h-12 rounded-2xl bg-white/50 border border-gray-100 flex items-center justify-center text-slate-700 font-black hover:bg-white/60 transition-colors"
                              whileTap={{ scale: 0.9 }}
                            >−</motion.button>
                            <span className="text-slate-900 font-black w-8 text-center text-2xl tracking-tighter">{item.qty}</span>
                            <motion.button
                              onClick={() => addToCart(item)}
                              className="w-12 h-12 rounded-2xl bg-brand-gold flex items-center justify-center text-black font-black shadow-lg shadow-brand-gold/10"
                              whileTap={{ scale: 0.9 }}
                            >+</motion.button>
                          </div>
                        </div>
                      ))}


                      <div className="mt-12 p-10 rounded-[3rem] bg-white text-black shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="flex justify-between items-center mb-10">
                          <div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Amount Due</p>
                            <h3 className="text-5xl font-black tracking-tighter">${cartTotal.toFixed(2)}</h3>
                          </div>
                          <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-4xl shadow-inner italic font-black text-brand-gold">PB</div>
                        </div>
                        <motion.button
                          onClick={handleCheckout}
                          disabled={isPlacingOrder}
                          className="w-full py-6 rounded-[2rem] bg-brand-gold text-black font-black text-lg shadow-xl disabled:opacity-50 tracking-widest uppercase"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isPlacingOrder ? '⏳ Processing Order...' : 'Place Secure Order'}
                        </motion.button>


                        <button
                          onClick={() => setView('menu')}
                          className="w-full mt-4 text-sm text-slate-400 font-bold uppercase tracking-widest hover:text-brand-gold transition-colors"
                        >
                          + Add more items
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input — only in chat view */}
            {view === 'chat' && (
              <div className="p-8 bg-white border-t border-gray-100">
                <div className="max-w-4xl mx-auto w-full">
                  <div className="flex gap-4 mb-6">
                    <motion.button type="button" onClick={() => setView('menu')}
                      className="px-8 py-2.5 rounded-full border border-gray-100 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-brand-gold hover:border-gray-200 transition-all"
                      whileTap={{ scale: 0.95 }}>Browse Menu</motion.button>
                    {cart.length > 0 && (
                      <motion.button type="button" onClick={() => setView('cart')}
                        className="px-8 py-2.5 rounded-full bg-brand-gold text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-gold/10"
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
                      className="flex-1 px-8 py-5 rounded-[2rem] bg-white/50 border-none focus:ring-2 focus:ring-brand-gold/30 outline-none text-slate-900 font-light placeholder:text-gray-400"
                    />
                    <motion.button
                      type="submit"
                      className="w-16 h-16 bg-brand-gold text-black font-black rounded-full shadow-lg shadow-brand-gold/20 flex items-center justify-center shrink-0"
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

function ChatMessage({ message, onMenuOpen, onCartOpen }) {
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
        <div className={`inline-block px-6 py-5 rounded-[2.5rem] ${isBot
           ? 'bg-white/50 rounded-tl-sm text-slate-800 font-light border border-gray-100'
          : 'bg-brand-gold text-black rounded-tr-sm shadow-xl shadow-brand-gold/10 font-bold'
          }`}>
          <p className="text-base whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatText(message.text) }} />
        </div>


        {/* Action buttons on bot messages */}
        {isBot && (message.showMenuBtn || message.cartAction || message.confirmed) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(message.showMenuBtn || message.cartAction) && (
              <motion.button
                onClick={onMenuOpen}
                className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🍕 Explore Menu
              </motion.button>
            )}
            {message.cartAction && (
              <motion.button
                onClick={onCartOpen}
                className="px-6 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-900 text-sm font-bold hover:bg-slate-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🛒 View Cart
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
      <div className="px-5 py-4 rounded-[2rem] rounded-tl-sm bg-white/50 flex gap-2 border border-gray-100">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-gold"
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

