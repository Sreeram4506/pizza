import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function Testimonials() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [active, setActive] = useState(0)

  // Get localized testimonials from translation files
  const testimonialsData = t('testimonials.data', { returnObjects: true }) || []

  // Auto-rotate
  useEffect(() => {
    if (testimonialsData.length === 0) return
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % testimonialsData.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [testimonialsData.length])

  const stats = [
    { value: '4.9', label: t('testimonials.stats.rating') },
    { value: '2,500+', label: t('testimonials.stats.customers') },
    { value: '98%', label: t('testimonials.stats.recommend') },
  ]

  if (testimonialsData.length === 0) return null

  return (
    <section ref={ref} className="py-24 lg:py-32 relative bg-white overflow-hidden section-grain">
      <div className="absolute inset-0 gold-glow-bg" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-20"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold-400 block mb-4">
            {t('testimonials.titleLabel')}
          </span>
          <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-[#1A1410] tracking-tight italic">
            {t('testimonials.title')}
          </h2>
        </motion.div>

        {/* Testimonial — One at a time, centered, auto-rotate */}
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {/* Stars — thin accent lines, not emoji */}
              <div className="flex justify-center gap-2 mb-10">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.08 * i, type: 'spring' }}
                  >
                    <svg className="w-4 h-4 text-ember-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </motion.div>
                ))}
              </div>

              {/* Quote — Cormorant italic, large */}
              <p className="font-display italic text-2xl md:text-3xl lg:text-4xl text-[#1A1410] leading-relaxed mb-10 px-4">
                "{testimonialsData[active].text}"
              </p>

              {/* Thin divider */}
              <div className="w-12 h-px bg-gold-400/30 mx-auto mb-8" />

              {/* Customer — mono small caps */}
              <div>
                <p className="font-mono text-xs tracking-[0.2em] uppercase text-[#1A1410] mb-1">{testimonialsData[active].name}</p>
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#9B8D74]">{t('testimonials.orderedLabel')}{testimonialsData[active].order}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation dots — minimal */}
          <div className="flex justify-center gap-3 mt-12">
            {testimonialsData.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`transition-all duration-500 ${i === active
                  ? 'w-8 h-1 bg-ember-500 rounded'
                  : 'w-4 h-1 bg-[#1A1410]/10 hover:bg-[#1A1410]/20 rounded'
                  }`}
                style={{ borderRadius: '1px' }}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-20 flex flex-wrap justify-center gap-16"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-mono text-2xl text-ember-500 mb-2 tracking-wider">{stat.value}</div>
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#9B8D74]">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
