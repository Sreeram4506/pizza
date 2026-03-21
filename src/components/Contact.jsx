import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useSettings } from '../context/SettingsContext'
import { useTranslation } from 'react-i18next'

export default function Contact() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px -20% 0px' })
  const { settings, loading } = useSettings()
  
  const phoneHref = settings?.phone ? `tel:${settings.phone.replace(/\D/g, '')}` : null
  const emailHref = settings?.email ? `mailto:${settings.email}` : null
  const directionsHref = settings?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
    : null

  const contactInfo = [
    {
      title: t('contact.hoursLabel'),
      info: t('contact.hours'),
      subtext: t('contact.kitchenCloses'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: t('contact.locationLabel'),
      info: loading ? '...' : settings.address,
      subtext: t('contact.directions'),
      href: directionsHref,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      title: t('contact.phoneLabel'),
      info: loading ? '...' : settings.phone,
      subtext: t('contact.orderSubtext'),
      href: phoneHref,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
  }

  return (
    <section id="contact" ref={ref} className="py-24 lg:py-40 relative overflow-hidden section-grain glass-shell">
      <div className="absolute inset-0 ember-glow-bg z-0" />
      
      {/* Abstract large background text */}
      <div className="absolute -bottom-20 -right-20 font-serif-1947 font-black text-[25vw] leading-none text-[#1A1410]/[0.015] select-none pointer-events-none z-0">
        VISIT
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate={isInView ? "visible" : "hidden"}
           className="mb-16 max-w-3xl"
        >
          <motion.span variants={itemVariants} className="section-eyebrow block mb-4 tracking-[0.3em]">
            {t('contact.titleLabel')}
          </motion.span>
          <motion.h2 variants={itemVariants} className="section-title mb-10">
            {t('contact.title')}
          </motion.h2>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1, ease: "circOut" }}
            className="section-rule origin-left" 
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {contactInfo.map((item, i) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="glass-card glass-highlight-ring p-10 lg:p-12 relative group"
            >
              <div className="text-ember-500 mb-8 opacity-60 group-hover:opacity-100 transition-opacity">
                {item.icon}
              </div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B8D74] block mb-4">
                {item.title}
              </span>
              <p className="text-[#1A1410] font-serif-1947 italic text-2xl mb-3 leading-tight">
                {item.info}
              </p>
              {item.href ? (
                 <a 
                   href={item.href} 
                   target={item.href.startsWith('http') ? "_blank" : undefined}
                   className="text-ember-600 font-mono text-[10px] tracking-[0.1em] uppercase hover:underline inline-flex items-center gap-2"
                 >
                   {item.subtext}
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                   </svg>
                 </a>
              ) : (
                <p className="text-[#9B8D74] text-xs font-mono tracking-wider">{item.subtext}</p>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
           animate={isInView ? "visible" : "hidden"}
          className="mt-20 pt-16 border-t border-[#1A1410]/[0.06]"
        >
          <motion.span variants={itemVariants} className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B8D74] block mb-8 text-center">
            {t('contact.availableOn')}
          </motion.span>
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
            {['Uber Eats', 'DoorDash', 'Grubhub', 'Postmates'].map((partner) => (
              <motion.span
                key={partner}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(26,20,16,0.04)' }}
                className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#1A1410] glass-pill px-6 py-3 border-[#1A1410]/10 cursor-default"
              >
                {partner}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
