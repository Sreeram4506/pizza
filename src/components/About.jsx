import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 relative bg-white overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-tomato-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-basil-50 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2" />
      
      {/* Floating Pizza Icon */}
      <motion.div
        className="absolute top-20 right-10 opacity-10 hidden lg:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <span className="text-9xl">🍕</span>
      </motion.div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Section Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 bg-crust-100 rounded-full mb-8"
          >
            <span className="text-2xl">👨‍🍳</span>
            <span className="text-crust-700 text-sm font-semibold tracking-wide">Our Story</span>
          </motion.div>

          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-wood-800 mb-8 tracking-tight leading-tight">
            Crafted with <span className="text-tomato-600">Passion</span>,
            <br />
            Served with <span className="text-basil-600">Love</span>
          </h2>

          <p className="text-wood-600 text-lg md:text-xl leading-relaxed mb-8 max-w-3xl mx-auto font-light">
            At PizzaBlast, we believe that the soul of a great pizza lies in its crust. 
            Our dough is fermented for 48 hours using a family recipe passed down through 
            three generations, tossed by hand, and baked in our wood-fired ovens imported 
            directly from Naples.
          </p>

          <p className="text-wood-500 text-base md:text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
            We top every pizza with the freshest San Marzano tomatoes, creamy mozzarella 
            di bufala, and aromatic basil hand-picked from our local herb garden. It's not 
            just pizza — it's a slice of Italian tradition.
          </p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {[
              { num: '100K+', label: 'Pizzas Served', icon: '🍕' },
              { num: '48h', label: 'Dough Fermentation', icon: '⏰' },
              { num: '24+', label: 'Signature Recipes', icon: '📜' },
              { num: '900°F', label: 'Wood-Fired Heat', icon: '🔥' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * i + 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-mozzarella-100 rounded-3xl p-6 text-center border border-crust-100 hover:shadow-crust transition-all"
              >
                <span className="text-3xl mb-3 block">{stat.icon}</span>
                <div className="font-display font-black text-3xl md:text-4xl text-tomato-600">{stat.num}</div>
                <div className="text-wood-500 text-xs font-semibold uppercase tracking-wider mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
            className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {[
              { 
                icon: '🌾', 
                title: 'Premium Flour', 
                desc: '00-grade Italian flour for the perfect chewy crust' 
              },
              { 
                icon: '🍅', 
                title: 'San Marzano', 
                desc: 'Authentic tomatoes from the slopes of Mount Vesuvius' 
              },
              { 
                icon: '🧀', 
                title: 'Fresh Mozzarella', 
                desc: 'Creamy buffalo mozzarella delivered daily' 
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * i + 0.9 }}
                className="bg-white rounded-2xl p-6 border border-crust-100 shadow-sm hover:shadow-pizza transition-all group"
              >
                <div className="w-14 h-14 bg-tomato-100 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-wood-800 mb-2">{feature.title}</h3>
                <p className="text-wood-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
