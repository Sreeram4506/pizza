import { createContext, useContext, useState, useEffect } from 'react'

const ChatbotContext = createContext()

export function ChatbotProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
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

  // Persistence effect for cart
  useEffect(() => {
    localStorage.setItem('pizza_cart', JSON.stringify(cart))
  }, [cart])

  // Persistence effect for voice
  useEffect(() => {
    localStorage.setItem('chatbot_voice_enabled', isVoiceEnabled)
  }, [isVoiceEnabled])

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
      const itemId = item._id || item.itemId
      const existing = prev.find(i => (i._id || i.itemId) === itemId)
      if (existing) {
        return prev.map(i => (i._id || i.itemId) === itemId ? { ...i, qty: (i.qty || 1) + (item.qty || 1) } : i)
      }
      return [...prev, { ...item, _id: itemId, qty: item.qty || 1 }]
    })
  }

  const addMultipleToCart = (items) => {
    setCart(prev => {
      let newCart = [...prev]
      items.forEach(newItem => {
        const itemId = newItem._id || newItem.itemId
        const existingIdx = newCart.findIndex(i => (i._id || i.itemId) === itemId)
        if (existingIdx > -1) {
          const existingItem = newCart[existingIdx]
          newCart[existingIdx] = { ...existingItem, qty: (existingItem.qty || 1) + (newItem.qty || newItem.quantity || 1) }
        } else {
          newCart.push({ ...newItem, _id: itemId, qty: newItem.qty || newItem.quantity || 1 })
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

  const cartCount = cart.reduce((sum, i) => sum + (i.qty || 0), 0)
  const cartTotal = cart.reduce((sum, i) => sum + (i.price * (i.qty || 0)), 0)

  return (
    <ChatbotContext.Provider value={{
      isOpen,
      setIsOpen,
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
      isVoiceEnabled,
      setIsVoiceEnabled
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
