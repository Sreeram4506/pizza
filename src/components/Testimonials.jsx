import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function Testimonials() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px -20% 0px' })

  const testimonials = t('testimonials.data', { returnObjects: true }) || []
  const stats = [
    { value: "4.9/5", label: t('testimonials.stats.rating') },
    { value: "10k+", label: t('testimonials.stats.customers') },
    { value: "98%", label: t('testimonials.stats.recommend') }
  ]

  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Auto-scroll
  useEffect(() => {
    if (testimonials.length === 0) return
    const timer = setInterval(() => {
      setDirection(1)
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  const paginate = (newDirection) => {
    if (testimonials.length === 0) return
    setDirection(newDirection)
    setActiveIndex((prev) => (prev + newDirection + testimonials.length) % testimonials.length)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  }

  if (testimonials.length === 0) return null

  return (
    <section ref={ref} id="testimonials" className="py-24 lg:py-40 relative overflow-hidden bg-[#FAFAF8]">

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        <div
          className="text-center mb-20 lg:mb-32"
        >
          <motion.span variants={itemVariants} className="block mb-6 text-[#8A7A62] text-[11px] font-black tracking-[0.2em] uppercase">
            {t('testimonials.titleLabel')}
          </motion.span>
          <motion.h2 variants={itemVariants} className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1A1410] leading-tight tracking-tight">
            {t('testimonials.title')}
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-[1fr,450px] gap-16 lg:gap-24 items-center">
          {/* Active Testimonial Card */}
          <div className="relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 50 : -50, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: direction > 0 ? -50 : 50, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-[#EBEBE6] rounded-3xl shadow-sm p-10 sm:p-16 lg:p-20 relative overflow-hidden min-h-[400px] flex flex-col justify-center"
              >
                {/* Large quote icon */}
                <div className="absolute top-10 left-10 text-[180px] font-serif italic text-[#1A1410]/5 leading-none select-none pointer-events-none">
                  “
                </div>

                <div className="relative z-10">
                  <p className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] leading-[1.3] text-[#1A1410] font-medium mb-12">
                    {testimonials[activeIndex].text}
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-[#1A1410]/5 pt-10">
                    <div>
                      <h4 className="font-display text-xl text-[#1A1410] mb-1">{testimonials[activeIndex].name}</h4>
                      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B8D74]">
                        {t('testimonials.orderedLabel')}{testimonials[activeIndex].order}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => paginate(-1)}
                        className="w-12 h-12 rounded-full bg-white border border-[#EBEBE6] flex items-center justify-center text-[#1A1410] hover:border-[#1A1410] shadow-sm transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={2} stroke="currentColor" /></svg>
                      </button>
                      <button 
                        onClick={() => paginate(1)}
                        className="w-12 h-12 rounded-full bg-white border border-[#EBEBE6] flex items-center justify-center text-[#1A1410] hover:border-[#1A1410] shadow-sm transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={2} stroke="currentColor" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Pagination dots */}
            <div className="flex gap-3 justify-center mt-12">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > activeIndex ? 1 : -1); setActiveIndex(i); }}
                  className={`h-1.5 transition-all duration-500 rounded-full ${i === activeIndex ? 'w-12 bg-[#1A1410]' : 'w-4 bg-[#EBEBE6] hover:bg-[#1A1410]/20'}`}
                />
              ))}
            </div>
          </div>

          {/* Side Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
                className="bg-white border border-[#EBEBE6] rounded-3xl shadow-sm hover:shadow-md transition-shadow p-8 lg:p-12 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <span className="text-6xl font-serif italic font-black text-[#1A1410]">0{index + 1}</span>
                </div>
                <div className="relative z-10">
                  <div className="font-sans text-3xl lg:text-5xl text-[#1A1410] mb-2 font-black tracking-tight">{stat.value}</div>
                  <div className="font-sans text-[10px] lg:text-[11px] tracking-[0.2em] uppercase text-[#8A7A62] font-black">{stat.label}</div>
                  <div className="w-8 h-1 rounded-full bg-[#1A1410] mt-6 group-hover:w-16 transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
