import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'

export default function DeliveryTrackingBar() {
  const [activeOrder, setActiveOrder] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Routes where the bar should NOT appear
  const excludedPaths = ['/admin', '/delivery', '/checkout', '/login', '/register', '/forgot-password', '/reset-password']
  const shouldHide = excludedPaths.some(p => location.pathname.startsWith(p)) || location.pathname.startsWith('/track/')

  useEffect(() => {
    const checkActiveOrders = async () => {
      try {
        let currentUserId = 'guest'
        let serverOrders = []
        
        // 1. Get current identity from server
        const token = localStorage.getItem('customerToken')
        if (token) {
          try {
            const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` }})
            if (res.ok) {
              const data = await res.json()
              currentUserId = data.user?._id || data.user?.id
              serverOrders = data.orders || []
            }
          } catch (e) {
            console.warn('[TRACKING-BAR] Auth fetch failed:', e)
          }
        }

        let foundActive = null

        // 2. SEARCH FOR ORDERS BELONGING ONLY TO THIS USER
        
        // A. Check server-side verified orders (Highest Priority & Most Secure)
        if (currentUserId !== 'guest' && serverOrders.length > 0) {
          const activeServerOrder = serverOrders.find(o => 
            !['delivered', 'cancelled', 'completed'].includes(o.status)
          )
          if (activeServerOrder) {
            foundActive = {
              orderNumber: activeServerOrder.orderNumber,
              status: activeServerOrder.status,
              type: activeServerOrder.type,
              customerId: activeServerOrder.customerId
            }
          }
        }

        // B. Fallback to localStorage ONLY for Guest Orders or if Server Sync is Delayed
        if (!foundActive) {
          const storageKey = currentUserId !== 'guest' ? `activeOrders_${currentUserId}` : 'activeOrders_guest'
          const localActiveIds = JSON.parse(localStorage.getItem(storageKey) || '[]')
          
          if (localActiveIds.length > 0) {
            const lastId = localActiveIds[localActiveIds.length - 1]
            try {
              const orderRes = await fetch(`/api/orders/${lastId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
              })
              if (orderRes.ok) {
                const order = await orderRes.json()
                
                // CRITICAL SECURITY CHECKS:
                // 1. If currently logged in, order MUST have our customerId
                if (currentUserId !== 'guest' && order.customerId && order.customerId !== currentUserId) {
                   // This order belongs to someone else! (Maybe switched accounts)
                   foundActive = null
                } 
                // 2. If guest, hide if order belongs to ANY account (User must log in to see it)
                else if (currentUserId === 'guest' && order.customerId) {
                   foundActive = null
                }
                // 3. For guest orders, add a recency cutoff (24 hours) to avoid "global" ghost orders
                else if (currentUserId === 'guest' && !order.customerId) {
                   const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.now()
                   const isRecent = (Date.now() - orderTime) < (24 * 60 * 60 * 1000)
                   
                   if (isRecent && order && !['delivered', 'cancelled', 'completed'].includes(order.status)) {
                     foundActive = {
                        orderNumber: order.orderNumber,
                        status: order.status,
                        type: order.type
                     }
                   }
                }
                // 4. Logged in and order matches
                else if (order && !['delivered', 'cancelled', 'completed'].includes(order.status)) {
                   foundActive = {
                      orderNumber: order.orderNumber,
                      status: order.status,
                      type: order.type
                   }
                }
              }
            } catch (e) {
              console.warn('[TRACKING-BAR] Order fetch failed:', e)
            }
          }
        }

        if (foundActive) {
          setActiveOrder(foundActive)
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      } catch (err) {
        console.warn('[TRACKING-BAR] Silently failed check:', err)
      }
    }

    checkActiveOrders()
    const interval = setInterval(checkActiveOrders, 30000)

    // Listen for storage changes (logout in another tab or handled via manual clear)
    const handleStorageChange = (e) => {
      if ((e.key === 'customerToken' || e.key === 'activeOrders') && !e.newValue) {
        setActiveOrder(null)
        setIsVisible(false)
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [location.pathname])

  if (!isVisible || shouldHide || !activeOrder || isDismissed) return null

  const statusLabel = {
    confirmed: 'Order Confirmed',
    preparing: 'Being Prepared',
    ready: 'Ready for Pickup',
    out_for_delivery: 'On the Way'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        className="fixed bottom-24 left-3 right-3 sm:bottom-10 sm:left-auto sm:right-10 sm:w-[420px] z-[9997]"
      >
        <div className="relative group">
          <button
            onClick={() => navigate(`/track/${activeOrder.orderNumber}`)}
            className="w-full bg-[#1A1410] text-[#FAFAF8] p-4 sm:p-5 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-between border border-[#EBB250]/40 hover:border-[#EBB250] transition-all active:scale-[0.98] overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#EBB250]/5 rounded-full -mr-20 -mt-20 pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10 w-full overflow-hidden">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#EBB250] rounded-3xl flex items-center justify-center text-3xl sm:text-4xl animate-pulse shrink-0 shadow-lg shadow-[#EBB250]/30 transition-transform group-hover:scale-110 duration-500">
                {activeOrder.status === 'out_for_delivery' ? '🛵' : activeOrder.status === 'preparing' ? '👨‍🍳' : '🍕'}
              </div>
              <div className="text-left min-w-0 pr-2">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-[#EBB250] mb-1">Coming your way!</p>
                <h4 className="text-[16px] sm:text-[18px] font-black tracking-tight flex items-center gap-2 truncate text-white uppercase italic">
                  #{activeOrder.orderNumber}
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </h4>
                <p className="text-[13px] sm:text-[14px] text-[#FAFAF8]/70 font-bold truncate leading-none mt-1">{statusLabel[activeOrder.status] || activeOrder.status}</p>
              </div>
            </div>

            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FAFAF8]/10 flex items-center justify-center group-hover:bg-[#EBB250] group-hover:text-[#1A1410] transition-all shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Dismiss Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsDismissed(true) }}
            className="absolute -top-3 -right-1 w-8 h-8 bg-white border-2 border-[#1A1410] rounded-full flex items-center justify-center text-[10px] sm:text-[12px] font-black shadow-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 scale-100 sm:scale-90 group-hover:scale-100 z-20"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
