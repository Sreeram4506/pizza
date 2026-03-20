import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useSettings } from '../context/SettingsContext'
import { useTranslation } from 'react-i18next'

export default function Contact() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
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
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="mb-10 max-w-3xl"
        >
          <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-ember-500 block mb-4">
            {t('contact.titleLabel')}
          </span>
          <h2 className="section-title">
            {t('contact.title')}
          </h2>
        </motion.div>

        <div className="section-rule mb-12" />

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
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-gold-400 block mb-5">
                {item.title}
              </span>
              <p className="text-[#1A1410] font-sub text-lg md:text-xl mb-2 leading-snug">{item.info}</p>
              {item.subtext && (
                <p className="text-[#9B8D74] text-sm md:text-[15px] font-body">{item.subtext}</p>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-6 mt-12"
        >
          {phoneHref && (
            <a
              href={phoneHref}
              className="px-10 py-5 glass-button-dark text-white font-body text-[11px] font-black tracking-[0.16em] uppercase transition-all rounded-xl"
            >
              {t('contact.call')}
            </a>
          )}
          {emailHref && (
            <a
              href={emailHref}
              className="px-8 py-4 glass-button-light text-[#1A1410] font-body text-sm font-medium tracking-[0.1em] uppercase transition-all rounded-xl"
            >
              {t('contact.email')}
            </a>
          )}
          {directionsHref && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 glass-button-light text-[#1A1410] font-body text-sm font-medium tracking-[0.1em] uppercase transition-all rounded-xl"
            >
              {t('contact.directions')}
            </a>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-20"
        >
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#9B8D74] block mb-6">
            {t('contact.availableOn')}
          </span>
          <div className="flex flex-wrap gap-3">
            {['Uber Eats', 'DoorDash', 'Grubhub', 'Postmates'].map((partner) => (
              <span
                key={partner}
                className="font-mono text-sm tracking-[0.05em] uppercase text-[#1A1410]/70 glass-pill px-4 py-2"
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
