import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useSettings } from '../context/SettingsContext'

export default function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { settings } = useSettings()

  return (
    <section ref={ref} className="py-20 lg:py-40 relative bg-white overflow-hidden section-grain">
      {/* Huge ghost number */}
      <div className="absolute top-1/2 -translate-y-1/2 right-0 font-display text-[25vw] leading-none text-[#1A1410]/[0.03] select-none pointer-events-none hidden lg:block">
        01
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
            Our Philosophy
          </span>

          {/* Pull quote */}
          <blockquote className="font-display italic text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1A1410] leading-[1.2] tracking-tight mb-12">
            "We don't make food.<br />
            We make <span className="text-ember-500">memories</span>."
          </blockquote>

          {/* Thin rule */}
          <div className="w-16 h-px bg-gold-400/40 mb-10" />

          {/* Description */}
          <div className="grid md:grid-cols-2 gap-12 max-w-3xl">
            <p className="text-[#5C554E] text-base leading-relaxed font-body">
              At {settings?.restaurantName || 'PizzaBlast'}, we believe that the soul of a great pizza lies in its crust.
              Our dough is fermented for 48 hours using a family recipe passed down through
              three generations, hand-tossed and baked in our wood-fired ovens imported
              directly from Naples.
            </p>
            <p className="text-[#5C554E] text-base leading-relaxed font-body">
              We top every pizza with the freshest San Marzano tomatoes, creamy mozzarella
              di bufala, and aromatic basil hand-picked from our local herb garden. It's not
              just pizza — it's a slice of Italian tradition.
            </p>
          </div>

          {/* Founder signature */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
            className="mt-16"
          >
            <span className="font-display italic text-2xl text-[#1A1410]/20">— Chef Marco</span>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(26,20,16,0.06)]"
        >
          {[
            { num: '100K+', label: 'Pizzas Served' },
            { num: '48h', label: 'Dough Fermentation' },
            { num: '24+', label: 'Signature Recipes' },
            { num: '900°C', label: 'Wood-Fired Heat' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i + 0.5 }}
              className="bg-white p-8 lg:p-10 text-center"
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
