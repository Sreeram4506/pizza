import { createContext, useContext, useState, useEffect } from 'react'

const ChatbotContext = createContext()

const createCartItemId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function ChatbotProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [initialMessage, setInitialMessage] = useState(null)

  // Cart State with LocalStorage Persistence
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('pizza_cart')
    return saved ? JSON.parse(saved) : []
  })

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('chatbot_voice_enabled')
    return saved === 'true'
  })

  // Persistence for Order Type (pickup/delivery)
  const [orderType, setOrderType] = useState(() => {
    return localStorage.getItem('pizza_order_type') || 'delivery'
  })

  // Persistence effect for cart
  useEffect(() => {
    localStorage.setItem('pizza_cart', JSON.stringify(cart))
  }, [cart])

  // Persistence effect for voice
  useEffect(() => {
    localStorage.setItem('chatbot_voice_enabled', isVoiceEnabled)
  }, [isVoiceEnabled])

  // Persistence for Order Type
  useEffect(() => {
    localStorage.setItem('pizza_order_type', orderType)
  }, [orderType])

  const openWithIntent = (intent, data = {}) => {
    setInitialMessage({ intent, data })
    setIsOpen(true)
    setTimeout(() => setInitialMessage(null), 500)
  }

  const openChatbot = () => {
    setInitialMessage(null)
    setIsOpen(true)
  }

  const closeChatbot = () => setIsOpen(false)

  // Cart Methods
  const addToCart = (item) => {
    setCart(prev => {
      const isPoints = item.isPointsRedemption || false
      const itemId = item._id || item.itemId || createCartItemId()
      
      // Points items are unique entries usually, but if we want to stack them:
      const existing = prev.find(i => (i._id || i.itemId) === itemId && i.isPointsRedemption === isPoints)
      
      if (existing) {
        return prev.map(i => ((i._id || i.itemId) === itemId && i.isPointsRedemption === isPoints) ? { ...i, qty: (i.qty || 1) + (item.qty || 1) } : i)
      }
      return [...prev, { ...item, _id: itemId, itemId, qty: item.qty || 1, isPointsRedemption: isPoints, pointsCost: item.pointsCost || 0 }]
    })
  }

  const addMultipleToCart = (items) => {
    setCart(prev => {
      let newCart = [...prev]
      items.forEach(newItem => {
        const itemId = newItem._id || newItem.itemId || createCartItemId()
        const existingIdx = newCart.findIndex(i => (i._id || i.itemId) === itemId)
        if (existingIdx > -1) {
          const existingItem = newCart[existingIdx]
          newCart[existingIdx] = { ...existingItem, qty: (existingItem.qty || 1) + (newItem.qty || newItem.quantity || 1) }
        } else {
          newCart.push({ ...newItem, _id: itemId, itemId, qty: newItem.qty || newItem.quantity || 1 })
        }
      })
      return newCart
    })
  }

  const removeFromCart = (id) => {
    setCart(prev => {
      const item = prev.find(i => i._id === id)
      if (!item) return prev
      if (item.qty === 1) return prev.filter(i => i._id !== id)
      return prev.map(i => i._id === id ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  const clearCart = () => setCart([])

  const clearOrderType = () => {
    setOrderType('delivery')
    localStorage.removeItem('pizza_order_type')
  }

  const cartCount = cart.reduce((sum, i) => sum + (i.qty || 0), 0)
  const cartTotal = cart.reduce((sum, i) => sum + (i.isPointsRedemption ? 0 : (i.price * (i.qty || 0))), 0)
  const cartPointsTotal = cart.reduce((sum, i) => sum + (i.isPointsRedemption ? (i.pointsCost * (i.qty || 0)) : 0), 0)

  return (
    <ChatbotContext.Provider value={{
      isOpen,
      setIsOpen,
      isCartOpen,
      setIsCartOpen,
      openWithIntent,
      openChatbot,
      closeChatbot,
      initialMessage,
      cart,
      setCart,
      addToCart,
      removeFromCart,
      clearCart,
      addMultipleToCart,
      cartCount,
      cartTotal,
      cartPointsTotal,
      isVoiceEnabled,
      setIsVoiceEnabled,
      orderType,
      setOrderType,
      clearOrderType
    }}>
      {children}
    </ChatbotContext.Provider>
  )
}

export function useChatbot() {
  const context = useContext(ChatbotContext)
  if (!context) {
    throw new Error('useChatbot must be used within ChatbotProvider')
  }
  return context
}
