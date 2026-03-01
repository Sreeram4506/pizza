import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'

export default function Hero() {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const navigate = useNavigate()
  const { openWithIntent } = useChatbot()
  const { settings, updateTrigger } = useSettings()

  console.log('Hero: Rendering with restaurant name:', settings.restaurantName, 'updateTrigger:', updateTrigger)

  useGSAP(() => {
    if (!containerRef.current) return
    const ctx = gsap.context(() => {
      gsap.from(textRef.current?.children || [], {
        y: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.3
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="home" ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden bg-mozzarella-100">
      {/* Pizza Pattern Background */}
      <div className="absolute inset-0 pizza-bg opacity-50" />
      
      {/* Wood-fired texture overlay */}
      <div className="absolute inset-0 wood-texture opacity-30" />

      {/* Decorative floating elements */}
      <motion.div
        className="absolute top-20 left-10 w-20 h-20 opacity-20 hidden lg:block"
        animate={{ rotate: 360, y: [0, -20, 0] }}
        transition={{ rotate: { duration: 30, repeat: Infinity, ease: 'linear' }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-tomato-600">
          <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.3" />
          <circle cx="35" cy="35" r="8" fill="#f5d89a" />
          <circle cx="65" cy="40" r="6" fill="#f5d89a" />
          <circle cx="50" cy="60" r="7" fill="#f5d89a" />
          <circle cx="40" cy="70" r="5" fill="#f5d89a" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-20 w-16 h-16 opacity-15 hidden lg:block"
        animate={{ rotate: -360, y: [0, 15, 0] }}
        transition={{ rotate: { duration: 25, repeat: Infinity, ease: 'linear' }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-basil-600">
          <path d="M50 10 C70 30, 80 50, 50 90 C20 50, 30 30, 50 10" fill="currentColor" opacity="0.4" />
        </svg>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-mozzarella-200 rounded-full shadow-lg mb-8 border border-basil-200"
          >
            <span className="w-2 h-2 rounded-full bg-basil-500 animate-pulse" />
            <span className="text-wood-700 text-sm font-semibold tracking-wide">Now Serving Fresh from the Oven</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            ref={textRef}
            className="font-display font-black text-5xl md:text-7xl lg:text-8xl text-wood-800 mb-6 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="text-tomato-600">{settings.restaurantName}</span>
            <br />
            <span className="text-wood-800">Authentic Italian</span>
            {' '}
            <span className="text-crust-600">Pizza</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl text-wood-600 mb-4 font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Hand-tossed • Wood-fired • Made with Love
          </motion.p>

          {/* Description */}
          <motion.p
            className="text-wood-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Experience the perfect blend of San Marzano tomatoes, fresh mozzarella, 
            and aromatic basil on our signature 48-hour fermented crust.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.button
              onClick={() => openWithIntent('order')}
              className="group px-10 py-5 bg-tomato-600 text-white font-bold rounded-full shadow-lg hover:bg-tomato-700 transition-all flex items-center gap-3"
              whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(220, 38, 38, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Order Now
            </motion.button>

            <motion.button
              onClick={() => openWithIntent('menu')}
              className="group px-10 py-5 bg-mozzarella-200 text-tomato-600 font-bold rounded-full border-2 border-tomato-200 hover:border-tomato-400 hover:bg-mozzarella-300 transition-all flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              View Menu
            </motion.button>

            <motion.button
              onClick={() => navigate('/custom-pizza')}
              className="group px-10 py-5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-full shadow-lg hover:from-orange-600 hover:to-yellow-600 transition-all flex items-center gap-3"
              whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(251, 146, 60, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Build Your Pizza
            </motion.button>
          </motion.div>

          {/* Floating Pizza Image Preview */}
          <motion.div
            className="mt-16 relative max-w-lg mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            {/* Decorative elements around image */}
            <motion.div
              className="absolute -top-4 -right-4 w-16 h-16 bg-basil-500 rounded-full flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <span className="text-white text-2xl">🌿</span>
            </motion.div>
            
            <motion.div
              className="absolute -bottom-4 -left-4 w-14 h-14 bg-crust-500 rounded-full flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-white text-xl">🍕</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  )
}
