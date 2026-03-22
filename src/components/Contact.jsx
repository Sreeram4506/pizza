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
    <section id="contact" ref={ref} className="py-24 lg:py-40 relative overflow-hidden bg-[#FAFAF8]">
      {/* Abstract large background text */}
      <div className="absolute -bottom-20 -right-20 font-serif font-black text-[25vw] leading-none text-[#1A1410]/[0.02] select-none pointer-events-none z-0">
        VISIT
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate={isInView ? "visible" : "hidden"}
           className="mb-16 max-w-3xl"
        >
          <motion.span variants={itemVariants} className="block mb-4 text-[#8A7A62] text-[11px] font-black tracking-[0.2em] uppercase">
            {t('contact.titleLabel')}
          </motion.span>
          <motion.h2 variants={itemVariants} className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1A1410] leading-tight tracking-tight mb-10">
            {t('contact.title')}
          </motion.h2>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1, ease: "circOut" }}
            className="w-full h-px bg-[#EBEBE6] origin-left" 
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
              className="bg-white border border-[#EBEBE6] rounded-3xl shadow-sm hover:shadow-md transition-all p-10 lg:p-12 relative group"
            >
              <div className="text-[#1A1410] mb-8 opacity-60 group-hover:opacity-100 transition-opacity">
                {item.icon}
              </div>
              <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#8A7A62] block mb-4 font-bold">
                {item.title}
              </span>
              <p className="text-[#1A1410] font-sans font-bold text-2xl mb-3 leading-tight tracking-tight">
                {item.info}
              </p>
              {item.href ? (
                 <a 
                   href={item.href} 
                   target={item.href.startsWith('http') ? "_blank" : undefined}
                   className="text-[#1A1410] font-sans font-bold text-[10px] tracking-[0.1em] uppercase hover:underline inline-flex items-center gap-2 mt-2"
                 >
                  {item.subtext}
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                   </svg>
                 </a>
              ) : (
                <p className="text-[#8A7A62] text-xs font-sans font-medium mt-2">{item.subtext}</p>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
           animate={isInView ? "visible" : "hidden"}
          className="mt-20 pt-16 border-t border-[#EBEBE6]"
        >
          <motion.span variants={itemVariants} className="font-sans font-bold text-[10px] tracking-[0.2em] uppercase text-[#8A7A62] block mb-8 text-center">
            {t('contact.availableOn')}
          </motion.span>
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
            {['Uber Eats', 'DoorDash', 'Grubhub', 'Postmates'].map((partner) => (
              <motion.span
                key={partner}
                whileHover={{ scale: 1.05 }}
                className="font-sans font-bold text-[11px] tracking-[0.12em] uppercase text-[#1A1410] bg-white border border-[#EBEBE6] shadow-sm rounded-full px-6 py-3 cursor-default transition-all hover:border-[#1A1410]"
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
