import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useChatbot } from '../context/ChatbotContext'
import toast from 'react-hot-toast'
import { useSettings } from '../context/SettingsContext'
import BannerDisplay from './BannerDisplay'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './common/LanguageSelector'

export default function Navbar() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { openWithIntent, cartCount } = useChatbot()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { label: t('nav.home'), href: '/#home' },
    { label: t('nav.menu'), href: '/menu' },
    { label: t('nav.catering'), href: '/catering' },
    { label: t('nav.dining'), href: '/dining' },
    { label: t('nav.trackOrder'), href: '/track' },
    { label: t('nav.contact'), href: '/#contact' },
  ]

  const isLightPage = ['/menu', '/catering', '/dining', '/track', '/profile', '/login', '/register'].includes(location.pathname)
  const isSolid = scrolled || isLightPage || mobileOpen
  const restaurantName = settings?.restaurantName || 'Mustang Pizza'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [points, setPoints] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('customerToken')
    if (token) {
      setIsLoggedIn(true)
      fetchPoints(token)
    } else {
      setIsLoggedIn(false)
    }
  }, [location.pathname]) // Refresh on navigation

  const fetchPoints = async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPoints(data.user?.loyalty?.points || 0)
      }
    } catch (err) {
      console.error('Failed to fetch points:', err)
    }
  }

  const handleNavClick = (e, link) => {
    if (link.intent) {
      openWithIntent(link.intent)
      setMobileOpen(false)
    } else if (link.href) {
      if (link.href.startsWith('/#')) {
        e.preventDefault()
        const id = link.href.substring(2)

        if (location.pathname === '/') {
          // Already on home, just scroll
          const element = document.getElementById(id)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        } else {
          // Navigate home with hash
          navigate(link.href)
        }
      } else {
        navigate(link.href)
      }
      setMobileOpen(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    setIsLoggedIn(false)
    toast.success('Logged out successfully.')
    navigate('/')
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 flex flex-col ${isSolid
        ? 'glass-panel-strong border-b border-white/60 shadow-[0_18px_50px_rgba(26,20,16,0.08)]'
        : 'bg-transparent'
        }`}
    >
      <BannerDisplay position="top" />
      <nav className={`max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between transition-all duration-500 rounded-[2rem] ${isSolid ? 'mt-2 mb-2 glass-card glass-highlight-ring' : ''} ${scrolled ? 'py-3' : 'py-5'}`}>
        {/* Logo */}
        <motion.a
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {settings?.logo ? (
            <img src={settings.logo} alt="Logo" className="h-10 object-contain" />
          ) : (
            <div className="flex flex-col">
              <span className={`font-serif-1947 text-[28px] tracking-tight leading-none transition-colors duration-500 ${isSolid ? 'text-[#1A1410]' : 'text-white'}`}>
                {restaurantName.split(' ')[0]}
              </span>
              <span className={`text-[8px] uppercase tracking-[0.3em] font-black -mt-0.5 transition-colors duration-500 ${isSolid ? 'text-ember-600' : 'text-white/60'}`}>
                {restaurantName.split(' ').slice(1).join(' ') || 'Pizza'}
              </span>
            </div>
          )}
        </motion.a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={(e) => handleNavClick(e, link)}
              className={`nav-link text-[11px] font-body font-medium tracking-[0.15em] uppercase transition-colors duration-300 ${
                isSolid
                  ? 'text-[#5C554E] hover:text-[#1A1410]'
                  : 'text-white/75 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Language Selector */}
          <LanguageSelector scrolled={scrolled} />
          {/* Cart Icon */}
          <motion.button
            className={`relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center transition-colors rounded-full ${isSolid ? 'glass-pill text-[#5C554E] hover:text-[#1A1410]' : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white/75 hover:text-white'}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => openWithIntent('cart')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ember-500 text-white text-[9px] font-mono font-bold flex items-center justify-center"
              >
                {cartCount}
              </motion.span>
            )}
          </motion.button>


          {/* Profile / Auth */}
          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile')}
                className={`text-[11px] font-body font-medium tracking-[0.15em] uppercase transition-colors nav-link ${isSolid ? 'text-[#5C554E] hover:text-[#1A1410]' : 'text-white/75 hover:text-white'}`}
              >
                Profile
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className={`text-[11px] font-body font-medium tracking-[0.15em] uppercase transition-colors nav-link ${isSolid ? 'text-[#5C554E] hover:text-[#1A1410]' : 'text-white/75 hover:text-white'}`}
              >
                Logout
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className={`hidden lg:block text-[11px] font-body font-medium tracking-[0.15em] uppercase transition-colors nav-link ${isSolid ? 'text-[#5C554E] hover:text-[#1A1410]' : 'text-white/75 hover:text-white'}`}
            >
              Login
            </motion.button>
          )}


          {/* Mobile menu button */}
          <motion.button
            className={`lg:hidden w-10 h-10 flex items-center justify-center transition-colors rounded-full ${isSolid ? 'glass-pill text-[#1A1410]' : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white'}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="15" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </motion.button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden glass-panel-strong border-t border-white/60 mx-3 mb-3 rounded-[2rem]"
          >
            <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={(e) => handleNavClick(e, link)}
                  className="text-left text-lg font-display italic text-[#1A1410]/70 hover:text-[#1A1410] py-3 px-4 transition-all border-b border-[rgba(26,20,16,0.04)] last:border-none rounded-2xl hover:bg-white/50"
                >
                  {link.label}
                </motion.button>
              ))}
              <div className="border-t border-[rgba(212,146,42,0.15)] pt-6 mt-4 space-y-3">
                {isLoggedIn ? (
                  <>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="w-full py-4 glass-button-dark text-white font-body font-semibold text-[10px] tracking-[0.2em] uppercase rounded-xl"
                      onClick={() => { setMobileOpen(false); navigate('/profile'); }}
                    >
                      Profile
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="w-full py-4 glass-button-light text-[#1A1410] font-body font-semibold text-sm tracking-[0.1em] uppercase rounded-xl"
                      onClick={() => { setMobileOpen(false); handleLogout(); }}
                    >
                      Logout
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="w-full py-4 glass-button-dark text-white font-body font-semibold text-[10px] tracking-[0.2em] uppercase rounded-xl"
                      onClick={() => { setMobileOpen(false); navigate('/login'); }}
                    >
                      Login
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="w-full py-4 glass-button-light text-[#1A1410] font-body font-semibold text-sm tracking-[0.1em] uppercase rounded-xl"
                      onClick={() => { setMobileOpen(false); navigate('/register'); }}
                    >
                      Register
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
