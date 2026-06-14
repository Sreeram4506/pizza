import { useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { scrollToSection } from '../utils/sectionNavigation'
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
      className="relative min-h-screen flex items-center overflow-hidden bg-[linear-gradient(135deg,#F7F2EA_0%,#FFFDF8_45%,#EFE4D7_100%)] section-grain"
    >
      <div className="absolute inset-0 ember-glow-bg" />
      <div className="absolute inset-0 gold-glow-bg" />

      <div className="absolute right-[45%] top-0 bottom-0 w-px bg-[rgba(29,24,19,0.06)] hidden lg:block" />

      <div className="absolute top-32 right-24 hidden lg:grid grid-cols-5 gap-3 opacity-[0.08]">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-[#1D1813]" />
        ))}
      </div>

      <BannerDisplay position="hero" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-32 pb-20 lg:py-0 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center lg:items-center min-h-screen">
          <div className="w-full lg:w-[45%] lg:pr-16 flex flex-col justify-center">
            <div className="hero-stagger">
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#6F7F52]">
                Est. 2024 &nbsp;·&nbsp; Artisan Kitchen
              </span>
            </div>

            <div className="mt-8 hero-stagger">
              <h1 className="font-display font-bold leading-[0.9] tracking-tight">
                <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[96px] text-[#1D1813]">
                  {settings.restaurantName || 'Pizza Blast'}
                </span>
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl italic text-[#1D1813]/20 mt-4">
                  The Art of
                </span>
                <span
                  className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl mt-2"
                  style={{ WebkitTextStroke: '2px #1D1813', color: 'transparent' }}
                >
                  Neapolitan
                </span>
              </h1>
            </div>

            <div className="hero-stagger w-16 h-px bg-[#A24A28] mt-10" />

            <p className="hero-stagger mt-8 text-[#5E574F] text-base md:text-lg italic font-body max-w-md">
              "Where fire meets flour, and tradition meets tomorrow."
            </p>

            <div className="hero-stagger flex flex-wrap items-center gap-4 mt-12 relative z-20">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/menu')}
                className="group px-8 py-3.5 bg-ember-600 text-white text-sm font-body font-semibold tracking-[0.1em] uppercase rounded-full flex items-center gap-2 transition-shadow shadow-lg shadow-ember-600/25 hover:shadow-xl hover:shadow-ember-600/40"
              >
                Explore Menu
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection('#atelier')}
                className="group px-8 py-3.5 border-2 border-[#1D1813] text-[#1D1813] text-sm font-body font-semibold tracking-[0.1em] uppercase rounded-full flex items-center gap-2 transition-colors hover:bg-[#1D1813] hover:text-white"
              >
                Build Your Own
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </motion.button>
            </div>
          </div>

          <div className="w-full lg:w-[55%] mt-16 lg:mt-0 relative hidden lg:flex items-center justify-center">
            <motion.div
              className="relative w-full max-w-lg lg:max-w-xl xl:max-w-2xl"
              initial={{ opacity: 0, x: 60, rotate: 0 }}
              animate={{ opacity: 1, x: 0, rotate: 2 }}
              transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-ember-500/10 via-transparent to-gold-400/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] shadow-[0_30px_60px_rgba(35,27,22,0.18)] border border-white/70 bg-[#211A15] aspect-[4/5]">
                <img
                  src="/pizza-hero-poster.svg"
                  alt="Artisan pizza poster"
                  className="w-full h-full object-cover img-noir"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 backdrop-blur-md border border-white/12">
                    <span className="w-2 h-2 rounded-full bg-[#D7DFBF] animate-pulse" />
                    <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/90">
                      Wood-fired. 48h dough. Seasonal produce.
                    </span>
                  </div>
                </div>
              </div>

              <motion.div
                className="absolute -left-6 top-1/4 bg-[#FFFDF8]/95 backdrop-blur-sm border border-[rgba(35,27,22,0.10)] px-4 py-3 rounded-lg shadow-md"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6F7F52]">48h Fermented</span>
              </motion.div>

              <motion.div
                className="absolute -right-4 top-1/3 bg-[#FFFDF8]/95 backdrop-blur-sm border border-[rgba(35,27,22,0.10)] px-4 py-3 rounded-lg shadow-md"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
              >
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#231B16]">4.9 Rating</span>
              </motion.div>

              <motion.div
                className="absolute left-8 -bottom-4 bg-[#FFFDF8]/95 backdrop-blur-sm border border-[rgba(35,27,22,0.10)] px-4 py-3 rounded-lg shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
              >
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#C46A3B]">900C Wood-Fired</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
