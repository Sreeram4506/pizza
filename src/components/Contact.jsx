import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import toast from 'react-hot-toast'
import { useSettings } from '../context/SettingsContext'
import { useTranslation } from 'react-i18next'

export default function Contact() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const { settings, loading } = useSettings()

  const contactInfo = [
    {
      title: t('contact.hoursLabel'),
      info: t('contact.hours'),
      subtext: t('contact.kitchenCloses'),
    },
    {
      title: t('contact.locationLabel'),
      info: loading ? '...' : settings.address,
      subtext: '',
    },
    {
      title: t('contact.phoneLabel'),
      info: loading ? '...' : settings.phone,
      subtext: t('contact.orderSubtext'),
    },
  ]

  return (
    <section id="contact" ref={ref} className="py-24 lg:py-32 relative overflow-hidden section-grain glass-shell">
      <div className="absolute inset-0 ember-glow-bg" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="mb-16"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-4">
            {t('contact.titleLabel')}
          </span>
          <h2 className="font-serif-1947 font-bold text-4xl md:text-5xl lg:text-7xl text-[#1A1410] tracking-tight italic">
            {t('contact.title')}
          </h2>
        </motion.div>

        <div className="glass-section-divider mb-12" />

        {/* Contact Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {contactInfo.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass-card glass-highlight-ring p-8 lg:p-12"
            >
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 block mb-6">
                {item.title}
              </span>
              <p className="text-[#1A1410] font-sub text-lg mb-2">{item.info}</p>
              {item.subtext && (
                <p className="text-[#9B8D74] text-sm font-body">{item.subtext}</p>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Action Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-6 mt-12"
        >
          <a
            href={`tel:${settings.phone?.replace(/\D/g, '')}`}
            className="px-10 py-5 glass-button-dark text-white font-body text-[10px] font-black tracking-[0.25em] uppercase transition-all rounded-xl"
          >
            {t('contact.call')}
          </a>
          <a
            href={`mailto:${settings.email}`}
            className="px-8 py-4 glass-button-light text-[#1A1410] font-body text-sm font-medium tracking-[0.15em] uppercase transition-all rounded-xl"
          >
            {t('contact.email')}
          </a>
          <button
            className="px-8 py-4 glass-button-light text-[#1A1410] font-body text-sm font-medium tracking-[0.15em] uppercase transition-all rounded-xl"
            onClick={() => toast.success(t('contact.openingMaps'))}
          >
            {t('contact.directions')}
          </button>
        </motion.div>

        {/* Delivery Partners */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-20"
        >
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#9B8D74] block mb-6">
            {t('contact.availableOn')}
          </span>
          <div className="flex flex-wrap gap-3">
            {['Uber Eats', 'DoorDash', 'Grubhub', 'Postmates'].map((partner) => (
              <span
                key={partner}
                className="font-mono text-xs tracking-[0.1em] uppercase text-[#1A1410]/60 hover:text-[#1A1410] transition-colors cursor-pointer glass-pill px-4 py-2"
              >
                {partner}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
