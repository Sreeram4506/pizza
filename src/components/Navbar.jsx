import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useChatbot } from '../context/ChatbotContext'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Menu', intent: 'menu' },
  { label: 'Order', intent: 'order' },
  { label: 'Custom Pizza', href: '/custom-pizza' },
  { label: 'Track', href: '/track' },
  { label: 'Deals', href: '#deals' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { openWithIntent } = useChatbot()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('customerToken')
    setIsLoggedIn(!!token)
  }, [])

  const handleNavClick = (link) => {
    if (link.intent) {
      openWithIntent(link.intent)
      setMobileOpen(false)
    } else if (link.href) {
      if (link.href.startsWith('/')) {
        window.location.href = link.href
      } else {
        document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })
      }
      setMobileOpen(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg py-3'
          : 'bg-transparent py-5'
        }`}
    >
      <nav className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <motion.a
          href="#home"
          className="flex items-center gap-2 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 bg-tomato-600 rounded-full flex items-center justify-center shadow-crust">
            <span className="text-xl">🍕</span>
          </div>
          <span className={`font-display font-bold text-2xl tracking-tight transition-colors duration-300 ${scrolled ? 'text-wood-800' : 'text-wood-800'
            }`}>
            Pizza<span className="text-tomato-600">Blast</span>
          </span>
        </motion.a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link)}
              className={`text-sm font-semibold tracking-wide transition-colors relative group ${scrolled
                  ? 'text-wood-700 hover:text-tomato-600'
                  : 'text-wood-700 hover:text-tomato-600'
                }`}
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-tomato-600 transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <motion.button
            className="relative w-11 h-11 rounded-full bg-white border-2 border-crust-200 flex items-center justify-center text-wood-700 hover:border-tomato-400 hover:text-tomato-600 transition-all shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openWithIntent('cart')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-tomato-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              0
            </span>
          </motion.button>

          {/* Login/User Button */}
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <motion.button
                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-tomato-600 text-white text-sm font-semibold rounded-full hover:bg-tomato-700 transition-all shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </motion.button>
              <motion.button
                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-wood-700 text-white text-sm font-semibold rounded-full hover:bg-wood-800 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
              >
                Logout
              </motion.button>
            </div>
          ) : (
            <motion.button
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-tomato-600 text-white text-sm font-semibold rounded-full hover:bg-tomato-700 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Login
            </motion.button>
          )}

          {/* Admin Access Link */}
          <motion.button
            className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-wood-800 text-white text-sm font-medium rounded-full hover:bg-wood-700 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/admin/login')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin
          </motion.button>

          {/* Mobile menu button */}
          <motion.button
            className="lg:hidden w-11 h-11 rounded-full bg-white border-2 border-crust-200 flex items-center justify-center text-wood-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden bg-white border-t border-crust-100"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-3">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => handleNavClick(link)}
                  className="text-left text-lg text-wood-700 hover:text-tomato-600 font-semibold py-2 px-4 rounded-xl hover:bg-tomato-50 transition-all"
                >
                  {link.label}
                </motion.button>
              ))}
              <div className="border-t border-crust-100 pt-4 mt-2 space-y-3">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full py-3 bg-tomato-600 text-white font-semibold rounded-xl"
                  onClick={() => { setMobileOpen(false); navigate('/login'); }}
                >
                  Login
                </motion.button>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="w-full py-3 border-2 border-tomato-600 text-tomato-600 font-semibold rounded-xl"
                  onClick={() => { setMobileOpen(false); navigate('/register'); }}
                >
                  Register
                </motion.button>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-full py-3 bg-wood-800 text-white font-semibold rounded-xl"
                  onClick={() => { setMobileOpen(false); navigate('/admin/login'); }}
                >
                  Admin Access
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
