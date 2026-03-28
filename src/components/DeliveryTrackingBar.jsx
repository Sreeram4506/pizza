import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'

export default function DeliveryTrackingBar() {
  const [activeOrder, setActiveOrder] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // STRICTLY only show on the profile page to ensure privacy
  const shouldHide = location.pathname !== '/profile'

  useEffect(() => {
    const checkActiveOrders = async () => {
      // 1. Get current user ID to check their specific storage key
      let userId = 'guest'
      const token = localStorage.getItem('customerToken')
      if (token) {
        try {
          const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` }})
          if (res.ok) {
            const data = await res.json()
            userId = data.user._id
          }
        } catch {}
      }

      const storageKey = userId !== 'guest' ? `activeOrders_${userId}` : 'activeOrders_guest'
      const activeOrderIds = JSON.parse(localStorage.getItem(storageKey) || '[]')
      if (activeOrderIds.length === 0) { setIsVisible(false); return }

      try {
        // Try fetching the newest order status
        const lastId = activeOrderIds[activeOrderIds.length - 1]
        const res = await fetch(`/api/orders/${lastId}`)
        if (!res.ok) throw new Error('fetch failed')
        const order = await res.json()

        if (order && order.type === 'delivery' && !['delivered', 'cancelled', 'completed'].includes(order.status)) {
          setActiveOrder({
            orderNumber: order.orderNumber,
            status: order.status,
            type: order.type
          })
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      } catch {
        setIsVisible(false)
      }
    }

    checkActiveOrders()
    const interval = setInterval(checkActiveOrders, 30000)
    return () => clearInterval(interval)
  }, [location.pathname])

  if (!isVisible || shouldHide || !activeOrder) return null

  const statusLabel = {
    confirmed: 'Order Confirmed',
    preparing: 'Being Prepared',
    ready: 'Ready for Pickup',
    out_for_delivery: 'On the Way'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-3 right-3 sm:bottom-8 sm:left-auto sm:right-8 sm:w-[380px] z-[9990]"
      >
        <button
          onClick={() => navigate(`/track/${activeOrder.orderNumber}`)}
          className="w-full bg-[#1A1410] text-[#FAFAF8] p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-[#EBB250]/30 hover:border-[#EBB250] transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#EBB250] rounded-xl flex items-center justify-center text-xl sm:text-2xl animate-pulse shrink-0">
              🚚
            </div>
            <div className="text-left min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#EBB250]">Live Tracking</p>
              <h4 className="text-[13px] sm:text-[15px] font-black tracking-tight flex items-center gap-2 truncate">
                #{activeOrder.orderNumber}
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              </h4>
              <p className="text-[11px] sm:text-[12px] text-[#FAFAF8]/60 font-medium truncate">{statusLabel[activeOrder.status] || activeOrder.status}</p>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAFAF8]/10 flex items-center justify-center group-hover:bg-[#EBB250] group-hover:text-[#1A1410] transition-colors shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
