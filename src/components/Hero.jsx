import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import BannerDisplay from './BannerDisplay'

export default function Hero() {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)

  useGSAP(() => {
    if (!containerRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.hero-stagger', {
        y: 40,
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.6
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  // Extended timeout for video load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!videoLoaded) setVideoError(true)
    }, 10000)
    return () => clearTimeout(timer)
  }, [videoLoaded])

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* ── Background Video ── */}
      <div className="absolute inset-0 z-0">
        {/* Always-visible pizza background image (shown until/if video loads) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=90')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Video layer: LOCAL file served from /public — no CORS issues */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
        >
          {/* Local pizza video — downloaded from Mixkit (free license) */}
          <source src="/pizza-hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* ── Cinematic Gradient Overlay ── */}
      <div className="absolute inset-0 z-10"
        style={{
          background: `
            linear-gradient(to bottom,
              rgba(15,10,8,0.55) 0%,
              rgba(15,10,8,0.25) 40%,
              rgba(15,10,8,0.35) 70%,
              rgba(15,10,8,0.80) 100%
            )
          `
        }}
      />

      {/* ── Subtle vignette edges ── */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)'
        }}
      />

      {/* ── Banner (top position) ── */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <BannerDisplay position="hero" />
      </div>

      {/* ── Main Centered Content ── */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 min-h-screen w-full">

        {/* Top label */}
        <motion.div className="hero-stagger mb-6">
          <span className="inline-flex items-center gap-3 font-mono text-[10px] tracking-[0.35em] uppercase text-white/60">
            <span className="w-8 h-px bg-white/40" />
            Est. 2024 &nbsp;·&nbsp; Artisan Kitchen
            <span className="w-8 h-px bg-white/40" />
          </span>
        </motion.div>

        {/* Restaurant Name — large cinematic display */}
        <div className="hero-stagger">
          <h1 className="font-display font-bold leading-none tracking-tight text-white"
            style={{ textShadow: '0 4px 40px rgba(0,0,0,0.4)' }}
          >
            <span className="block text-[clamp(3.5rem,12vw,9rem)] leading-none">
              {settings.restaurantName || 'Pizza Blast'}
            </span>
          </h1>
        </div>

        {/* Sub-headline */}
        <div className="hero-stagger mt-4">
          <p className="font-mono text-[11px] tracking-[0.5em] uppercase text-white/70">
            Pizza Napoletana
          </p>
        </div>

        {/* Thin accent line */}
        <div className="hero-stagger w-12 h-px bg-[#C1440E] mt-8 mx-auto" />

        {/* Tagline */}
        <p className="hero-stagger mt-6 font-body italic text-white/60 text-base md:text-lg max-w-md leading-relaxed"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
        >
          "Where fire meets flour, and tradition meets tomorrow."
        </p>

        {/* CTA Buttons */}
        <div className="hero-stagger flex flex-wrap justify-center items-center gap-4 mt-10">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(193,68,14,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/menu')}
            className="px-8 py-3.5 bg-[#C1440E] text-white text-[11px] font-body font-bold tracking-[0.2em] uppercase rounded-full flex items-center gap-2 shadow-lg shadow-red-900/40 transition-all"
          >
            Explore Menu
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => document.querySelector('#atelier')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3.5 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-[11px] font-body font-bold tracking-[0.2em] uppercase rounded-full flex items-center gap-2 transition-all"
          >
            Build Your Own
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.button>
        </div>

        {/* ── Feature Pills ── */}
        <motion.div
          className="hero-stagger flex flex-wrap justify-center gap-3 mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          {['48h Fermented Dough', '900°C Wood-Fired', 'San Marzano Tomatoes', '⭐ 4.9 Rating'].map((feat) => (
            <span
              key={feat}
              className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 font-mono text-[9px] tracking-[0.2em] uppercase text-white/75"
            >
              {feat}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── Bottom corner elements (like reference image) ── */}
      {/* Bottom left: address */}
      <div className="absolute bottom-8 left-8 z-20 hidden md:block">
        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/45 leading-relaxed">
          {settings.address ? settings.address.split(',').slice(0, 2).join('\n') : '123 Pizza Plaza\nNew York, NY'}
        </p>
      </div>

      {/* Bottom right: reservation CTA */}
      <div className="absolute bottom-8 right-8 z-20 hidden md:block">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
          className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/45 hover:text-white/80 transition-colors border-b border-white/20 hover:border-white/50 pb-0.5"
        >
          Reservations
        </motion.button>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent"
          animate={{ scaleY: [0.5, 1, 0.5], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  )
}
