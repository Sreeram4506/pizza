import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useSettings } from '../../context/SettingsContext'

const sidebarItems = [
  { id: 'dashboard', label: 'Overview', icon: '📊', path: '/admin/dashboard' },
  { id: 'orders', label: 'Live Orders', icon: '📋', path: '/admin/orders' },
  { id: 'menu', label: 'Menu Kitchen', icon: '🍕', path: '/admin/menu' },
  { id: 'customers', label: 'User Base', icon: '👥', path: '/admin/customers' },
  { id: 'loyalty', label: 'Rewards', icon: '🏆', path: '/admin/loyalty' },
  { id: 'analytics', label: 'Insights', icon: '📈', path: '/admin/analytics' },
  { id: 'marketing', label: 'Marketing', icon: '📢', path: '/admin/marketing' },
  { id: 'catering', label: 'Catering', icon: '🍱', path: '/admin/catering' },
  { id: 'reservations', label: 'Dining', icon: '🍷', path: '/admin/reservations' },
  { id: 'settings', label: 'General', icon: '⚙️', path: '/admin/settings' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeItem, setActiveItem] = useState('dashboard')
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()
  const location = useLocation()
  const { settings } = useSettings()
  const restaurantName = settings?.restaurantName || 'Mustang Pizza'

  useEffect(() => {
    setMobileSidebarOpen(false)
    const token = localStorage.getItem('adminToken')
    if (!token && location.pathname !== '/admin/login') {
      navigate('/admin/login')
      return
    }
    const currentItem = sidebarItems.find(item => location.pathname.includes(item.path))
    if (currentItem) setActiveItem(currentItem.id)
  }, [location, navigate])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col h-full glass-panel-strong border-r border-white/60">
      {/* Brand Logo */}
      <div className="h-20 flex-shrink-0 px-6 border-b border-[rgba(26,20,16,0.03)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 glass-button-dark rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 font-serif-1947 italic">
            {restaurantName[0] || 'M'}
          </div>
          {(sidebarOpen || onClose) && (
            <div className="min-w-0">
              <h1 className="font-serif-1947 font-bold text-[#1A1410] text-sm leading-none truncate">
                {restaurantName}
              </h1>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-ember-600 mt-1">Admin Ops</p>
            </div>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-full glass-pill text-[#9B8D74] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto scrollbar-hide">
        <label className={`block px-3 mb-4 font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] opacity-50 ${(!sidebarOpen && !onClose) ? 'sr-only' : ''}`}>
          Navigation
        </label>
        {sidebarItems.map((item) => {
          const isActive = activeItem === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id)
                navigate(item.path)
                if (onClose) onClose()
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left group shrink-0 ${isActive
                  ? 'glass-button-dark text-white'
                  : 'text-[#5C554E] glass-button-light hover:text-[#1A1410]'
                }`}
              whileTap={{ scale: 0.97 }}
            >
              <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
              {(sidebarOpen || onClose) && (
                <span className="font-bold text-[13px] tracking-tight truncate">{item.label}</span>
              )}
              {isActive && (sidebarOpen || onClose) && (
                <div className="ml-auto w-1.5 h-1.5 bg-ember-500 rounded-full animate-pulse shadow-glow shadow-ember-500/50" />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Admin Profile & Desktop Toggle */}
      <div className="p-4 border-t border-[rgba(26,20,16,0.03)] bg-[#FAFAF8]/20">
        {!onClose && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full h-10 mb-4 flex items-center justify-center rounded-xl glass-button-light text-[#9B8D74] hover:text-[#1A1410] transition-all"
          >
            <span className="text-xs font-black">{sidebarOpen ? '❮' : '❯'}</span>
          </button>
        )}

        <div className={`p-4 rounded-3xl glass-card glass-highlight-ring flex items-center gap-3 ${sidebarOpen || onClose ? '' : 'justify-center p-2'}`}>
          <div className="w-10 h-10 bg-ember-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm">👤</div>
          {(sidebarOpen || onClose) && (
            <div className="flex-1 min-w-0">
              <p className="text-[#1A1410] font-bold text-xs truncate">Manager</p>
              <button
                onClick={handleLogout}
                className="text-ember-600 text-[10px] font-bold uppercase tracking-widest hover:text-ember-700 transition-colors mt-0.5"
              >
                Exit Dash
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="glass-shell h-screen w-full bg-[#FAFAF8] text-[#1A1410] flex overflow-hidden font-sans">
      {/* ─── LOCKED SIDEBAR (DESKTOP) ────────────── */}
      <motion.aside
        initial={{ width: sidebarOpen ? 280 : 88 }}
        animate={{ width: sidebarOpen ? 280 : 88 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block h-full flex-shrink-0 relative z-40"
      >
        <SidebarContent />
      </motion.aside>

      {/* ─── MOBILE DRAWER OVERLAY ──────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-[100]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1A1410]/40 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full w-72 shadow-2xl"
            >
              <SidebarContent onClose={() => setMobileSidebarOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ─── SCROLLABLE CONTENT AREA ───────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Dynamic Header */}
        <header className="h-16 flex-shrink-0 glass-panel-strong border-b border-white/60 px-4 sm:px-8 flex items-center justify-between z-30">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl glass-button-light text-[#1A1410] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3 font-medium text-sm">
              <span className="text-[#9B8D74] opacity-50 uppercase font-sans text-[10px] tracking-widest hidden sm:block">Admin Zone</span>
              <span className="text-[#9B8D74] hidden sm:block">/</span>
              <span className="font-sans font-bold text-lg tracking-tight text-[#1A1410] capitalize">{activeItem.replace(/-/g, ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 glass-button-light text-[#1A1410] text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Frontend
            </motion.button>

            <button className="relative w-10 h-10 rounded-xl glass-button-light flex items-center justify-center hover:text-ember-600 transition-all text-xl">
              🔔
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-ember-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {notifications.length}
                </span>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2 pr-2 pl-4 h-10 glass-pill">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="font-serif-1947 text-[10px] font-bold uppercase tracking-widest text-[#1A1410]">{restaurantName}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Stage */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 scroll-smooth scrollbar-hide">
          <Outlet />
        </main>
      </div>

      {/* ─── MOBILE BOTTOM BAR (UTILITY) ────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 glass-panel-strong border-t border-white/60 z-[50] safe-area-bottom">
        <div className="flex items-center justify-around h-full px-2">
          {sidebarItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveItem(item.id); navigate(item.path) }}
              className={`flex flex-col items-center gap-1 min-w-0 flex-1 transition-all ${activeItem === item.id
                ? 'text-ember-600'
                : 'text-[#9B8D74] hover:text-[#1A1410]'
                }`}
            >
              <span className={`text-xl transition-transform ${activeItem === item.id ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-[9px] font-bold uppercase tracking-tighter truncate w-full text-center">{item.label.split(' ')[0]}</span>
            </button>
          ))}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex flex-col items-center gap-1 flex-1 text-[#9B8D74]"
          >
            <span className="text-xl">≡</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Nav Spacer */}
      <div className="lg:hidden h-16 flex-shrink-0" />

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  )
}
