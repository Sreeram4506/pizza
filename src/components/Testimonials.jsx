import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const testimonials = [
  {
    id: 1,
    name: 'Sarah M.',
    avatar: '👩',
    text: "Best pizza in town! The Margherita Royale is literally life-changing. The crust is so airy and perfect, and you can taste the quality of the San Marzano tomatoes. I'm officially addicted!",
    rating: 5,
    order: 'Margherita Royale',
  },
  {
    id: 2,
    name: 'James K.',
    avatar: '👨‍💼',
    text: "Authentic wood-fired taste that transports me straight to Naples. The chatbot made ordering my custom toppings super easy. Pizza Blast is now my weekly Friday night tradition!",
    rating: 5,
    order: 'Custom Pepperoni',
  },
  {
    id: 3,
    name: 'Emily R.',
    avatar: '👩‍🌾',
    text: "Finally a place that does valid vegetarian options right! The Garden Harvest pizza with fresh basil and seasonal veggies is absolutely Divine. My whole family loves it!",
    rating: 5,
    order: 'Garden Harvest',
  },
  {
    id: 4,
    name: 'Mike T.',
    avatar: '👨‍🍳',
    text: "As a chef myself, I'm picky about pizza. The 48-hour fermented dough here is legit - perfect chew and char. The Diavola has just the right amount of heat. Highly recommend!",
    rating: 5,
    order: 'Spicy Diavola',
  },
]

export default function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [active, setActive] = useState(0)

  return (
    <section ref={ref} className="py-24 relative bg-mozzarella-100 overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-tomato-100 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-basil-100 rounded-full blur-3xl opacity-30" />

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
            <span className="text-2xl">⭐</span>
            <span className="text-crust-700 text-sm font-semibold tracking-wide">Customer Love</span>
          </motion.div>
          
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-wood-800 mb-6 tracking-tight">
            What Pizza <span className="text-tomato-600">Lovers</span> Say
          </h2>
        </motion.div>

        {/* Testimonial Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl p-8 md:p-12 shadow-pizza border border-crust-100"
            >
              {/* Rating */}
              <div className="flex justify-center gap-1 mb-8">
                {[...Array(testimonials[active].rating)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="text-3xl"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1 * i, type: 'spring' }}
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>

              {/* Quote */}
              <div className="relative mb-8">
                <span className="absolute -top-4 -left-2 text-6xl text-tomato-200 font-display">"</span>
                <p className="text-wood-600 text-xl md:text-2xl leading-relaxed text-center font-light italic relative z-10 px-8">
                  {testimonials[active].text}
                </p>
                <span className="absolute -bottom-8 -right-2 text-6xl text-tomato-200 font-display">"</span>
              </div>

              {/* Divider */}
              <div className="w-20 h-1 bg-crust-300 mx-auto rounded-full mb-8" />

              {/* Author */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-tomato-100 rounded-full flex items-center justify-center text-3xl mb-4">
                  {testimonials[active].avatar}
                </div>
                <p className="font-display font-bold text-xl text-wood-800">{testimonials[active].name}</p>
                <p className="text-tomato-600 text-sm font-medium">Ordered: {testimonials[active].order}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setActive(i)}
                className={`h-3 rounded-full transition-all duration-500 ${
                  i === active 
                    ? 'bg-tomato-600 w-10' 
                    : 'bg-crust-200 w-3 hover:bg-crust-300'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-center gap-4 mt-6">
            <motion.button
              onClick={() => setActive((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
              className="w-12 h-12 rounded-full bg-white border-2 border-crust-200 flex items-center justify-center text-wood-600 hover:border-tomato-400 hover:text-tomato-600 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            <motion.button
              onClick={() => setActive((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
              className="w-12 h-12 rounded-full bg-white border-2 border-crust-200 flex items-center justify-center text-wood-600 hover:border-tomato-400 hover:text-tomato-600 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
        >
          {[
            { value: '4.9', label: 'Average Rating', icon: '⭐' },
            { value: '2,500+', label: 'Happy Customers', icon: '😊' },
            { value: '98%', label: 'Would Recommend', icon: '👍' },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="font-display font-black text-3xl text-tomato-600">{stat.value}</div>
              <div className="text-wood-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
