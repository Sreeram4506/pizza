import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
  { id: 'orders', label: 'Orders', icon: '📋', path: '/admin/orders' },
  { id: 'menu', label: 'Menu', icon: '🍕', path: '/admin/menu' },
  { id: 'customers', label: 'Customers', icon: '👥', path: '/admin/customers' },
  { id: 'loyalty', label: 'Loyalty', icon: '🏆', path: '/admin/loyalty' },
  { id: 'analytics', label: 'Analytics', icon: '📈', path: '/admin/analytics' },
  { id: 'marketing', label: 'Marketing', icon: '📢', path: '/admin/marketing' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeItem, setActiveItem] = useState('dashboard')
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Close mobile sidebar on route change
    setMobileSidebarOpen(false)
    // Check authentication
    const token = localStorage.getItem('adminToken')
    if (!token && location.pathname !== '/admin/login') {
      navigate('/admin/login')
      return
    }
    const currentItem = sidebarItems.find(item => location.pathname.includes(item.path))
    if (currentItem) setActiveItem(currentItem.id)
  }, [location, navigate])

  // Close sidebar on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  const SidebarContent = ({ onClose }) => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-wood-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-tomato-600 rounded-xl flex items-center justify-center text-xl shadow-lg flex-shrink-0">
            🍕
          </div>
          {(sidebarOpen || onClose) && (
            <div>
              <h1 className="font-display font-bold text-white text-base leading-tight">PizzaBlast</h1>
              <p className="text-tomato-400 text-xs">Admin Panel</p>
            </div>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-wood-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => {
              setActiveItem(item.id)
              navigate(item.path)
              if (onClose) onClose()
            }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${activeItem === item.id
                ? 'bg-tomato-600 text-white shadow-lg'
                : 'text-wood-300 hover:bg-wood-700 hover:text-white'
              }`}
            whileHover={{ x: sidebarOpen || onClose ? 4 : 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {(sidebarOpen || onClose) && (
              <span className="font-medium text-sm truncate">{item.label}</span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* Desktop toggle */}
      {!onClose && (
        <div className="p-3 border-t border-wood-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-wood-400 hover:bg-wood-700 hover:text-white transition-colors"
          >
            <span className="text-lg">{sidebarOpen ? '◀' : '▶'}</span>
          </button>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-wood-700">
        <div className={`flex items-center gap-3 ${sidebarOpen || onClose ? '' : 'justify-center'}`}>
          <div className="w-9 h-9 bg-crust-500 rounded-full flex items-center justify-center text-base flex-shrink-0">
            👤
          </div>
          {(sidebarOpen || onClose) && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">Admin User</p>
              <button onClick={handleLogout} className="text-tomato-400 text-xs hover:text-tomato-300">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-wood-900 text-wood-100 flex">
      {/* ─── DESKTOP SIDEBAR ─────────────────────── */}
      <motion.aside
        initial={{ width: sidebarOpen ? 256 : 72 }}
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex bg-wood-800 border-r border-wood-700 flex-col sticky top-0 h-screen z-30"
      >
        <SidebarContent />
      </motion.aside>

      {/* ─── MOBILE SIDEBAR OVERLAY ─────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 h-full w-64 bg-wood-800 border-r border-wood-700 flex flex-col z-50 lg:hidden"
            >
              <SidebarContent onClose={() => setMobileSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header className="bg-wood-800/90 backdrop-blur-xl border-b border-wood-700 px-4 py-3 sticky top-0 z-20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-wood-700 text-wood-300 hover:text-white flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-wood-400 min-w-0">
                <span className="text-xs hidden sm:inline">Admin</span>
                <span className="text-wood-600 hidden sm:inline">/</span>
                <span className="text-white font-medium capitalize text-sm truncate">{activeItem}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Back to Website */}
              <motion.button
                onClick={() => navigate('/')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-tomato-600 text-white text-xs font-medium rounded-lg hover:bg-tomato-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Site
              </motion.button>
              {/* Mobile back button (icon only) */}
              <motion.button
                onClick={() => navigate('/')}
                className="sm:hidden p-2 bg-tomato-600 text-white rounded-lg"
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </motion.button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-wood-400 hover:bg-wood-700 hover:text-white transition-colors">
                <span className="text-lg">🔔</span>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-tomato-600 text-white text-[10px] rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Restaurant label - hidden on small screens */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-wood-700 rounded-lg">
                <span className="text-base">🏪</span>
                <span className="text-white font-medium text-xs">Pizza Blast</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ─── MOBILE BOTTOM NAV ─────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-wood-800 border-t border-wood-700 z-30 safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {sidebarItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveItem(item.id); navigate(item.path) }}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl min-w-0 flex-1 transition-all ${activeItem === item.id
                  ? 'text-tomato-400'
                  : 'text-wood-400 hover:text-wood-200'
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[9px] font-bold uppercase tracking-wide truncate w-full text-center">{item.label}</span>
            </button>
          ))}
          {/* More button */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl flex-1 text-wood-400 hover:text-wood-200 transition-all"
          >
            <span className="text-xl">≡</span>
            <span className="text-[9px] font-bold uppercase tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {/* Bottom nav spacer for mobile */}
      <div className="lg:hidden h-16" style={{ position: 'fixed', bottom: 0, pointerEvents: 'none' }} />
    </div>
  )
}
