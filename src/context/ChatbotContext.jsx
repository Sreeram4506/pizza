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

  // Persistence effect
  useEffect(() => {
    localStorage.setItem('pizza_cart', JSON.stringify(cart))
  }, [cart])

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
      const existing = prev.find(i => i._id === item._id)
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...item, qty: 1 }]
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
      cartCount,
      cartTotal
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
