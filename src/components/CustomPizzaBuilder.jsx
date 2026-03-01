import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatbot } from '../context/ChatbotContext'

// Steam particle component for cooking effect
const SteamParticle = ({ delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 0, scale: 0.5 }}
    animate={{ 
      opacity: [0, 0.6, 0],
      y: -60,
      scale: [0.5, 1.2, 1.5],
      x: Math.random() * 40 - 20
    }}
    transition={{ 
      duration: 2,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 2
    }}
    className="absolute w-4 h-4 rounded-full bg-white blur-sm"
    style={{
      left: `${50 + Math.random() * 30 - 15}%`,
      top: `${50 + Math.random() * 20}%`,
      filter: 'blur(8px)'
    }}
  />
)

// Sizzle effect component
const SizzleEffect = ({ x, y, delay }) => (
  <motion.div
    initial={{ opacity: 1, scale: 0 }}
    animate={{ 
      opacity: 0,
      scale: [0, 1.5, 2],
      rotate: Math.random() * 360
    }}
    transition={{ duration: 0.8, delay }}
    className="absolute w-8 h-8 pointer-events-none"
    style={{ left: x, top: y }}
  >
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-yellow-400">
      <circle cx="12" cy="12" r="2" fill="currentColor" className="animate-pulse"/>
      <path d="M12 6L12 2M12 22L12 18M6 12L2 12M22 12L18 12M8.5 8.5L5.5 5.5M18.5 18.5L15.5 15.5M8.5 15.5L5.5 18.5M18.5 5.5L15.5 8.5" 
            stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="animate-spin"/>
    </svg>
  </motion.div>
)

// Heat wave effect
const HeatWave = () => (
  <motion.div
    className="absolute inset-0 rounded-full pointer-events-none"
    animate={{ 
      background: [
        'radial-gradient(circle, transparent 0%, transparent 100%)',
        'radial-gradient(circle, rgba(255,100,0,0.1) 0%, transparent 70%)',
        'radial-gradient(circle, transparent 0%, transparent 100%)'
      ]
    }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
  />
)

// Bubble animation for sauce
const SauceBubble = ({ delay, x, y }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full bg-white opacity-60"
    style={{ left: x, top: y }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1, 0],
      opacity: [0, 0.8, 0],
      y: [0, -5, -10]
    }}
    transition={{ 
      duration: 1.5,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 2
    }}
  />
)

// Pizza configuration data
const PIZZA_CONFIG = {
  bases: [
    { id: 'thin', name: 'Thin Crust', price: 0, color: '#D2691E' },
    { id: 'thick', name: 'Thick Crust', price: 1, color: '#8B4513' },
    { id: 'cheese-burst', name: 'Cheese Burst', price: 2.5, color: '#FFD700' },
    { id: 'whole-wheat', name: 'Whole Wheat', price: 1.5, color: '#DEB887' }
  ],
  sauces: [
    { id: 'tomato', name: 'Tomato Sauce', price: 0, color: '#FF6347' },
    { id: 'bbq', name: 'BBQ Sauce', price: 0.75, color: '#8B4513' },
    { id: 'white', name: 'White Sauce', price: 1, color: '#FFF8DC' },
    { id: 'pesto', name: 'Pesto Sauce', price: 1.25, color: '#228B22' }
  ],
  toppings: [
    { id: 'pepperoni', name: 'Pepperoni', price: 1.5, emoji: '🍕' },
    { id: 'mushrooms', name: 'Mushrooms', price: 1, emoji: '🍄' },
    { id: 'olives', name: 'Olives', price: 1.25, emoji: '🫒' },
    { id: 'jalapenos', name: 'Jalapeños', price: 1, emoji: '🌶️' },
    { id: 'bell-peppers', name: 'Bell Peppers', price: 0.75, emoji: '🫑' },
    { id: 'onions', name: 'Onions', price: 0.5, emoji: '🧅' },
    { id: 'cheese', name: 'Extra Cheese', price: 2, emoji: '🧀' },
    { id: 'corn', name: 'Corn', price: 0.75, emoji: '🌽' },
    { id: 'tomatoes', name: 'Tomatoes', price: 0.75, emoji: '🍅' },
    { id: 'pineapple', name: 'Pineapple', price: 1, emoji: '🍍' }
  ]
}

export default function CustomPizzaBuilder() {
  const [selectedBase, setSelectedBase] = useState(null)
  const [selectedSauce, setSelectedSauce] = useState(null)
  const [selectedToppings, setSelectedToppings] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [toppingElements, setToppingElements] = useState([])
  const [cookingEffects, setCookingEffects] = useState({
    steam: false,
    bubbles: [],
    sizzle: []
  })
  const pizzaCanvasRef = useRef(null)
  const { openWithIntent } = useChatbot()

  // Generate sauce bubbles when sauce is selected
  useEffect(() => {
    if (selectedSauce) {
      const bubbles = []
      for (let i = 0; i < 8; i++) {
        bubbles.push({
          id: `bubble-${i}`,
          x: `${20 + Math.random() * 60}%`,
          y: `${20 + Math.random() * 60}%`,
          delay: Math.random() * 3
        })
      }
      setCookingEffects(prev => ({ ...prev, bubbles }))
      
      // Trigger cooking steam
      setCookingEffects(prev => ({ ...prev, steam: true }))
      const timer = setTimeout(() => {
        setCookingEffects(prev => ({ ...prev, steam: false }))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [selectedSauce])

  // Generate sizzle effects when toppings are added
  useEffect(() => {
    if (toppingElements.length > 0) {
      const lastTopping = toppingElements[toppingElements.length - 1]
      const sizzle = {
        id: `sizzle-${Date.now()}`,
        x: `calc(50% + ${lastTopping.x}px)`,
        y: `calc(50% + ${lastTopping.y}px)`,
        delay: 0
      }
      setCookingEffects(prev => ({ ...prev, sizzle: [...prev.sizzle, sizzle] }))
      
      // Remove sizzle after animation
      setTimeout(() => {
        setCookingEffects(prev => ({ ...prev, sizzle: prev.sizzle.filter(s => s.id !== sizzle.id) }))
      }, 1000)
    }
  }, [toppingElements])

  // Calculate total price
  const calculatePrice = () => {
    let total = 8.99 // Base pizza price in USD
    if (selectedBase) total += selectedBase.price
    if (selectedSauce) total += selectedSauce.price
    selectedToppings.forEach(topping => {
      total += topping.price
    })
    return total.toFixed(2)
  }

  // Handle topping selection with animation
  const handleToppingToggle = (topping) => {
    if (selectedToppings.find(t => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter(t => t.id !== topping.id))
      removeToppingElements(topping.id)
    } else {
      setSelectedToppings([...selectedToppings, topping])
      addToppingAnimation(topping)
    }
  }

  // Add topping with falling animation
  const addToppingAnimation = (topping) => {
    const newElements = []
    const numPieces = Math.floor(Math.random() * 3) + 2 // 2-4 pieces per topping

    for (let i = 0; i < numPieces; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * 80 + 20 // Random distance from center (20-100px)
      const x = Math.cos(angle) * distance
      const y = Math.sin(angle) * distance
      const rotation = Math.random() * 360
      const scale = 0.7 + Math.random() * 0.6
      const delay = Math.random() * 0.3

      newElements.push({
        id: `${topping.id}-${Date.now()}-${i}`,
        toppingId: topping.id,
        emoji: topping.emoji,
        x,
        y,
        rotation,
        scale,
        delay
      })
    }

    setToppingElements(prev => [...prev, ...newElements])
  }

  // Remove topping elements
  const removeToppingElements = (toppingId) => {
    setToppingElements(prev => prev.filter(el => el.toppingId !== toppingId))
  }

  // Add to cart functionality
  const addToCart = () => {
    if (!selectedBase || !selectedSauce) {
      alert('Please select both a base and sauce!')
      return
    }

    const customPizza = {
      type: 'custom',
      base: selectedBase.name,
      sauce: selectedSauce.name,
      toppings: selectedToppings.map(t => t.name),
      price: calculatePrice(),
      quantity: 1
    }

    // Add to cart using existing chatbot system
    openWithIntent('add_to_cart', { item: customPizza })
    
    // Reset builder
    resetBuilder()
  }

  // Reset builder
  const resetBuilder = () => {
    setSelectedBase(null)
    setSelectedSauce(null)
    setSelectedToppings([])
    setToppingElements([])
    setCookingEffects({ steam: false, bubbles: [], sizzle: [] })
    setCurrentStep(1)
  }

  // Navigation functions
  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  return (
    <div className="min-h-screen bg-mozzarella-100 py-8 px-4 pizza-bg wood-texture">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-wood-800 mb-4">
            Custom Pizza Builder
          </h1>
          <p className="text-lg text-wood-600">
            Create your perfect pizza with our interactive builder
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pizza Preview Canvas */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="pizza-card p-8"
          >
            <h2 className="text-2xl font-display font-semibold mb-6 text-center text-wood-800">Pizza Preview</h2>
            
            <div className="relative flex justify-center items-center h-96 overflow-visible">
              <div 
                ref={pizzaCanvasRef}
                className="relative w-80 h-80 rounded-full bg-gray-100 shadow-inner"
                style={{ background: 'radial-gradient(circle, #f9f9f9, #e0e0e0)' }}
              >
                {/* Base/Crust */}
                <AnimatePresence>
                  {selectedBase && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="absolute inset-4 rounded-full shadow-lg"
                      style={{ backgroundColor: selectedBase.color }}
                    />
                  )}
                </AnimatePresence>

                {/* Sauce */}
                <AnimatePresence>
                  {selectedSauce && selectedBase && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.8 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-8 rounded-full"
                      style={{ backgroundColor: selectedSauce.color }}
                    >
                      {/* Cooking Effects - Sauce Bubbles */}
                      {cookingEffects.bubbles.map((bubble) => (
                        <SauceBubble
                          key={bubble.id}
                          x={bubble.x}
                          y={bubble.y}
                          delay={bubble.delay}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Heat Wave Effect - Always active when pizza has ingredients */}
                {(selectedBase || selectedSauce) && <HeatWave />}

                {/* Steam Effect */}
                {cookingEffects.steam && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <SteamParticle key={`steam-${i}`} delay={i * 0.3} />
                    ))}
                  </>
                )}

                {/* Sizzle Effects when toppings are added */}
                {cookingEffects.sizzle.map((sizzle) => (
                  <SizzleEffect
                    key={sizzle.id}
                    x={sizzle.x}
                    y={sizzle.y}
                    delay={sizzle.delay}
                  />
                ))}

                {/* Toppings */}
                <AnimatePresence>
                  {toppingElements.map((element) => (
                    <motion.div
                      key={element.id}
                      initial={{ 
                        y: -100,
                        x: element.x, 
                        opacity: 1,
                        rotate: 0,
                        scale: 0.5
                      }}
                      animate={{ 
                        y: element.y,
                        x: element.x, 
                        opacity: 1,
                        rotate: element.rotation,
                        scale: element.scale
                      }}
                      exit={{ 
                        y: 200, 
                        opacity: 0,
                        scale: 0
                      }}
                      transition={{ 
                        duration: 0.6,
                        delay: element.delay,
                        ease: "easeOut"
                      }}
                      className="absolute text-3xl font-bold pointer-events-none"
                      style={{
                        left: '50%',
                        top: '50%',
                        marginLeft: '-16px',
                        marginTop: '-16px',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                        zIndex: 10
                      }}
                    >
                      {element.emoji}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Price Display */}
            <div className="mt-6 text-center">
              <div className="text-3xl font-display font-bold text-tomato-600">
                ${calculatePrice()}
              </div>
              <div className="text-sm text-wood-500">Total Price</div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="pizza-card p-8"
          >
            {/* Step Indicator */}
            <div className="flex justify-between mb-8">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step < 3 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep >= step
                        ? 'bg-tomato-500 text-white'
                        : 'bg-wood-200 text-wood-500'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-colors ${
                        currentStep > step ? 'bg-tomato-500' : 'bg-wood-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Base Selection */}
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-display font-semibold mb-4 text-wood-800">Choose Your Base</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {PIZZA_CONFIG.bases.map((base) => (
                      <motion.button
                        key={base.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedBase(base)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedBase?.id === base.id
                            ? 'border-tomato-500 bg-tomato-50'
                            : 'border-wood-200 hover:border-crust-400'
                        }`}
                      >
                        <div className="font-medium text-wood-800">{base.name}</div>
                        {base.price > 0 && (
                          <div className="text-sm text-wood-500">+${base.price.toFixed(2)}</div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 2: Sauce Selection */}
            <AnimatePresence mode="wait">
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-display font-semibold mb-4 text-wood-800">Choose Your Sauce</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {PIZZA_CONFIG.sauces.map((sauce) => (
                      <motion.button
                        key={sauce.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedSauce(sauce)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedSauce?.id === sauce.id
                            ? 'border-tomato-500 bg-tomato-50'
                            : 'border-wood-200 hover:border-crust-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: sauce.color }}
                          />
                          <div>
                            <div className="font-medium text-wood-800">{sauce.name}</div>
                            {sauce.price > 0 && (
                              <div className="text-sm text-wood-500">+${sauce.price.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Toppings Selection */}
            <AnimatePresence mode="wait">
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-display font-semibold mb-4 text-wood-800">Choose Your Toppings</h3>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {PIZZA_CONFIG.toppings.map((topping) => {
                      const isSelected = selectedToppings.find(t => t.id === topping.id)
                      return (
                        <motion.button
                          key={topping.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToppingToggle(topping)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-tomato-500 bg-tomato-50'
                              : 'border-wood-200 hover:border-crust-400'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{topping.emoji}</span>
                            <div className="text-left">
                              <div className="font-medium text-sm text-wood-800">{topping.name}</div>
                              <div className="text-xs text-wood-500">+${topping.price.toFixed(2)}</div>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  currentStep === 1
                    ? 'bg-mozzarella-200 text-wood-400 cursor-not-allowed'
                    : 'bg-mozzarella-200 text-wood-700 hover:bg-crust-200'
                }`}
              >
                Previous
              </motion.button>

              {currentStep < 3 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  className="btn-tomato px-6 py-2 rounded-lg font-medium text-white transition-colors"
                >
                  Next
                </motion.button>
              ) : (
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetBuilder}
                    className="px-6 py-2 bg-mozzarella-200 text-wood-700 rounded-lg font-medium hover:bg-crust-200 transition-colors"
                  >
                    Reset
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addToCart}
                    className="btn-basil px-6 py-2 rounded-lg font-medium text-white transition-colors"
                  >
                    Add to Cart
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
