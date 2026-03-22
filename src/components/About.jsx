import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useSettings } from '../context/SettingsContext'
import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px -20% 0px' })
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <section ref={ref} id="about" className="py-24 lg:py-40 relative overflow-hidden bg-[#FAFAF8]">
      {/* Huge ghost background text */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-20 font-serif font-black text-[22vw] leading-none text-[#1A1410]/[0.02] select-none pointer-events-none hidden xl:block z-0">
        HERITAGE
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid lg:grid-cols-[1.2fr,0.8fr] gap-16 lg:gap-24 items-center"
        >
          {/* Main content block */}
          <div className="space-y-12">
            <motion.div variants={itemVariants}>
              <span className="block mb-4 text-[#8A7A62] text-[11px] font-black tracking-[0.2em] uppercase">
                {t('about.philosophy')}
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#1A1410] leading-tight tracking-tight mb-8">
                <span dangerouslySetInnerHTML={{ __html: t('about.quote') }} />
              </h2>
              <div className="w-16 h-1 bg-[#1A1410] rounded-full" />
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="grid sm:grid-cols-2 gap-8 lg:gap-12"
            >
              <p className="text-[16px] leading-relaxed text-[#5C554E] font-medium first-letter:text-5xl first-letter:font-serif first-letter:mr-3 first-letter:float-left first-letter:text-[#1A1410]">
                {t('about.description1', { restaurantName: settings?.restaurantName || 'Mustang Pizza' })}
              </p>
              <p className="text-[16px] leading-relaxed text-[#5C554E] font-medium pt-4 sm:pt-10">
                {t('about.description2')}
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-4">
              <span className="font-serif italic text-3xl text-[#1A1410]/30 select-none">
                {t('about.signature')}
              </span>
            </motion.div>
          </div>

          {/* Stats layout block */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-white border border-[#EBEBE6] rounded-[24px] shadow-sm hover:shadow-md transition-all p-8 flex flex-col items-center justify-center text-center aspect-square sm:aspect-auto sm:h-44"
              >
                <div className="font-sans text-3xl md:text-4xl text-[#1A1410] mb-2 font-black tracking-tight">
                  {stat.num}
                </div>
                <div className="font-sans text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase text-[#8A7A62] leading-tight">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
