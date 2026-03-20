import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import BannerDisplay from './BannerDisplay'
import { useTranslation } from 'react-i18next'

export default function Hero() {
  const { t } = useTranslation()
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [videoLoaded, setVideoLoaded] = useState(false)
  const restaurantName = settings?.restaurantName || 'Mustang Pizza'
  const [brandFirst, ...brandRest] = restaurantName.split(' ')
  const brandSecond = brandRest.join(' ') || 'Pizza'

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

  // Extended timeout for video load.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!videoLoaded && videoRef.current) {
        videoRef.current.pause()
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [videoLoaded])

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        {/* Always-visible pizza background image shown until the video loads. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/pizza-hero-poster.svg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Video layer served from /public to avoid external CORS issues. */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/pizza-hero-poster.svg"
          onCanPlay={() => setVideoLoaded(true)}
          onError={() => videoRef.current?.pause()}
        >
          {/* Local pizza video downloaded from Mixkit under its free license. */}
          <source src="/pizza-hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Cinematic Gradient Overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: `
            linear-gradient(to bottom,
              rgba(15,10,8,0.48) 0%,
              rgba(15,10,8,0.22) 38%,
              rgba(15,10,8,0.32) 68%,
              rgba(15,10,8,0.72) 100%
            )
          `
        }}
      />

      {/* Subtle vignette edges */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 54%, rgba(0,0,0,0.36) 100%)'
        }}
      />

      <div className="absolute top-0 left-0 right-0 z-30">
        <BannerDisplay position="hero" />
      </div>

      {/* Main Centered Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-28 pb-20 sm:pt-32 sm:pb-24 min-h-screen w-full max-w-5xl mx-auto">
        {/* Top label */}
        <motion.div className="hero-stagger mb-4 sm:mb-5">
          <span className="inline-flex items-center gap-2.5 sm:gap-3 font-mono text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.24em] uppercase text-white/65">
            <span className="w-6 sm:w-8 h-px bg-white/40" />
            <span dangerouslySetInnerHTML={{ __html: t('hero.est') }} />
            <span className="w-6 sm:w-8 h-px bg-white/40" />
          </span>
        </motion.div>

        {/* Restaurant Name - large cinematic display */}
        <div className="hero-stagger flex flex-col items-center">
          <h1
            className="font-serif-1947 font-black leading-none tracking-tight text-white mb-2"
            style={{ textShadow: '0 4px 28px rgba(0,0,0,0.28)' }}
          >
            <span className="block text-[clamp(2.5rem,15vw,10rem)] leading-none">
              {brandFirst}
            </span>
          </h1>
          <span className="text-[11px] sm:text-sm md:text-lg font-black uppercase tracking-[0.18em] sm:tracking-[0.28em] text-white/78 -mt-1 md:-mt-2">
            {brandSecond}
          </span>
        </div>

        {/* Sub-headline */}
        <div className="hero-stagger mt-3 sm:mt-4">
          <p className="font-mono text-[11px] sm:text-[12px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-white/72">
            {t('hero.type')}
          </p>
        </div>

        {/* Thin accent line */}
        <div className="hero-stagger w-12 h-px bg-[#C1440E] mt-7 sm:mt-8 mx-auto" />

        {/* Tagline */}
        <p
          className="hero-stagger mt-6 font-serif-1947 italic text-white/85 text-lg md:text-[1.65rem] max-w-2xl leading-relaxed"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.35)' }}
        >
          {t('hero.tagline')}
        </p>

        {/* CTA Buttons */}
        <div className="hero-stagger flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3.5 sm:gap-4 mt-9 sm:mt-10 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/menu')}
            className="w-full sm:w-auto justify-center px-9 py-4 glass-button-dark text-white text-[11px] sm:text-xs font-black tracking-[0.16em] sm:tracking-[0.18em] uppercase rounded-full flex items-center gap-2 transition-all"
            aria-label="Explore the menu"
          >
            {t('hero.exploreMenu')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => document.querySelector('#atelier')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto justify-center px-8 py-3.5 glass-button-light text-white text-[11px] font-body font-bold tracking-[0.14em] sm:tracking-[0.16em] uppercase rounded-full flex items-center gap-2 transition-all border-white/25 bg-white/12"
            aria-label="Build your own pizza"
          >
            {t('hero.buildYourOwn')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.button>
        </div>

        {/* Feature Pills */}
        <motion.div
          className="hero-stagger flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-8 sm:mt-10 max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          {[
            t('hero.features.dough'),
            t('hero.features.fired'),
            t('hero.features.rating')
          ].map((feat) => (
            <span
              key={feat}
              className="px-3.5 sm:px-4 py-2 rounded-full glass-pill text-white/82 font-mono text-[10px] sm:text-[11px] tracking-[0.1em] sm:tracking-[0.14em] uppercase bg-white/10 border-white/20"
            >
              {feat}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center gap-2 pointer-events-none"
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
