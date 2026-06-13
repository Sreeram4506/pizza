import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useChatbot } from '../context/ChatbotContext'

const combos = [
  {
    name: 'Solo Feast',
    price: 18.99,
    savings: 3.49,
    includes: ['Margherita Royale', 'Garlic Bread', 'Soft drink'],
    tag: 'WEEKDAY',
  },
  {
    name: 'Duo Delight',
    price: 32.99,
    savings: 6.99,
    includes: ['Two Signature Pizzas', 'Large Fries', 'Cheesy breadsticks'],
    tag: 'MOST POPULAR',
    featured: true,
  },
  {
    name: 'Family Party',
    price: 54.99,
    savings: 12.49,
    includes: ['Three Family Pizzas', 'Two Large Sides', '1.5L Beverage', 'Dessert'],
    tag: 'BEST VALUE',
  },
]

function CountdownTimer() {
  const [time, setTime] = useState({ hours: 2, minutes: 14, seconds: 33 })

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) { seconds = 59; minutes-- }
        if (minutes < 0) { minutes = 59; hours-- }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59 }
        return { hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <span className="font-mono text-sm tracking-[0.15em] text-ember-500">
      {pad(time.hours)}h : {pad(time.minutes)}m : {pad(time.seconds)}s
    </span>
  )
}

export default function ComboDeals() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const { openWithIntent } = useChatbot()

  return (
    <section ref={ref} id="deals" className="py-24 lg:py-32 relative bg-[#F5F3EF] overflow-hidden section-grain">
      <div className="absolute inset-0 ember-glow-bg" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8"
        >
          <div>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold-400 block mb-4">
              Private Offers
            </span>
            <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-[#1A1410] tracking-tight italic">
              Exclusive Deals
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B8D74]">Ends in</span>
            <CountdownTimer />
          </div>
        </motion.div>

        <div className="divider-gold mb-12" />

        {/* Combo Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {combos.map((combo, i) => (
            <motion.div
              key={combo.name}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 * i, duration: 0.6 }}
              className={`relative group ${combo.featured ? 'md:-mt-4 md:-mb-4' : ''}`}
            >
              <div
                className={`relative bg-white border border-[rgba(26,20,16,0.08)] p-8 lg:p-10 transition-all duration-500 overflow-hidden hover:border-[rgba(193,68,14,0.2)] hover:shadow-card-hover rounded-xl ${combo.featured ? 'border-[rgba(193,68,14,0.15)]' : ''}`}
                style={{ borderRadius: '12px' }}
              >
                {/* Foil shimmer on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 foil-shimmer" />

                {/* Tag */}
                <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 relative z-10">
                  {combo.tag}
                </span>

                {/* Name */}
                <h3 className="font-display text-3xl italic text-[#1A1410] mt-4 mb-6 relative z-10">
                  {combo.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-8 relative z-10">
                  <span className="font-mono text-3xl text-ember-500 tracking-tight">${combo.price}</span>
                  <span className="font-mono text-xs text-gold-400/60">Save ${combo.savings}</span>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-[rgba(242,235,217,0.06)] mb-6 relative z-10" />

                {/* Includes */}
                <ul className="space-y-3 mb-10 relative z-10">
                  {combo.includes.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[#5C554E] text-sm font-body">
                      <span className="w-1 h-1 rounded-full bg-ember-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => openWithIntent('order', { item: combo.name })}
                  className={`relative z-10 w-full py-4 text-center font-body text-sm font-medium tracking-[0.15em] uppercase transition-all duration-300 rounded-xl ${combo.featured
                    ? 'bg-ember-500 text-white hover:shadow-ember'
                    : 'border border-[rgba(26,20,16,0.1)] text-[#1A1410] hover:bg-ember-500 hover:border-ember-500 hover:text-white'
                    }`}
                  style={{ borderRadius: '12px' }}
                >
                  Order Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-12 flex flex-wrap justify-center gap-8 text-[#9B8D74]"
        >
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
            <span className="text-ember-500">Free delivery</span> on orders over $25
          </span>
          <span className="w-px h-4 bg-[rgba(26,20,16,0.1)]" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
            <span className="text-gold-400">20% off</span> first-time customers
          </span>
        </motion.div>
      </div>
    </section>
  )
}
