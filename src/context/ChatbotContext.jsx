import { createContext, useContext, useState } from 'react'

const ChatbotContext = createContext()

export function ChatbotProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialMessage, setInitialMessage] = useState(null)

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

  return (
    <ChatbotContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      openWithIntent, 
      openChatbot, 
      closeChatbot,
      initialMessage 
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
