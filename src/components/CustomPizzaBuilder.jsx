import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useChatbot } from '../context/ChatbotContext'

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

// Pizza configuration
const PIZZA_CONFIG = {
  bases: [
    { id: 'thin', name: 'Thin Crust', price: 0, color: '#D4C5A1', desc: 'Crispy & light' },
    { id: 'thick', name: 'Thick Crust', price: 1, color: '#C4A484', desc: 'Chewy & satisfying' },
    { id: 'cheese-burst', name: 'Cheese Burst', price: 2.5, color: '#E6B325', desc: 'Molten cheese edge' },
    { id: 'whole-wheat', name: 'Whole Wheat', price: 1.5, color: '#A67B5B', desc: 'Hearty & wholesome' },
  ],
  sauces: [
    { id: 'tomato', name: 'San Marzano', price: 0, color: '#C1440E', desc: 'Classic Neapolitan' },
    { id: 'bbq', name: 'Smoky BBQ', price: 0.75, color: '#5C3317', desc: 'Sweet & smoky' },
    { id: 'white', name: 'Garlic Cream', price: 1, color: '#E8DFC9', desc: 'Rich & velvety' },
    { id: 'pesto', name: 'Basil Pesto', price: 1.25, color: '#4A7C3F', desc: 'Fresh & aromatic' },
  ],
  toppings: [
    { id: 'pepperoni', name: 'Pepperoni', price: 1.5, emoji: '🍕', category: 'Meat' },
    { id: 'mushrooms', name: 'Wild Mushrooms', price: 1, emoji: '🍄', category: 'Veggie' },
    { id: 'olives', name: 'Kalamata Olives', price: 1.25, emoji: '🫒', category: 'Veggie' },
    { id: 'jalapenos', name: 'Jalapeños', price: 1, emoji: '🌶️', category: 'Spicy' },
    { id: 'bell-peppers', name: 'Bell Peppers', price: 0.75, emoji: '🫑', category: 'Veggie' },
    { id: 'onions', name: 'Caramelized Onion', price: 0.5, emoji: '🧅', category: 'Veggie' },
    { id: 'cheese', name: 'Bufala Mozzarella', price: 2, emoji: '🧀', category: 'Cheese' },
    { id: 'corn', name: 'Sweet Corn', price: 0.75, emoji: '🌽', category: 'Veggie' },
    { id: 'tomatoes', name: 'Cherry Tomatoes', price: 0.75, emoji: '🍅', category: 'Veggie' },
    { id: 'pineapple', name: 'Roasted Pineapple', price: 1, emoji: '🍍', category: 'Sweet' },
  ],
}

const STEPS = [
  { id: 1, title: 'Foundation', subtitle: 'Choose your crust' },
  { id: 2, title: 'Canvas', subtitle: 'Select your sauce' },
  { id: 3, title: 'Artistry', subtitle: 'Add your toppings' },
  { id: 4, title: 'The Bake', subtitle: 'Cooked to perfection' },
]

export default function CustomPizzaBuilder() {
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
          scale: 0.65 + Math.random() * 0.35,
          delay: i * 0.12,
          // Random start position for dramatic falling arc
          startX: (Math.random() - 0.5) * 120,
          floatOffset: Math.random() * Math.PI * 2, // for idle floating
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
      name: `Custom Pizza (${selectedBase || 'Classic'})`
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
      name: `Custom Pizza (${selectedBase || 'Classic'})`
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
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
    const atelier = document.getElementById('atelier')
    atelier?.scrollIntoView({ behavior: 'auto' })
  }

  const prevStep = () => {
    if (currentStep === 4) setIsBaking(false)
    setCurrentStep(prev => Math.max(prev - 1, 1))
    const atelier = document.getElementById('atelier')
    atelier?.scrollIntoView({ behavior: 'auto' })
  }

  return (
    <section id="atelier" className="min-h-screen py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* Grain */}
      <div className="grain-overlay" />

      {/* Background glows */}
      <div className="absolute inset-0 ember-glow-bg" />
      <div className="absolute inset-0 gold-glow-bg" />



      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-24 pb-32 relative z-10">
        {/* Cinematic Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-400 block mb-4"
          >
            The Atelier
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="font-display italic font-bold text-5xl md:text-6xl lg:text-7xl text-[#1A1410] tracking-tight"
          >
            Build Your <span className="text-ember-500">Masterpiece</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="font-body text-[#7A7068] text-lg mt-4 italic"
          >
            "Every great pizza begins with a single choice."
          </motion.p>
        </motion.div>

        {/* Step Progress — Cinematic */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-4 mb-16"
        >
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <motion.button
                onClick={() => {
                  if (step.id <= currentStep || (step.id === 2 && selectedBase) || (step.id === 3 && selectedSauce)) {
                    if (currentStep === 4 && step.id < 4) {
                      setIsBaking(false)
                    }
                    setCurrentStep(step.id)
                    const atelier = document.getElementById('atelier')
                    atelier?.scrollIntoView({ behavior: 'auto' })
                  }
                }}
                className={`relative flex items-center gap-3 px-6 py-3 transition-all duration-500 ${currentStep === step.id
                  ? 'text-[#1A1410]'
                  : currentStep > step.id
                    ? 'text-gold-500'
                    : 'text-[#9B8D74]/40'
                  }`}
              >
                <span className={`font-mono text-lg ${currentStep === step.id ? 'text-ember-600' : ''}`}>
                  {currentStep > step.id ? '✓' : `0${step.id}`}
                </span>
                <div className="hidden md:block text-left">
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
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-px mx-2 transition-colors duration-500 ${currentStep > step.id ? 'bg-gold-400/40' : 'bg-[rgba(26,20,16,0.08)]'
                  }`} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Two-Panel Layout */}
        <div className="grid lg:grid-cols-[1fr,1.1fr] gap-12 lg:gap-16 items-start">

          {/* ═══ LEFT: Pizza Canvas — 3D Perspective ═══ */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="order-2 lg:order-1"
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
                  className="relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full"
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
                          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
                          zIndex: 10,
                        }}
                      >
                        <motion.span
                          className="block"
                          animate={{
                            y: [0, -3, 0, 2, 0],
                            rotate: [0, 2, -2, 1, 0],
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
                        Your Canvas
                      </span>
                      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1410]/60 mt-2">
                        Select a crust to begin
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
                <span className="font-mono text-xs tracking-[0.15em] uppercase text-[#9B8D74]">Total</span>
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
                  {selectedToppings.length} topping{selectedToppings.length > 1 ? 's' : ''} selected
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
                <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 block mb-4">Your Creation</span>
                <div className="space-y-2">
                  {selectedBase && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9B8D74] font-body">{selectedBase.name}</span>
                      <span className="font-mono text-[#1A1410] text-xs">{selectedBase.price > 0 ? `+$${selectedBase.price.toFixed(2)}` : 'Included'}</span>
                    </div>
                  )}
                  {selectedSauce && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9B8D74] font-body">{selectedSauce.name}</span>
                      <span className="font-mono text-[#1A1410] text-xs">{selectedSauce.price > 0 ? `+$${selectedSauce.price.toFixed(2)}` : 'Included'}</span>
                    </div>
                  )}
                  {selectedToppings.map(t => (
                    <div key={t.id} className="flex justify-between text-sm">
                      <span className="text-[#9B8D74] font-body">{t.emoji} {t.name}</span>
                      <span className="font-mono text-[#1A1410] text-xs">+${t.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ═══ RIGHT: Controls Panel ═══ */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="order-1 lg:order-2"
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
                  <h2 className="font-display italic text-3xl md:text-4xl text-[#1A1410] mb-2">Choose Your Foundation</h2>
                  <p className="font-body text-[#9B8D74] text-sm mb-10">The soul of every great pizza starts here.</p>

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
                          <div className="font-body font-medium text-[#1A1410]">{base.name}</div>
                          <div className="font-body text-xs text-[#9B8D74]">{base.desc}</div>
                        </div>
                        <div className="font-mono text-sm text-gold-400">
                          {base.price > 0 ? `+$${base.price.toFixed(2)}` : 'Free'}
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
                  <h2 className="font-display italic text-3xl md:text-4xl text-[#1A1410] mb-2">Paint Your Canvas</h2>
                  <p className="font-body text-[#9B8D74] text-sm mb-10">Every brushstroke of flavor matters.</p>

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
                        <div className="font-body font-medium text-[#1A1410] text-sm">{sauce.name}</div>
                        <div className="font-body text-xs text-[#9B8D74] mt-1">{sauce.desc}</div>
                        <div className="font-mono text-xs text-gold-400 mt-3">
                          {sauce.price > 0 ? `+$${sauce.price.toFixed(2)}` : 'Included'}
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
                  <h2 className="font-display italic text-3xl md:text-4xl text-[#1A1410] mb-2">Add Your Artistry</h2>
                  <p className="font-body text-[#9B8D74] text-sm mb-10">Each topping tells a story. What's yours?</p>

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
                          {category}
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
                                  <div className="font-body font-medium text-[#1A1410] text-sm truncate">{topping.name}</div>
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
                  <h2 className="font-display italic text-3xl md:text-4xl text-[#1A1410] mb-2">The Alchemist's Fire</h2>
                  <p className="font-body text-[#9B8D74] text-sm mb-10">Patience is the final ingredient.</p>

                  <div className="bg-[#1A1410] rounded-[2.5rem] p-10 relative overflow-hidden h-[400px] flex flex-col items-center justify-center border border-[rgba(193,68,14,0.15)] shadow-ember-lg">
                    {/* Oven Interior Glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#C1440E44] to-transparent opacity-40" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(193,68,14,0.2),transparent_70%)]" />

                    {/* Animated Embers in Oven */}
                    <EmberParticles count={25} active={true} />

                    <div className="relative z-10 text-center w-full">
                      <div className="mb-8">
                        <div className="text-6xl mb-4">🔥</div>
                        <div className="font-display italic text-2xl text-white">Baking...</div>
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
                          <span>Traditional Oven</span>
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
                              ✨ Perfect Bake Achieved
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
              className="mt-12 flex items-center justify-between"
            >
              <motion.button
                whileHover={currentStep > 1 ? { scale: 1.05 } : {}}
                whileTap={currentStep > 1 ? { scale: 0.95 } : {}}
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 font-mono text-xs tracking-[0.15em] uppercase transition-all ${currentStep === 1 ? 'text-[#1A1410]/20 cursor-not-allowed' : 'text-[#9B8D74] hover:text-[#1A1410]'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Previous
              </motion.button>

              <div className="flex items-center gap-4">
                {currentStep < 4 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    disabled={currentStep === 1 && !selectedBase}
                    className={`px-8 py-4 bg-ember-500 text-parchment-200 font-body font-semibold text-sm tracking-[0.15em] uppercase hover:shadow-ember transition-all flex items-center gap-2 ${(currentStep === 1 && !selectedBase) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    style={{ borderRadius: '2px' }}
                  >
                    {currentStep === 3 ? 'Bake Simulation' : 'Continue'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={resetBuilder}
                      className="px-6 py-4 border border-[rgba(26,20,16,0.1)] text-[#9B8D74] font-body text-sm tracking-[0.1em] uppercase hover:text-[#1A1410] transition-all rounded-xl"
                      style={{ borderRadius: '2px' }}
                    >
                      Reset
                    </motion.button>
                    <motion.button
                      whileHover={bakeProgress === 100 ? { scale: 1.02 } : {}}
                      whileTap={bakeProgress === 100 ? { scale: 0.98 } : {}}
                      onClick={addToCartInternal}
                      disabled={bakeProgress < 100}
                      className={`px-6 py-4 border border-gold-400/30 text-gold-400 font-body font-semibold text-sm tracking-[0.1em] uppercase hover:bg-gold-400/10 transition-all rounded-xl ${bakeProgress < 100 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      style={{ borderRadius: '2px' }}
                    >
                      Add to Cart
                    </motion.button>
                    <motion.button
                      whileHover={bakeProgress === 100 ? { scale: 1.02 } : {}}
                      whileTap={bakeProgress === 100 ? { scale: 0.98 } : {}}
                      onClick={checkoutNow}
                      disabled={bakeProgress < 100}
                      className={`px-8 py-4 bg-ember-500 text-white font-body font-semibold text-sm tracking-[0.15em] uppercase hover:shadow-ember transition-all flex items-center gap-2 rounded-xl ${bakeProgress < 100 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      style={{ borderRadius: '2px' }}
                    >
                      Order Now
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
