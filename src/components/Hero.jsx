import { useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import BannerDisplay from './BannerDisplay'

export default function Hero() {
  const containerRef = useRef(null)
  const { settings } = useSettings()
  const navigate = useNavigate()

  useGSAP(() => {
    if (!containerRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.hero-stagger', {
        y: 60,
        opacity: 0,
        stagger: 0.12,
        duration: 1,
        ease: 'power3.out',
        delay: 0.2
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#FAFAF8] section-grain"
    >
      {/* Subtle warm glow */}
      <div className="absolute inset-0 ember-glow-bg" />
      <div className="absolute inset-0 gold-glow-bg" />

      {/* Decorative vertical line */}
      <div className="absolute right-[45%] top-0 bottom-0 w-px bg-[rgba(26,20,16,0.06)] hidden lg:block" />

      {/* Scattered dots grid */}
      <div className="absolute top-32 right-24 hidden lg:grid grid-cols-5 gap-3 opacity-[0.08]">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-[#1A1410]" />
        ))}
      </div>

      <BannerDisplay position="hero" />

      {/* Main Content — Split Layout */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-32 pb-20 lg:py-0 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center lg:items-center min-h-screen">

          {/* Left Panel */}
          <div className="w-full lg:w-[45%] lg:pr-16 flex flex-col justify-center">
            {/* Small label */}
            <div className="hero-stagger">
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#9B8D74]">
                Est. 2024 &nbsp;·&nbsp; Artisan Kitchen
              </span>
            </div>

            {/* Massive display heading */}
            <div className="mt-8 hero-stagger">
              <h1 className="font-display font-bold leading-[0.9] tracking-tight">
                <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[96px] text-[#1A1410]">
                  {settings.restaurantName || 'PizzaBlast'}
                </span>
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl italic text-[#1A1410]/20 mt-4">
                  The Art of
                </span>
                <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl mt-2" style={{ WebkitTextStroke: '2px #1A1410', color: 'transparent' }}>
                  Neapolitan
                </span>
              </h1>
            </div>

            {/* Accent rule */}
            <div className="hero-stagger w-16 h-px bg-[#C1440E] mt-10" />

            {/* Philosophy quote */}
            <p className="hero-stagger mt-8 text-[#9B8D74] text-base md:text-lg italic font-body max-w-md">
              "Where fire meets flour, and tradition meets tomorrow."
            </p>

            {/* CTA links */}
            <div className="hero-stagger flex flex-wrap items-center gap-4 mt-12 relative z-20">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/menu')}
                className="group px-8 py-3.5 bg-red-600 text-white text-sm font-body font-semibold tracking-[0.1em] uppercase rounded-full flex items-center gap-2 transition-shadow shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/40"
              >
                Explore Menu
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.querySelector('#atelier')?.scrollIntoView({ behavior: 'smooth' })}
                className="group px-8 py-3.5 border-2 border-[#1A1410] text-[#1A1410] text-sm font-body font-semibold tracking-[0.1em] uppercase rounded-full flex items-center gap-2 transition-colors hover:bg-[#1A1410] hover:text-white"
              >
                Build Your Own
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full lg:w-[55%] mt-16 lg:mt-0 relative flex items-center justify-center">
            <motion.div
              className="relative w-full max-w-lg lg:max-w-xl xl:max-w-2xl"
              initial={{ opacity: 0, x: 60, rotate: 0 }}
              animate={{ opacity: 1, x: 0, rotate: 2 }}
              transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-xl" style={{ borderRadius: '12px' }}>
                <img
                  src="https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&q=80"
                  alt="Neapolitan Pizza"
                  className="w-full h-full object-cover img-noir"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl" />
              </div>

              {/* Floating chips */}
              <motion.div
                className="absolute -left-6 top-1/4 bg-white/90 backdrop-blur-sm border border-[rgba(26,20,16,0.08)] px-4 py-3 rounded-lg shadow-md"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#D4922A]">48h Fermented</span>
              </motion.div>

              <motion.div
                className="absolute -right-4 top-1/3 bg-white/90 backdrop-blur-sm border border-[rgba(26,20,16,0.08)] px-4 py-3 rounded-lg shadow-md"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
              >
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1410]">⭐ 4.9 Rating</span>
              </motion.div>

              <motion.div
                className="absolute left-8 -bottom-4 bg-white/90 backdrop-blur-sm border border-[rgba(26,20,16,0.08)] px-4 py-3 rounded-lg shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
              >
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ember-500">900°C Wood-Fired</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
