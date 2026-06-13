import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import toast from 'react-hot-toast'
import { useSettings } from '../context/SettingsContext'

export default function Contact() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const { settings, loading } = useSettings()

  const contactInfo = [
    {
      title: 'Hours',
      info: 'Mon–Sun: 10 AM – 11 PM',
      subtext: 'Kitchen closes at 10:30 PM',
    },
    {
      title: 'Location',
      info: loading ? '...' : settings.address,
      subtext: '',
    },
    {
      title: 'Phone',
      info: loading ? '...' : settings.phone,
      subtext: 'Order online for faster service',
    },
  ]

  return (
    <section id="contact" ref={ref} className="py-24 lg:py-32 relative bg-[#F5F3EF] overflow-hidden section-grain">
      <div className="absolute inset-0 ember-glow-bg" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="mb-16"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-4">
            Get in Touch
          </span>
          <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-[#1A1410] tracking-tight italic">
            Contact Us
          </h2>
        </motion.div>

        <div className="divider-gold mb-12" />

        {/* Contact Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-px bg-[rgba(26,20,16,0.06)]"
        >
          {contactInfo.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-[#F5F3EF] p-8 lg:p-12"
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
            className="px-8 py-4 bg-ember-500 text-white font-body text-sm font-medium tracking-[0.15em] uppercase transition-all hover:shadow-ember rounded-xl"
          >
            Call Now
          </a>
          <a
            href={`mailto:${settings.email}`}
            className="px-8 py-4 border border-[rgba(26,20,16,0.1)] text-[#1A1410] font-body text-sm font-medium tracking-[0.15em] uppercase transition-all hover:bg-ember-500 hover:border-ember-500 hover:text-white rounded-xl"
          >
            Email Us
          </a>
          <button
            className="px-8 py-4 border border-[rgba(26,20,16,0.1)] text-[#1A1410] font-body text-sm font-medium tracking-[0.15em] uppercase transition-all hover:bg-ember-500 hover:border-ember-500 hover:text-white rounded-xl"
            onClick={() => toast.success('Opening maps...')}
          >
            Get Directions
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
            Also Available On
          </span>
          <div className="flex flex-wrap gap-6">
            {['Uber Eats', 'DoorDash', 'Grubhub', 'Postmates'].map((partner) => (
              <span
                key={partner}
                className="font-mono text-xs tracking-[0.1em] uppercase text-[#1A1410]/25 hover:text-[#1A1410] transition-colors cursor-pointer"
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
