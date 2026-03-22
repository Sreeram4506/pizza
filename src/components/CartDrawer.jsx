import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import { resolveMenuItemImage } from '../utils/menuArtwork'

export default function CartDrawer() {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    addToCart, 
    removeFromCart, 
    cartTotal,
    orderType,
    setOrderType,
    openWithIntent
  } = useChatbot()
  const { settings } = useSettings()
  const navigate = useNavigate()

  if (!isCartOpen) return null

  // Points System Logic: 10 points per dollar spent.
  const pointsEarned = Math.floor(cartTotal * 10)

  const handleCheckout = () => {
    setIsCartOpen(false)
    navigate('/checkout')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-[4px]"
        />

        {/* Drawer content mapping the exact cart layout, but converted to minimal light theme */}
        <motion.div 
          initial={{ x: '100%', opacity: 0.8 }} 
          animate={{ x: 0, opacity: 1 }} 
          exit={{ x: '100%', opacity: 0.8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-full sm:w-[500px] h-full bg-[#FAFAF8] pb-safe z-10 flex flex-col shadow-2xl border-l border-[#EBEBE6]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-[#1A1410] text-3xl font-bold font-serif tracking-tight">Cart</h2>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1A1410]/70 hover:text-[#1A1410] hover:bg-black/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 pb-5 border-b border-[#EBEBE6]">
            {/* Delivery Toggle */}
            <div className="flex p-1 bg-[#F5F5F0] rounded-[14px] mb-4 shadow-inner">
              {['pickup', 'delivery'].map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold capitalize transition-all ${
                    orderType === type 
                      ? 'bg-white text-[#1A1410] shadow-sm ring-1 ring-[#EBEBE6]' 
                      : 'text-[#1A1410]/60 hover:text-[#1A1410]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Time selector (ASAP) */}
            <button className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-[#EBEBE6] rounded-[14px] text-[#1A1410] outline-none shadow-sm hover:border-[#1A1410]/20 transition-colors">
              <span className="text-[13px] font-bold">ASAP (20 min)</span>
              <svg className="w-4 h-4 text-[#1A1410]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Cart Items Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#1A1410]/40 space-y-4">
                <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-sm font-bold">Your cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item._id} className="flex gap-5">
                  <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-[#F5F5F0] border border-[#EBEBE6] shadow-sm">
                    <img src={resolveMenuItemImage(item)} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 pt-1 flex flex-col">
                    <h4 className="text-[#1A1410] text-[15px] font-bold leading-tight line-clamp-2">
                      {item.name} {item.modifiers?.length ? `(${item.modifiers.join(', ')})` : ''}
                    </h4>
                    
                    <div className="flex items-center justify-between mt-auto pt-4">
                      <div className="flex items-center gap-4 bg-white border border-[#EBEBE6] rounded-full px-1.5 py-1 w-fit shadow-sm">
                        <button 
                          onClick={() => removeFromCart(item._id)}
                          className="w-7 h-7 flex items-center justify-center text-[#1A1410]/60 hover:text-[#1A1410] hover:bg-black/5 rounded-full transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="text-[#1A1410] text-[13px] font-bold w-4 text-center select-none">{item.qty}</span>
                        <button 
                          onClick={() => addToCart({ ...item, qty: 1 })}
                          className="w-7 h-7 flex items-center justify-center text-[#1A1410]/60 hover:text-[#1A1410] hover:bg-black/5 rounded-full transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      <span className="text-[#1A1410] font-black text-[16px]">
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Area */}
          {cart.length > 0 && (
            <div className="px-6 pb-6 pt-5 bg-white border-t border-[#EBEBE6] shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20">
              
              {/* Points Logic Section */}
              <div className="py-3 px-4 rounded-[12px] bg-[#FFFDF7] border border-[#EBB250]/40 text-center mb-6 shadow-sm">
                <span className="text-[#1A1410] text-[13px] font-medium">
                  You'll earn <span className="font-extrabold text-[#D2902A]">{pointsEarned} points</span> with this order
                </span>
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[#1A1410] text-[17px] font-bold">Subtotal</span>
                <span className="text-[#1A1410] text-[20px] font-black tracking-tight">${cartTotal.toFixed(2)}</span>
              </div>

              {/* Checkout CTA */}
              <button 
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 bg-[#EBB250] hover:bg-[#DCA440] text-[#1A1410] text-[18px] font-black py-5 rounded-[16px] transition-all active:scale-[0.98] shadow-md hover:shadow-xl mt-2"
              >
                Go to checkout
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
