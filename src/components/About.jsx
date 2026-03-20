import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useSettings } from '../context/SettingsContext'
import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { settings } = useSettings()
  const [statsData, setStatsData] = useState({ orders: 0, customers: 0, experienceYears: 12 })

  useEffect(() => {
    fetch('/api/admin/public/stats')
      .then(res => res.json())
      .then(data => setStatsData(data))
      .catch(() => {})
  }, [])

  const stats = [
    { num: `${(statsData.orders / 1000).toFixed(1)}k+`, label: t('about.stats.pizzas') },
    { num: '48h', label: t('about.stats.dough') },
    { num: statsData.customers > 0 ? `${statsData.customers}+` : '24+', label: t('about.stats.patrons') },
    { num: '900°C', label: t('about.stats.heat') },
  ]

  return (
    <section ref={ref} className="py-20 lg:py-40 relative overflow-hidden section-grain glass-shell">
      {/* Huge ghost number */}
      <div className="absolute top-1/2 -translate-y-1/2 right-0 font-serif-1947 font-black text-[25vw] leading-none text-[#1A1410]/[0.03] select-none pointer-events-none hidden lg:block">
        Mustang
      </div>

      {/* Ember glow */}
      <div className="absolute inset-0 ember-glow-bg" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          {/* Label */}
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-8">
            {t('about.philosophy')}
          </span>

          {/* Pull quote */}
          <blockquote className="font-serif-1947 italic text-2xl sm:text-4xl md:text-5xl lg:text-7xl text-[#1A1410] leading-[1.1] tracking-tight mb-12">
            <span dangerouslySetInnerHTML={{ __html: t('about.quote') }} />
          </blockquote>

          {/* Thin rule */}
          <div className="w-16 h-px bg-gold-400/40 mb-10" />

          {/* Description */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl glass-panel glass-highlight-ring p-8 md:p-10">
            <p className="text-[#5C554E] text-base leading-relaxed font-body">
              {t('about.description1', { restaurantName: settings?.restaurantName || 'Mustang Pizza' })}
            </p>
            <p className="text-[#5C554E] text-base leading-relaxed font-body">
              {t('about.description2')}
            </p>
          </div>

          {/* Founder signature */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
            className="mt-16"
          >
            <span className="font-serif-1947 italic text-4xl text-[#1A1410]/30">{t('about.signature')}</span>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i + 0.5 }}
              className="glass-card glass-highlight-ring p-8 lg:p-10 text-center"
            >
              <div className="font-mono text-2xl md:text-3xl text-ember-500 mb-3 tracking-wider">{stat.num}</div>
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#9B8D74]">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
