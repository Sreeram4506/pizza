import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import { useTranslation } from 'react-i18next'

// ═══════════════════════════════════════════
// PIZZA ATELIER — Cinematic Builder
// ═══════════════════════════════════════════

// Ember particle system
function EmberParticles({ count = 12, active }) {
  if (!active) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '40%',
            background: `hsl(${20 + Math.random() * 20}, 90%, ${50 + Math.random() * 20}%)`,
          }}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -(80 + Math.random() * 120)],
            x: [0, (Math.random() - 0.5) * 60],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            delay: Math.random() * 2,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  )
}

// Cinematic smoke/steam
function SmokeEffect({ active }) {
  if (!active) return null
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 40 + Math.random() * 40,
            height: 40 + Math.random() * 40,
            left: `${30 + Math.random() * 40}%`,
            top: `${20 + Math.random() * 30}%`,
            background: 'radial-gradient(circle, rgba(242,235,217,0.08), transparent)',
            filter: 'blur(12px)',
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -(40 + Math.random() * 60)],
            x: [(Math.random() - 0.5) * 30],
            scale: [0.5, 1.8, 2.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: i * 0.6,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  )
}

// Ring pulse when item is placed
function PulseRing({ trigger }) {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-ember-500/40 pointer-events-none"
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 1.3, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  )
}

// Pizza configuration defaults
const DEFAULT_PIZZA_CONFIG = {
  bases: [
    { id: 'thin', nameKey: 'builder.config.bases.thin.name', price: 0, color: '#D4C5A1', descKey: 'builder.config.bases.thin.desc' },
    { id: 'thick', nameKey: 'builder.config.bases.thick.name', price: 1, color: '#C4A484', descKey: 'builder.config.bases.thick.desc' },
    { id: 'cheese-burst', nameKey: 'builder.config.bases.cheese-burst.name', price: 2.5, color: '#E6B325', descKey: 'builder.config.bases.cheese-burst.desc' },
    { id: 'whole-wheat', nameKey: 'builder.config.bases.whole-wheat.name', price: 1.5, color: '#A67B5B', descKey: 'builder.config.bases.whole-wheat.desc' },
  ],
  sauces: [
    { id: 'tomato', nameKey: 'builder.config.sauces.tomato.name', price: 0, color: '#C1440E', descKey: 'builder.config.sauces.tomato.desc' },
    { id: 'bbq', nameKey: 'builder.config.sauces.bbq.name', price: 0.75, color: '#5C3317', descKey: 'builder.config.sauces.bbq.desc' },
    { id: 'white', nameKey: 'builder.config.sauces.white.name', price: 1, color: '#E8DFC9', descKey: 'builder.config.sauces.white.desc' },
    { id: 'pesto', nameKey: 'builder.config.sauces.pesto.name', price: 1.25, color: '#4A7C3F', descKey: 'builder.config.sauces.pesto.desc' },
  ],
  toppings: [
    { id: 'pepperoni', nameKey: 'builder.config.toppings.pepperoni', price: 1.5, emoji: '🍕', category: 'Meat' },
    { id: 'mushrooms', nameKey: 'builder.config.toppings.mushrooms', price: 1, emoji: '🍄', category: 'Veggie' },
    { id: 'olives', nameKey: 'builder.config.toppings.olives', price: 1.25, emoji: '🫒', category: 'Veggie' },
    { id: 'jalapenos', nameKey: 'builder.config.toppings.jalapenos', price: 1, emoji: '🌶️', category: 'Spicy' },
    { id: 'bell-peppers', nameKey: 'builder.config.toppings.bell-peppers', price: 0.75, emoji: '🫑', category: 'Veggie' },
    { id: 'onions', nameKey: 'builder.config.toppings.onions', price: 0.5, emoji: '🧅', category: 'Veggie' },
    { id: 'cheese', nameKey: 'builder.config.toppings.cheese', price: 2, emoji: '🧀', category: 'Cheese' },
    { id: 'corn', nameKey: 'builder.config.toppings.corn', price: 0.75, emoji: '🌽', category: 'Veggie' },
    { id: 'tomatoes', nameKey: 'builder.config.toppings.tomatoes', price: 0.75, emoji: '🍅', category: 'Veggie' },
    { id: 'pineapple', nameKey: 'builder.config.toppings.pineapple', price: 1, emoji: '🍍', category: 'Sweet' },
  ],
}

const STEPS = (t) => [
  { id: 1, title: t('builder.steps.foundation.title'), subtitle: t('builder.steps.foundation.subtitle') },
  { id: 2, title: t('builder.steps.canvas.title'), subtitle: t('builder.steps.canvas.subtitle') },
  { id: 3, title: t('builder.steps.artistry.title'), subtitle: t('builder.steps.artistry.subtitle') },
  { id: 4, title: t('builder.steps.bake.title'), subtitle: t('builder.steps.bake.subtitle') },
]

export default function CustomPizzaBuilder() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const PIZZA_CONFIG = settings?.atelierConfig || DEFAULT_PIZZA_CONFIG

  const [selectedBase, setSelectedBase] = useState(null)
  const [selectedSauce, setSelectedSauce] = useState(null)
  const [selectedToppings, setSelectedToppings] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [isBaking, setIsBaking] = useState(false)
  const [bakeProgress, setBakeProgress] = useState(0)
  const [toppingElements, setToppingElements] = useState([])
  const [pulseKey, setPulseKey] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const pizzaCanvasRef = useRef(null)
  const { openWithIntent } = useChatbot()
  const navigate = useNavigate()

  const activeSteps = STEPS(t)

  // Helper to get localized name/desc with fallback
  const baseName = (item) => item.nameKey ? t(item.nameKey) : item.name
  const baseDesc = (item) => item.descKey ? t(item.descKey) : item.desc

  // Baking animation simulation
  useEffect(() => {
    if (isBaking) {
      const interval = setInterval(() => {
        setBakeProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 1
        })
      }, 50)
      return () => clearInterval(interval)
    }
  }, [isBaking])

  // Pizza rotation based on mouse position
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8])
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8])

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }, [mouseX, mouseY])

  const triggerPulse = () => setPulseKey(k => k + 1)

  const calculatePrice = () => {
    let total = 8.99
    if (selectedBase) total += selectedBase.price
    if (selectedSauce) total += selectedSauce.price
    selectedToppings.forEach(t => { total += t.price })
    return total.toFixed(2)
  }

  const handleToppingToggle = (topping) => {
    if (selectedToppings.find(t => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter(t => t.id !== topping.id))
      setToppingElements(prev => prev.filter(el => el.toppingId !== topping.id))
    } else {
      setSelectedToppings([...selectedToppings, topping])
      triggerPulse()
      // Distribute toppings evenly across the pizza using golden-angle spiral
      const newEls = []
      const count = Math.floor(Math.random() * 3) + 4 // 4-6 toppings per selection
      const existingCount = toppingElements.length
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ~137.5 degrees
      const pizzaRadius = 30 // percentage of half the pizza area to stay within sauce

      for (let i = 0; i < count; i++) {
        const globalIndex = existingCount + i
        // Golden angle spiral gives even distribution
        const angle = goldenAngle * globalIndex + (Math.random() * 0.3)
        // Square root distribution for uniform area coverage
        const normalizedDist = Math.sqrt((globalIndex + 1) / (existingCount + count + 5))
        const dist = normalizedDist * pizzaRadius + (Math.random() * 8 - 4) // slight jitter
        const xPercent = Math.cos(angle) * dist
        const yPercent = Math.sin(angle) * dist

        newEls.push({
          id: `${topping.id}-${Date.now()}-${i}`,
          toppingId: topping.id,
          emoji: topping.emoji,
          x: xPercent,
          y: yPercent,
          rotation: Math.random() * 360,
          scale: 0.7 + Math.random() * 0.4, // slight scale variation for realism
          delay: i * 0.08, // faster stagger
          // Random start position for dramatic falling arc
          startX: (Math.random() - 0.5) * 80,
          floatOffset: Math.random() * Math.PI * 2, // for idle floating
          dropShadowOffset: { x: Math.random() * 2 - 1, y: Math.random() * 2 + 1 }, // dynamic shadow
        })
      }
      setToppingElements(prev => [...prev, ...newEls])
    }
  }

  const addToCartInternal = () => {
    const pizzaPrice = calculatePrice()
    const customPizza = {
      base: selectedBase,
      sauce: selectedSauce,
      toppings: selectedToppings,
      price: Number(pizzaPrice),
      name: `${t('builder.yourCreation')} (${selectedBase ? baseName(selectedBase) : 'Classic'})`
    }
    openWithIntent('add_to_cart', { item: customPizza })
    toast.success('Custom pizza added to cart!')
  }

  const checkoutNow = () => {
    const pizzaPrice = calculatePrice()
    const customPizza = {
      base: selectedBase,
      sauce: selectedSauce,
      toppings: selectedToppings,
      price: Number(pizzaPrice),
      name: `${t('builder.yourCreation')} (${selectedBase ? baseName(selectedBase) : 'Classic'})`
    }
    openWithIntent('checkout', { item: customPizza })
  }

  const resetBuilder = () => {
    setSelectedBase(null)
    setSelectedSauce(null)
    setSelectedToppings([])
    setToppingElements([])
    setCurrentStep(1)
    setIsBaking(false)
    setBakeProgress(0)
  }

  const nextStep = () => {
    if (currentStep === 3) {
      setCurrentStep(4)
      setIsBaking(true)
      setBakeProgress(0)
    } else {
      setCurrentStep(prev => Math.min(prev + 1, activeSteps.length))
    }
  }

  const prevStep = () => {
    if (currentStep === 4) setIsBaking(false)
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px -20% 0px' })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <section ref={ref} id="atelier" className="min-h-screen py-24 lg:py-40 bg-white relative overflow-hidden">
      {/* Grain */}
      <div className="grain-overlay" />

      {/* Background glows */}
      <div className="absolute inset-0 ember-glow-bg opacity-30" />
      <div className="absolute inset-0 gold-glow-bg opacity-20" />

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-16 sm:pt-24 pb-32 relative z-10">
        {/* Cinematic Header */}
        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate={isInView ? "visible" : "hidden"}
           className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-400 block mb-4"
          >
            {t('builder.titleLabel')}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="font-display italic font-bold text-5xl md:text-6xl lg:text-7xl text-[#1A1410] tracking-tight"
          >
            {t('builder.title').split('Masterpiece')[0]}<span className="text-ember-500">{t('builder.title').includes('Masterpiece') ? 'Masterpiece' : ''}</span>{t('builder.title').split('Masterpiece')[1]}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="font-body text-[#7A7068] text-lg mt-4 italic"
          >
            {t('builder.subtitle')}
          </motion.p>
        </motion.div>

        {/* Step Progress — Cinematic */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-2 sm:gap-4 mb-10 sm:mb-16 overflow-x-auto pb-4 scrollbar-hide"
        >
          {activeSteps.map((step, i) => (
            <div key={step.id} className="flex items-center shrink-0">
              <motion.button
                onClick={() => {
                  if (step.id <= currentStep || (step.id === 2 && selectedBase) || (step.id === 3 && selectedSauce)) {
                    if (currentStep === 4 && step.id < 4) {
                      setIsBaking(false)
                    }
                    setCurrentStep(step.id)
                  }
                }}
                className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 transition-all duration-500 ${currentStep === step.id
                  ? 'text-[#1A1410]'
                  : currentStep > step.id
                    ? 'text-gold-500'
                    : 'text-[#9B8D74]/40'
                  }`}
              >
                <span className={`font-mono text-sm sm:text-lg ${currentStep === step.id ? 'text-ember-600' : ''}`}>
                  {currentStep > step.id ? '✓' : `0${step.id}`}
                </span>
                <div className="hidden sm:block text-left">
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase">{step.title}</div>
                  <div className="font-body text-xs opacity-60">{step.subtitle}</div>
                </div>
                {/* Active indicator */}
                {currentStep === step.id && (
                  <motion.div
                    layoutId="activeStep"
                    className="absolute bottom-0 left-0 right-0 h-px bg-ember-500"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
              {i < activeSteps.length - 1 && (
                <div className={`w-4 sm:w-12 h-px mx-1 sm:mx-2 transition-colors duration-500 ${currentStep > step.id ? 'bg-gold-400/40' : 'bg-[rgba(26,20,16,0.08)]'
                  }`} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Two-Panel Layout */}
        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate={isInView ? "visible" : "hidden"}
           className="grid lg:grid-cols-[1fr,1.1fr] gap-12 lg:gap-16 items-start"
        >

          {/* ═══ LEFT: Pizza Canvas — 3D Perspective ═══ */}
          <motion.div
            variants={itemVariants}
            className="order-1"
          >
            <div
              className="relative"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => { mouseX.set(0); mouseY.set(0) }}
              style={{ perspective: 800 }}
            >
              {/* Ember particles */}
              <EmberParticles count={15} active={!!selectedBase} />

              {/* Steam when sauce is added */}
              <SmokeEffect active={!!selectedSauce} />

              {/* Pizza with 3D tilt */}
              <motion.div
                style={{ rotateX, rotateY }}
                className="relative flex justify-center items-center py-8"
              >
                <div
                  ref={pizzaCanvasRef}
                  className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full"
                  style={{
                    background: selectedBase
                      ? 'radial-gradient(circle at 40% 40%, rgba(26,20,16,0.04), rgba(245,243,239,0.4))'
                      : 'radial-gradient(circle, rgba(26,20,16,0.02), rgba(245,243,239,0.2))',
                    border: selectedBase ? '1px solid rgba(26,20,16,0.1)' : '1px dashed rgba(26,20,16,0.1)',
                  }}
                >
                  {/* Pulse ring on add */}
                  <PulseRing trigger={pulseKey} key={pulseKey} />

                  {/* Crust ring */}
                  <AnimatePresence>
                    {selectedBase && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle at 35% 35%, ${selectedBase.color}dd, ${selectedBase.color}88)`,
                          boxShadow: isBaking
                            ? `inset 0 0 50px rgba(193,68,14,${0.3 + (bakeProgress / 100) * 0.4}), 0 0 40px rgba(193,68,14,${(bakeProgress / 100) * 0.5})`
                            : `inset 0 0 40px rgba(0,0,0,0.4), 0 0 30px rgba(193,68,14,0.1)`,
                        }}
                      >
                        {isBaking && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: 'radial-gradient(circle, rgba(255,100,0,0.2), transparent)',
                              boxShadow: `inset 0 0 ${bakeProgress / 2}px rgba(255,100,0,0.3)`
                            }}
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sauce spread — cinematic with rotating reveal */}
                  <AnimatePresence>
                    {selectedSauce && selectedBase && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, rotate: -180 }}
                        animate={{ scale: 1, opacity: 0.85, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-[12%] rounded-full"
                        style={{
                          background: `radial-gradient(circle at 40% 40%, ${selectedSauce.color}cc, ${selectedSauce.color}66)`,
                          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Toppings — cinematic fall with even distribution */}
                  <AnimatePresence>
                    {toppingElements.map((el) => (
                      <motion.div
                        key={el.id}
                        initial={{
                          opacity: 0,
                          scale: 0.2,
                          rotate: -180 + Math.random() * 360,
                        }}
                        animate={{
                          opacity: 1,
                          scale: el.scale,
                          rotate: el.rotation,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0,
                          y: -60,
                          rotate: el.rotation + 180,
                          transition: { duration: 0.3, ease: 'easeIn' },
                        }}
                        transition={{
                          duration: 0.7,
                          delay: el.delay,
                          ease: [0.34, 1.56, 0.64, 1], // bounce overshoot
                        }}
                        className="absolute text-2xl md:text-3xl pointer-events-none"
                        style={{
                          left: `calc(50% + ${el.x}%)`,
                          top: `calc(50% + ${el.y}%)`,
                          transform: 'translate(-50%, -50%)',
                          filter: `drop-shadow(${el.dropShadowOffset.x}px ${el.dropShadowOffset.y}px 2px rgba(0,0,0,0.65)) contrast(1.1) brightness(0.95)`,
                          zIndex: 10,
                        }}
                      >
                        <motion.span
                          className="block"
                          style={{
                            transformOrigin: 'center center',
                          }}
                          animate={{
                            y: [0, -2, 0, 1.5, 0],
                            rotate: [-1, 1, 0, -0.5, 1],
                          }}
                          transition={{
                            duration: 3 + Math.random() * 2,
                            delay: el.delay + 0.8,
                            repeat: Infinity,
                            repeatType: 'loop',
                            ease: 'easeInOut',
                          }}
                        >
                          {el.emoji}
                        </motion.span>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Center text when empty */}
                  {!selectedBase && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center"
                    >
                      <span className="font-display italic text-3xl text-[#1A1410]/30">
                        {t('builder.canvasLabel')}
                      </span>
                      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1410]/60 mt-2">
                        {t('builder.canvasSubtitle')}
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Confetti burst */}
              <AnimatePresence>
                {showConfetti && (
                  <motion.div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2"
                        style={{
                          left: '50%',
                          top: '50%',
                          background: ['#C1440E', '#D4922A', '#F2EBD9'][i % 3],
                          borderRadius: i % 2 === 0 ? '50%' : '0',
                        }}
                        initial={{ scale: 0 }}
                        animate={{
                          x: (Math.random() - 0.5) * 300,
                          y: (Math.random() - 0.5) * 300,
                          scale: [0, 1, 0],
                          rotate: Math.random() * 720,
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Price Display — cinematic */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-8"
            >
              <div className="inline-flex items-baseline gap-1">
                <span className="font-mono text-xs tracking-[0.15em] uppercase text-[#9B8D74]">{t('builder.total')}</span>
                <motion.span
                  key={calculatePrice()}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="font-mono text-4xl text-ember-500 tracking-tight ml-3"
                >
                  ${calculatePrice()}
                </motion.span>
              </div>
              {selectedToppings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[#9B8D74]"
                >
                  {t('builder.toppingsCount', { count: selectedToppings.length })}
                </motion.div>
              )}
            </motion.div>

            {/* Selected Summary */}
            {(selectedBase || selectedSauce || selectedToppings.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-[#F5F3EF] border border-[rgba(26,20,16,0.08)] rounded-xl"
                style={{ borderRadius: '2px' }}
              >
                <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 block mb-4">{t('builder.yourCreation')}</span>
                <div className="space-y-2">
                  {selectedBase && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9B8D74] font-body">{baseName(selectedBase)}</span>
                      <span className="font-mono text-[#1A1410] text-xs">{selectedBase.price > 0 ? `+$${selectedBase.price.toFixed(2)}` : t('builder.included')}</span>
                    </div>
                  )}
                  {selectedSauce && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9B8D74] font-body">{baseName(selectedSauce)}</span>
                      <span className="font-mono text-[#1A1410] text-xs">{selectedSauce.price > 0 ? `+$${selectedSauce.price.toFixed(2)}` : t('builder.included')}</span>
                    </div>
                  )}
                  {selectedToppings.map(t_top => (
                    <div key={t_top.id} className="flex justify-between text-sm">
                      <span className="text-[#9B8D74] font-body">{t_top.emoji} {baseName(t_top)}</span>
                      <span className="font-mono text-[#1A1410] text-xs">+${t_top.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ═══ RIGHT: Controls Panel ═══ */}
          <motion.div
            variants={itemVariants}
            className="order-2"
          >
            {/* Step Content — Animated Transitions */}
            <AnimatePresence mode="wait">
              {/* STEP 1: Base */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-3">Step 01</span>
                  <h2 className="font-display italic text-3xl md:text-4xl text-[#1A1410] mb-2">{t('builder.foundation.title')}</h2>
                  <p className="font-body text-[#9B8D74] text-sm mb-10">{t('builder.foundation.p')}</p>

                  <div className="space-y-4">
                    {PIZZA_CONFIG.bases.map((base, i) => (
                      <motion.button
                        key={base.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        onClick={() => { setSelectedBase(base); triggerPulse() }}
                        className={`w-full flex items-center gap-5 p-5 border transition-all duration-500 group text-left ${selectedBase?.id === base.id
                          ? 'border-ember-500/40 bg-ember-500/5 shadow-ember'
                          : 'border-[rgba(242,235,217,0.06)] bg-noir-850 hover:border-[rgba(193,68,14,0.2)]'
                          }`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div
                          className="w-12 h-12 rounded-full flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, ${base.color}ee, ${base.color}88)`,
                            boxShadow: selectedBase?.id === base.id ? '0 0 16px rgba(193,68,14,0.3)' : 'none',
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-body font-medium text-[#1A1410]">{baseName(base)}</div>
                          <div className="font-body text-xs text-[#9B8D74]">{baseDesc(base)}</div>
                        </div>
                        <div className="font-mono text-sm text-gold-400">
                          {base.price > 0 ? `+$${base.price.toFixed(2)}` : t('builder.included')}
                        </div>
                        {selectedBase?.id === base.id && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-ember-500"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Sauce */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-3">Step 02</span>
                  <h2 className="font-display italic text-3xl md:text-4xl text-[#1A1410] mb-2">{t('builder.palette.title')}</h2>
                  <p className="font-body text-[#9B8D74] text-sm mb-10">{t('builder.palette.p')}</p>

                  <div className="grid grid-cols-2 gap-4">
                    {PIZZA_CONFIG.sauces.map((sauce, i) => (
                      <motion.button
                        key={sauce.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        onClick={() => { setSelectedSauce(sauce); triggerPulse() }}
                        className={`relative overflow-hidden p-6 border transition-all duration-500 group text-left ${selectedSauce?.id === sauce.id
                          ? 'border-ember-500/40 bg-ember-500/5 shadow-ember'
                          : 'border-[rgba(242,235,217,0.06)] bg-noir-850 hover:border-[rgba(193,68,14,0.2)]'
                          }`}
                        style={{ borderRadius: '2px' }}
                      >
                        {/* Sauce color accent */}
                        <div
                          className="absolute top-0 left-0 w-full h-1 transition-opacity"
                          style={{
                            background: sauce.color,
                            opacity: selectedSauce?.id === sauce.id ? 1 : 0.3,
                          }}
                        />
                        <div
                          className="w-8 h-8 rounded-full mb-4 transition-transform group-hover:scale-110"
                          style={{ background: sauce.color, boxShadow: `0 0 12px ${sauce.color}44` }}
                        />
                        <div className="font-body font-medium text-[#1A1410] text-sm">{baseName(sauce)}</div>
                        <div className="font-body text-xs text-[#9B8D74] mt-1">{baseDesc(sauce)}</div>
                        <div className="font-mono text-xs text-gold-400 mt-3">
                          {sauce.price > 0 ? `+$${sauce.price.toFixed(2)}` : t('builder.included')}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Toppings */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-3">Step 03</span>
                  <h2 className="font-display italic text-3xl md:text-4xl text-[#1A1410] mb-2">{t('builder.artistry.title')}</h2>
                  <p className="font-body text-[#9B8D74] text-sm mb-10">{t('builder.artistry.p')}</p>

                  <div className="space-y-8 max-h-[450px] overflow-y-auto pr-2 scroll-smooth-ios">
                    {Object.entries(
                      PIZZA_CONFIG.toppings.reduce((acc, t) => {
                        const cat = t.category || 'Other'
                        if (!acc[cat]) acc[cat] = []
                        acc[cat].push(t)
                        return acc
                      }, {})
                    ).map(([category, toppings], catIdx) => (
                      <div key={category} className="space-y-4">
                        <h3 className="font-mono text-[9px] tracking-[0.3em] uppercase text-gold-400/60 pb-2 border-b border-[rgba(26,20,16,0.05)]">
                          {t(`builder.config.categories.${category.toLowerCase()}`, category)}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {toppings.map((topping, i) => {
                            const isSelected = selectedToppings.find(t => t.id === topping.id)
                            return (
                              <motion.button
                                key={topping.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.05 * i + catIdx * 0.1 }}
                                onClick={() => handleToppingToggle(topping)}
                                className={`flex items-center gap-3 p-4 border transition-all duration-300 group text-left ${isSelected
                                  ? 'border-ember-500/40 bg-ember-500/10'
                                  : 'border-[rgba(242,235,217,0.06)] bg-white hover:border-[rgba(193,68,14,0.1)]'
                                  }`}
                                style={{ borderRadius: '2px' }}
                              >
                                <motion.span
                                  className="text-2xl"
                                  animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                                >
                                  {topping.emoji}
                                </motion.span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-body font-medium text-[#1A1410] text-sm truncate">{baseName(topping)}</div>
                                  <div className="font-mono text-[10px] text-gold-400">+${topping.price.toFixed(2)}</div>
                                </div>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-5 h-5 bg-ember-500 flex items-center justify-center flex-shrink-0 rounded"
                                    style={{ borderRadius: '2px' }}
                                  >
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </motion.div>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: The Bake (Oven) */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-3">Step 04</span>
                  <h2 className="font-display italic text-3xl md:text-4xl text-[#1A1410] mb-2">{t('builder.bake.title')}</h2>
                  <p className="font-body text-[#9B8D74] text-sm mb-10">{t('builder.bake.p')}</p>

                  <div className="bg-[#1A1410] rounded-[2.5rem] p-10 relative overflow-hidden h-[400px] flex flex-col items-center justify-center border border-[rgba(193,68,14,0.15)] shadow-ember-lg">
                    {/* Oven Interior Glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#C1440E44] to-transparent opacity-40" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(193,68,14,0.2),transparent_70%)]" />

                    {/* Animated Embers in Oven */}
                    <EmberParticles count={25} active={true} />

                    <div className="relative z-10 text-center w-full">
                      <div className="mb-8">
                        <div className="text-6xl mb-4">🔥</div>
                        <div className="font-display italic text-2xl text-white">{t('builder.bake.baking')}</div>
                      </div>

                      <div className="w-full max-w-[280px] mx-auto">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                          <motion.div
                            className="h-full bg-ember-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${bakeProgress}%` }}
                            transition={{ ease: "linear" }}
                          />
                        </div>
                        <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest text-[#9B8D74]">
                          <span>{t('builder.bake.oven')}</span>
                          <span className="text-ember-500">{bakeProgress}%</span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {bakeProgress === 100 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8"
                          >
                            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                              ✨ {t('builder.bake.perfect')}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation / CTA — Bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6"
            >
              <motion.button
                whileHover={currentStep > 1 ? { scale: 1.05 } : {}}
                whileTap={currentStep > 1 ? { scale: 0.95 } : {}}
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 font-mono text-xs tracking-[0.15em] uppercase transition-all ${currentStep === 1 ? 'text-[#1A1410]/20 cursor-not-allowed hidden sm:flex' : 'text-[#9B8D74] hover:text-[#1A1410]'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                {t('builder.actions.prev')}
              </motion.button>

              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {currentStep < 4 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    disabled={currentStep === 1 && !selectedBase}
                    className={`w-full sm:w-auto px-8 py-4 bg-ember-500 text-white font-body font-semibold text-sm tracking-[0.15em] uppercase hover:shadow-ember transition-all flex items-center justify-center gap-2 ${(currentStep === 1 && !selectedBase) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {currentStep === 3 ? t('builder.actions.simulate') : t('builder.actions.next')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </motion.button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={resetBuilder}
                      className="w-full sm:w-auto px-6 py-4 border border-[rgba(26,20,16,0.1)] text-[#9B8D74] font-body text-sm tracking-[0.1em] uppercase hover:text-[#1A1410] transition-all"
                      style={{ borderRadius: '2px' }}
                    >
                      {t('builder.actions.reset')}
                    </motion.button>
                    <motion.button
                      whileHover={bakeProgress === 100 ? { scale: 1.02 } : {}}
                      whileTap={bakeProgress === 100 ? { scale: 0.98 } : {}}
                      onClick={addToCartInternal}
                      disabled={bakeProgress < 100}
                      className={`w-full sm:w-auto px-6 py-4 border border-gold-400/30 text-gold-400 font-body font-semibold text-sm tracking-[0.1em] uppercase hover:bg-gold-400/10 transition-all ${bakeProgress < 100 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      style={{ borderRadius: '2px' }}
                    >
                      {t('builder.actions.add')}
                    </motion.button>
                    <motion.button
                      whileHover={bakeProgress === 100 ? { scale: 1.02 } : {}}
                      whileTap={bakeProgress === 100 ? { scale: 0.98 } : {}}
                      onClick={checkoutNow}
                      disabled={bakeProgress < 100}
                      className={`w-full sm:w-auto px-8 py-4 bg-ember-500 text-white font-body font-semibold text-sm tracking-[0.15em] uppercase hover:shadow-ember transition-all flex items-center justify-center gap-2 ${bakeProgress < 100 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      style={{ borderRadius: '2px' }}
                    >
                      {t('builder.actions.order')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </motion.button>
                  </div>
                )}
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="sm:hidden mt-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[#9B8D74] underline"
                  >
                    {t('builder.actions.back')}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
