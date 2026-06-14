import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useChatbot } from '../context/ChatbotContext'
import toast from 'react-hot-toast'
import { useSettings } from '../context/SettingsContext'
import BannerDisplay from './BannerDisplay'
import { scrollToSectionWithRetry } from '../utils/sectionNavigation'

const navLinks = [
  { label: 'Home', href: '/#home' },
  { label: 'Menu', href: '/menu' },
  { label: 'Atelier', href: '/#atelier' },
  { label: 'Track', href: '/track' },
  { label: 'Offers', href: '/#deals' },
  { label: 'Contact', href: '/#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { openWithIntent, cartCount, setIsOpen } = useChatbot()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const goTo = (to) => {
    // Prevent chatbot drawer from persisting across route changes
    if (typeof setIsOpen === 'function') setIsOpen(false)

    navigate(to, { replace: false })
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const handleNavClick = (event, link) => {
    setMobileOpen(false)

    if (link?.intent) {
      event.preventDefault()
      openWithIntent(link.intent)
      return
    }

    if (typeof setIsOpen === 'function') setIsOpen(false)

    const href = link?.href
    if (!href) return

    // For full route navigations, prevent the <Link> default and use navigate()
    // so we don't get a double-navigation race between Link and goTo().
    if (href === '/menu' || href === '/track' || href === '/login' || href === '/register' || href === '/profile') {
      event.preventDefault()
      goTo(href)
      return
    }

    // Extra scroll work for hash links — let the Link handle the URL update,
    // but add explicit scroll behavior on top.
    if (href.startsWith('/#')) {
      setTimeout(() => {
        scrollToSectionWithRetry(href, { behavior: 'smooth', offset: 24 })
      }, 0)
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('customerToken')
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    setIsLoggedIn(false)
    toast.success('Logged out successfully.')
    setMobileOpen(false)
    goTo('/')
  }

  // Helper to determine if a link is active
  const isActive = (href) => {
    if (href.startsWith('/#')) {
      const hash = href.slice(1)
      return location.hash === hash || (location.pathname === '/' && location.hash === '' && href === '/#home')
    }
    return location.pathname === href
  }

  return (
    <>
      <div className="w-full">
        <BannerDisplay position="top" />
      </div>
      
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-4 left-0 right-0 mx-4 lg:mx-auto lg:max-w-6xl z-[70] transition-all duration-500 rounded-full ${
          scrolled || mobileOpen
            ? 'bg-white/90 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] py-3'
            : 'bg-white/60 backdrop-blur-xl border border-white/30 shadow-sm py-4'
        }`}
      >
          <nav className="px-5 lg:px-8 flex items-center justify-between w-full relative">
            {/* Logo */}
            <motion.a
              onClick={() => { setMobileOpen(false); goTo('/'); }}
              className="flex items-center gap-3 group cursor-pointer z-10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {settings?.logo ? (
                <img src={settings.logo} alt="Logo" className="h-9 object-contain drop-shadow-sm" />
              ) : (
                <span className="font-sans font-black text-xl tracking-tight text-ember-600 uppercase drop-shadow-sm">
                  {settings?.restaurantName || 'Pizza Blast'}
                </span>
              )}
            </motion.a>

            {/* Desktop Nav - Absolute center */}
            <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={(event) => handleNavClick(event, link)}
                    className="relative px-5 py-2.5 group rounded-full"
                  >
                    {active && (
                      <motion.div
                        layoutId="activePill"
                        className="absolute inset-0 bg-ember-500/10 rounded-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="absolute inset-0 bg-[#1A1410]/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className={`relative text-[11px] font-body font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${active ? 'text-ember-600' : 'text-[#5C554E] group-hover:text-[#1A1410]'}`}>
                      {link.label}
                    </span>
                  </Link>
                )
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 lg:gap-3 z-10">
              {/* Cart Icon */}
              <motion.button
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white text-[#1A1410] border border-black/5 transition-all shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.05 }}
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
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ember-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-md"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Profile / Auth */}
              <div className="hidden md:flex items-center">
                {isLoggedIn ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goTo('/profile')}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1410] text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goTo('/login')}
                    className="px-5 py-2.5 rounded-full bg-[#1A1410] text-white text-[11px] font-bold tracking-[0.15em] uppercase shadow-md hover:shadow-lg hover:bg-ember-600 transition-all"
                  >
                    Login
                  </motion.button>
                )}
              </div>

              {/* Mobile menu button */}
              <motion.button
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white text-[#1A1410] border border-black/5 transition-all shadow-sm"
                onClick={() => setMobileOpen(!mobileOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <>
                      <line x1="4" y1="8" x2="20" y2="8" />
                      <line x1="4" y1="16" x2="20" y2="16" />
                    </>
                  )}
                </svg>
              </motion.button>
            </div>
          </nav>
      </motion.header>

      {/* Full Screen Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, y: 0, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, y: -10, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[65] bg-white/95 flex flex-col justify-center px-8"
          >
            <div className="flex flex-col gap-6 max-w-sm mx-auto w-full text-center">
              {navLinks.map((link, i) => {
                const active = isActive(link.href)
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.4 }}
                  >
                    <Link
                      to={link.href}
                      onClick={(event) => handleNavClick(event, link)}
                      className={`block text-4xl font-display italic font-black transition-colors ${active ? 'text-ember-500' : 'text-[#1A1410] hover:text-ember-500'}`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                )
              })}

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mt-8 flex flex-col gap-4"
              >
                {isLoggedIn ? (
                  <>
                    <button
                      className="w-full py-4 bg-[#1A1410] text-white font-body font-bold text-sm tracking-[0.15em] uppercase rounded-full shadow-lg hover:shadow-xl transition-all"
                      onClick={() => { setMobileOpen(false); goTo('/profile'); }}
                    >
                      My Profile
                    </button>
                    <button
                      className="w-full py-4 border-2 border-[#1A1410]/10 text-[#1A1410] font-body font-bold text-sm tracking-[0.15em] uppercase rounded-full hover:bg-black/5 transition-all"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full py-4 bg-ember-600 text-white font-body font-bold text-sm tracking-[0.15em] uppercase rounded-full shadow-lg hover:shadow-xl hover:bg-ember-700 transition-all"
                    onClick={() => { setMobileOpen(false); goTo('/login'); }}
                  >
                    Sign In
                  </button>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
