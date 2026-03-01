import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useChatbot } from '../context/ChatbotContext'

const combos = [
  {
    name: 'Solo Feast',
    price: 18.99,
    savings: 3.49,
    includes: ['Margherita Royale', 'Garlic Bread', 'Soft drink'],
    popular: false,
    color: 'border-crust-300',
    badgeColor: 'bg-crust-500',
    icon: '🍕',
  },
  {
    name: 'Duo Delight',
    price: 32.99,
    savings: 6.99,
    includes: ['Two Signature Pizzas', 'Large Fries', 'Cheesy breadsticks'],
    popular: true,
    color: 'border-tomato-300',
    badgeColor: 'bg-tomato-600',
    icon: '🍕🍕',
  },
  {
    name: 'Family Party',
    price: 54.99,
    savings: 12.49,
    includes: ['Three Family Pizzas', 'Two Large Sides', '1.5L Beverage', 'Dessert'],
    popular: false,
    color: 'border-basil-300',
    badgeColor: 'bg-basil-600',
    icon: '🍕🍕🍕',
  },
]

export default function ComboDeals() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const { openWithIntent } = useChatbot()

  return (
    <section ref={ref} id="deals" className="py-24 relative bg-white overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-64 h-64 bg-tomato-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-crust-50 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 bg-crust-100 rounded-full mb-6"
          >
            <span className="text-2xl">🎁</span>
            <span className="text-crust-700 text-sm font-semibold tracking-wide">Special Offers</span>
          </motion.div>
          
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-wood-800 mb-6 tracking-tight">
            Combo <span className="text-tomato-600">Deals</span>
          </h2>
          <p className="text-wood-500 text-lg max-w-2xl mx-auto">
            Save more with our specially curated combo packages. Perfect for solo diners, 
            date nights, or family feasts!
          </p>
        </motion.div>

        {/* Combo Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {combos.map((combo, i) => (
            <motion.div
              key={combo.name}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 * i, duration: 0.6 }}
              className="relative"
            >
              <motion.div
                whileHover={{ y: -8 }}
                className={`bg-white rounded-3xl p-8 border-2 ${combo.color} shadow-sm hover:shadow-pizza transition-all h-full`}
              >
                {/* Popular Badge */}
                {combo.popular && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 ${combo.badgeColor} text-white text-xs font-black tracking-widest uppercase rounded-full shadow-lg`}>
                    Most Popular
                  </div>
                )}

                {/* Icon */}
                <div className="text-4xl mb-4 text-center">{combo.icon}</div>

                {/* Title */}
                <h3 className="font-display font-black text-2xl text-wood-800 mb-4 tracking-tight text-center">
                  {combo.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline justify-center gap-2 mb-6 pb-6 border-b border-crust-100">
                  <span className="text-wood-400 text-lg">$</span>
                  <span className="font-display font-black text-5xl text-tomato-600">{combo.price}</span>
                </div>

                {/* Savings Badge */}
                <div className="flex justify-center mb-6">
                  <span className="px-3 py-1 bg-basil-100 text-basil-700 text-sm font-bold rounded-full">
                    Save ${combo.savings}
                  </span>
                </div>

                {/* Includes List */}
                <ul className="space-y-3 mb-8">
                  {combo.includes.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-wood-600">
                      <span className="w-6 h-6 rounded-full bg-tomato-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-tomato-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  onClick={() => openWithIntent('order', { item: combo.name })}
                  className={`w-full py-4 ${combo.popular ? 'bg-tomato-600 hover:bg-tomato-700' : 'bg-wood-800 hover:bg-wood-700'} text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Order Combo
                </motion.button>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-mozzarella-100 rounded-full">
            <span className="text-wood-600 text-sm">
              <span className="font-bold text-tomato-600">Free delivery</span> on orders over $25
            </span>
            <span className="w-px h-4 bg-crust-200" />
            <span className="text-wood-600 text-sm">
              <span className="font-bold text-basil-600">20% off</span> for first-time customers
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
