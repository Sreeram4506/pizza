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
  const [activeItem, setActiveItem] = useState('dashboard')
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken')
    if (!token && location.pathname !== '/admin/login') {
      navigate('/admin/login')
      return
    }

    // Set active item based on current path
    const currentItem = sidebarItems.find(item => location.pathname.includes(item.path))
    if (currentItem) {
      setActiveItem(currentItem.id)
    }
  }, [location, navigate])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-wood-900 text-wood-100 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: sidebarOpen ? 280 : 80 }}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-wood-800 border-r border-wood-700 flex flex-col sticky top-0 h-screen z-30"
      >
        {/* Logo */}
        <div className="p-6 border-b border-wood-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-tomato-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              🍕
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-display font-bold text-white text-lg">PizzaBlast</h1>
                <p className="text-tomato-400 text-xs">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id)
                navigate(item.path)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeItem === item.id
                  ? 'bg-tomato-600 text-white shadow-lg'
                  : 'text-wood-300 hover:bg-wood-700 hover:text-white'
                }`}
              whileHover={{ x: sidebarOpen ? 4 : 0 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* Toggle Sidebar */}
        <div className="p-4 border-t border-wood-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-wood-400 hover:bg-wood-700 hover:text-white transition-colors"
          >
            <span className="text-xl">{sidebarOpen ? '◀' : '▶'}</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-wood-700">
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-crust-500 rounded-full flex items-center justify-center text-lg">
              👤
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">Admin User</p>
                <button
                  onClick={handleLogout}
                  className="text-tomato-400 text-xs hover:text-tomato-300"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-wood-800/80 backdrop-blur-xl border-b border-wood-700 px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-wood-400">
              <span className="text-sm">Admin</span>
              <span className="text-wood-600">/</span>
              <span className="text-white font-medium capitalize">{activeItem}</span>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Back to Website */}
              <motion.button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-tomato-600 text-white text-sm font-medium rounded-lg hover:bg-tomato-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Website
              </motion.button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-wood-400 hover:bg-wood-700 hover:text-white transition-colors">
                <span className="text-xl">🔔</span>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-tomato-600 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Restaurant Switcher */}
              <div className="flex items-center gap-3 px-4 py-2 bg-wood-700 rounded-lg">
                <span className="text-xl">🏪</span>
                <span className="text-white font-medium text-sm">Pizza Blast</span>
                <span className="text-wood-400 text-xs">▼</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
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
    </div>
  )
}
