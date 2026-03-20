import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import { useTranslation } from 'react-i18next'

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
    { id: 'pepperoni', nameKey: 'builder.config.toppings.pepperoni', price: 1.5, category: 'Meat' },
    { id: 'mushrooms', nameKey: 'builder.config.toppings.mushrooms', price: 1, category: 'Veggie' },
    { id: 'olives', nameKey: 'builder.config.toppings.olives', price: 1.25, category: 'Veggie' },
    { id: 'jalapenos', nameKey: 'builder.config.toppings.jalapenos', price: 1, category: 'Spicy' },
    { id: 'bell-peppers', nameKey: 'builder.config.toppings.bell-peppers', price: 0.75, category: 'Veggie' },
    { id: 'onions', nameKey: 'builder.config.toppings.onions', price: 0.5, category: 'Veggie' },
    { id: 'cheese', nameKey: 'builder.config.toppings.cheese', price: 2, category: 'Cheese' },
    { id: 'corn', nameKey: 'builder.config.toppings.corn', price: 0.75, category: 'Veggie' },
    { id: 'tomatoes', nameKey: 'builder.config.toppings.tomatoes', price: 0.75, category: 'Veggie' },
    { id: 'pineapple', nameKey: 'builder.config.toppings.pineapple', price: 1, category: 'Sweet' },
  ],
}

const PREVIEW_POSITIONS = [
  { x: 18, y: 20 },
  { x: 72, y: 18 },
  { x: 82, y: 52 },
  { x: 64, y: 78 },
  { x: 34, y: 80 },
  { x: 18, y: 56 },
  { x: 46, y: 36 },
  { x: 58, y: 58 },
  { x: 32, y: 34 },
  { x: 74, y: 70 },
  { x: 50, y: 18 },
  { x: 52, y: 84 },
]

export default function CustomPizzaBuilder() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const { openWithIntent } = useChatbot()
  const pizzaConfig = settings?.atelierConfig || DEFAULT_PIZZA_CONFIG

  const [selectedBase, setSelectedBase] = useState(null)
  const [selectedSauce, setSelectedSauce] = useState(null)
  const [selectedToppings, setSelectedToppings] = useState([])
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    { id: 1, label: '01', title: t('builder.steps.foundation.title'), subtitle: t('builder.steps.foundation.subtitle') },
    { id: 2, label: '02', title: t('builder.steps.canvas.title'), subtitle: t('builder.steps.canvas.subtitle') },
    { id: 3, label: '03', title: t('builder.steps.artistry.title'), subtitle: t('builder.steps.artistry.subtitle') },
    { id: 4, label: '04', title: t('builder.yourCreation'), subtitle: t('builder.total') },
  ]

  const itemName = (item) => item?.nameKey ? t(item.nameKey) : item?.name
  const itemDesc = (item) => item?.descKey ? t(item.descKey) : item?.desc

  const calculatePrice = () => {
    let total = 8.99
    if (selectedBase) total += selectedBase.price
    if (selectedSauce) total += selectedSauce.price
    selectedToppings.forEach((topping) => { total += topping.price })
    return Number(total.toFixed(2))
  }

  const toggleTopping = (topping) => {
    setSelectedToppings((current) =>
      current.find((item) => item.id === topping.id)
        ? current.filter((item) => item.id !== topping.id)
        : [...current, topping]
    )
  }

  const resetBuilder = () => {
    setSelectedBase(null)
    setSelectedSauce(null)
    setSelectedToppings([])
    setCurrentStep(1)
  }

  const customPizza = {
    base: selectedBase,
    sauce: selectedSauce,
    toppings: selectedToppings,
    price: calculatePrice(),
    name: `${t('builder.yourCreation')} (${selectedBase ? itemName(selectedBase) : 'Classic'})`
  }

  const addToCartInternal = () => {
    openWithIntent('add_to_cart', { item: customPizza })
    toast.success('Custom pizza added to cart!')
  }

  const checkoutNow = () => {
    openWithIntent('checkout', { item: customPizza })
  }

  const canContinue = () => {
    if (currentStep === 1) return !!selectedBase
    if (currentStep === 2) return !!selectedSauce
    return true
  }

  const nextStep = () => {
    if (!canContinue()) return
    setCurrentStep((step) => Math.min(step + 1, steps.length))
  }

  const prevStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 1))
  }

  const toppingGroups = Object.entries(
    pizzaConfig.toppings.reduce((accumulator, topping) => {
      const key = topping.category || 'Other'
      if (!accumulator[key]) accumulator[key] = []
      accumulator[key].push(topping)
      return accumulator
    }, {})
  )

  const getToppingToken = (topping) => {
    const name = itemName(topping) || ''
    const words = name.split(' ').filter(Boolean)
    const initials = words.slice(0, 2).map((word) => word[0]).join('')
    return (initials || name.slice(0, 2) || 'T').toUpperCase()
  }

  const getToppingTone = (topping) => {
    switch ((topping.category || '').toLowerCase()) {
      case 'meat':
        return 'bg-[#7A3A2E] text-white'
      case 'veggie':
        return 'bg-[#516F43] text-white'
      case 'spicy':
        return 'bg-[#B64224] text-white'
      case 'cheese':
        return 'bg-[#D8A637] text-white'
      case 'sweet':
        return 'bg-[#A8644B] text-white'
      default:
        return 'bg-[#8A7A62] text-white'
    }
  }

  return (
    <section id="atelier" className="min-h-screen py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="grain-overlay" />
      <div className="absolute inset-0 ember-glow-bg" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-16 sm:pt-24 pb-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="section-eyebrow block mb-4">{t('builder.titleLabel')}</span>
          <h2 className="section-title">{t('builder.title')}</h2>
          <p className="section-copy max-w-3xl mx-auto mt-4">{t('builder.subtitle')}</p>
        </motion.div>

        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center shrink-0">
              <button
                onClick={() => {
                  if (step.id <= currentStep) setCurrentStep(step.id)
                }}
                className={`relative flex items-center gap-3 px-3 sm:px-5 py-3 transition-all ${currentStep === step.id ? 'text-[#1A1410]' : currentStep > step.id ? 'text-ember-600' : 'text-[#9B8D74]/50'}`}
              >
                <span className="font-mono text-sm sm:text-base">{currentStep > step.id ? 'OK' : step.label}</span>
                <div className="hidden sm:block text-left">
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase">{step.title}</div>
                  <div className="font-body text-xs opacity-70">{step.subtitle}</div>
                </div>
                {currentStep === step.id && (
                  <motion.div
                    layoutId="builder-step"
                    className="absolute left-0 right-0 bottom-0 h-px bg-ember-500"
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  />
                )}
              </button>
              {index < steps.length - 1 && (
                <div className={`w-4 sm:w-10 h-px mx-1 sm:mx-2 ${currentStep > step.id ? 'bg-ember-500/40' : 'bg-[rgba(26,20,16,0.08)]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[0.95fr,1.05fr] gap-12 lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="order-1"
          >
            <div className="glass-card glass-highlight-ring p-8 sm:p-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ember-600 block mb-2">
                    {t('builder.canvasLabel')}
                  </span>
                  <h3 className="font-serif-1947 text-3xl italic text-[#1A1410]">
                    {selectedBase ? customPizza.name : t('builder.canvasSubtitle')}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#9B8D74] block">
                    {t('builder.total')}
                  </span>
                  <span className="font-mono text-4xl text-ember-500 tracking-tight">
                    ${calculatePrice().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="relative mx-auto w-64 h-64 sm:w-80 sm:h-80 lg:w-[24rem] lg:h-[24rem] rounded-full bg-[radial-gradient(circle,rgba(26,20,16,0.04),rgba(245,243,239,0.6))] border border-[rgba(26,20,16,0.08)]">
                {selectedBase ? (
                  <>
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, ${selectedBase.color}f0, ${selectedBase.color}9a)`,
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.18)'
                      }}
                    />
                    {selectedSauce && (
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.88 }}
                        className="absolute inset-[12%] rounded-full"
                        style={{
                          background: `radial-gradient(circle at 40% 40%, ${selectedSauce.color}dd, ${selectedSauce.color}88)`,
                          boxShadow: 'inset 0 0 18px rgba(0,0,0,0.18)'
                        }}
                      />
                    )}
                    {selectedToppings.map((topping, index) => {
                      const position = PREVIEW_POSITIONS[index % PREVIEW_POSITIONS.length]
                      return (
                        <motion.span
                          key={topping.id}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black tracking-[0.08em] shadow-lg ${getToppingTone(topping)}`}
                          style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}
                        >
                          {getToppingToken(topping)}
                        </motion.span>
                      )
                    })}
                    {!selectedSauce && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="glass-pill px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1410]/65">
                          {t('builder.steps.canvas.subtitle')}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                    <span className="font-serif-1947 italic text-3xl text-[#1A1410]/35">{t('builder.canvasLabel')}</span>
                    <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#9B8D74] mt-2">
                      {t('builder.canvasSubtitle')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#9B8D74] block mb-3">
                    {t('builder.yourCreation')}
                  </span>
                  <div className="space-y-3">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-[#5C554E]">{selectedBase ? itemName(selectedBase) : t('builder.steps.foundation.subtitle')}</span>
                      <span className="font-mono text-[#1A1410]">{selectedBase ? (selectedBase.price > 0 ? `+$${selectedBase.price.toFixed(2)}` : t('builder.included')) : '-'}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-[#5C554E]">{selectedSauce ? itemName(selectedSauce) : t('builder.steps.canvas.subtitle')}</span>
                      <span className="font-mono text-[#1A1410]">{selectedSauce ? (selectedSauce.price > 0 ? `+$${selectedSauce.price.toFixed(2)}` : t('builder.included')) : '-'}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-[#5C554E]">{selectedToppings.length ? t('builder.toppingsCount', { count: selectedToppings.length }) : t('builder.steps.artistry.subtitle')}</span>
                      <span className="font-mono text-[#1A1410]">{selectedToppings.length ? `$${selectedToppings.reduce((sum, topping) => sum + topping.price, 0).toFixed(2)}` : '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-5">
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#9B8D74] block mb-3">
                    Selected Toppings
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedToppings.length ? selectedToppings.map((topping) => (
                      <span
                        key={topping.id}
                        className={`px-3 py-2 rounded-full text-[11px] font-black tracking-[0.08em] ${getToppingTone(topping)}`}
                      >
                        {getToppingToken(topping)} {itemName(topping)}
                      </span>
                    )) : (
                      <span className="text-sm text-[#9B8D74]">Add toppings to customize the finish.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="order-2"
          >
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="base"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  className="glass-card glass-highlight-ring p-8 sm:p-10"
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-3">Step 01</span>
                  <h3 className="font-serif-1947 italic text-4xl text-[#1A1410] mb-3">{t('builder.foundation.title')}</h3>
                  <p className="text-[#7A7068] text-sm mb-8">{t('builder.foundation.p')}</p>

                  <div className="space-y-4">
                    {pizzaConfig.bases.map((base) => (
                      <button
                        key={base.id}
                        onClick={() => setSelectedBase(base)}
                        className={`w-full flex items-center gap-5 p-5 border text-left transition-all rounded-2xl ${selectedBase?.id === base.id
                          ? 'border-ember-500/40 bg-ember-500/5 shadow-ember'
                          : 'border-[rgba(26,20,16,0.08)] bg-white hover:border-[rgba(193,68,14,0.18)]'
                          }`}
                      >
                        <div
                          className="w-12 h-12 rounded-full shrink-0"
                          style={{ background: `radial-gradient(circle at 35% 35%, ${base.color}f0, ${base.color}9a)` }}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-[#1A1410]">{itemName(base)}</div>
                          <div className="text-sm text-[#7A7068]">{itemDesc(base)}</div>
                        </div>
                        <div className="font-mono text-sm text-ember-600">
                          {base.price > 0 ? `+$${base.price.toFixed(2)}` : t('builder.included')}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="sauce"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  className="glass-card glass-highlight-ring p-8 sm:p-10"
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-3">Step 02</span>
                  <h3 className="font-serif-1947 italic text-4xl text-[#1A1410] mb-3">{t('builder.palette.title')}</h3>
                  <p className="text-[#7A7068] text-sm mb-8">{t('builder.palette.p')}</p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {pizzaConfig.sauces.map((sauce) => (
                      <button
                        key={sauce.id}
                        onClick={() => setSelectedSauce(sauce)}
                        className={`relative overflow-hidden p-5 border text-left transition-all rounded-2xl ${selectedSauce?.id === sauce.id
                          ? 'border-ember-500/40 bg-ember-500/5 shadow-ember'
                          : 'border-[rgba(26,20,16,0.08)] bg-white hover:border-[rgba(193,68,14,0.18)]'
                          }`}
                      >
                        <div className="absolute left-0 right-0 top-0 h-1" style={{ background: sauce.color }} />
                        <div className="w-8 h-8 rounded-full mb-4" style={{ background: sauce.color }} />
                        <div className="font-semibold text-[#1A1410]">{itemName(sauce)}</div>
                        <div className="text-sm text-[#7A7068] mt-1">{itemDesc(sauce)}</div>
                        <div className="font-mono text-sm text-ember-600 mt-4">
                          {sauce.price > 0 ? `+$${sauce.price.toFixed(2)}` : t('builder.included')}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="toppings"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  className="glass-card glass-highlight-ring p-8 sm:p-10"
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-3">Step 03</span>
                  <h3 className="font-serif-1947 italic text-4xl text-[#1A1410] mb-3">{t('builder.artistry.title')}</h3>
                  <p className="text-[#7A7068] text-sm mb-8">{t('builder.artistry.p')}</p>

                  <div className="space-y-8 max-h-[460px] overflow-y-auto pr-2 scroll-smooth-ios">
                    {toppingGroups.map(([category, toppings]) => (
                      <div key={category}>
                        <h4 className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B8D74] pb-3 border-b border-[rgba(26,20,16,0.08)] mb-4">
                          {t(`builder.config.categories.${category.toLowerCase()}`, category)}
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {toppings.map((topping) => {
                            const isSelected = selectedToppings.some((item) => item.id === topping.id)
                            return (
                              <button
                                key={topping.id}
                                onClick={() => toggleTopping(topping)}
                                className={`flex items-center gap-3 p-4 border text-left transition-all rounded-2xl ${isSelected
                                  ? 'border-ember-500/40 bg-ember-500/8'
                                  : 'border-[rgba(26,20,16,0.08)] bg-white hover:border-[rgba(193,68,14,0.18)]'
                                  }`}
                              >
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black tracking-[0.08em] ${getToppingTone(topping)}`}>
                                  {getToppingToken(topping)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-[#1A1410] truncate">{itemName(topping)}</div>
                                  <div className="font-mono text-[10px] text-ember-600">+${topping.price.toFixed(2)}</div>
                                </div>
                                {isSelected && (
                                  <span className="w-5 h-5 rounded-full bg-ember-500 text-white flex items-center justify-center text-[10px] font-black">
                                    +
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  className="glass-card glass-highlight-ring p-8 sm:p-10"
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-3">Step 04</span>
                  <h3 className="font-serif-1947 italic text-4xl text-[#1A1410] mb-3">{t('builder.yourCreation')}</h3>
                  <p className="text-[#7A7068] text-sm mb-8">Review your selections, confirm the total, and send the pizza to checkout when you are ready.</p>

                  <div className="space-y-4">
                    <div className="glass-card p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#9B8D74] mb-2">Base</p>
                        <p className="text-[#1A1410] font-semibold">{selectedBase ? itemName(selectedBase) : '-'}</p>
                      </div>
                      <span className="font-mono text-sm text-ember-600">
                        {selectedBase ? (selectedBase.price > 0 ? `+$${selectedBase.price.toFixed(2)}` : t('builder.included')) : '-'}
                      </span>
                    </div>

                    <div className="glass-card p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#9B8D74] mb-2">Sauce</p>
                        <p className="text-[#1A1410] font-semibold">{selectedSauce ? itemName(selectedSauce) : '-'}</p>
                      </div>
                      <span className="font-mono text-sm text-ember-600">
                        {selectedSauce ? (selectedSauce.price > 0 ? `+$${selectedSauce.price.toFixed(2)}` : t('builder.included')) : '-'}
                      </span>
                    </div>

                    <div className="glass-card p-5">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#9B8D74] mb-2">Toppings</p>
                          <p className="text-[#1A1410] font-semibold">{selectedToppings.length ? t('builder.toppingsCount', { count: selectedToppings.length }) : 'No extra toppings'}</p>
                        </div>
                        <span className="font-mono text-sm text-ember-600">
                          ${selectedToppings.reduce((sum, topping) => sum + topping.price, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedToppings.map((topping) => (
                          <span
                            key={topping.id}
                            className={`px-3 py-2 rounded-full text-[11px] font-black tracking-[0.08em] ${getToppingTone(topping)}`}
                          >
                            {getToppingToken(topping)} {itemName(topping)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card p-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#9B8D74] mb-2">{t('builder.total')}</p>
                        <p className="text-[#1A1410] text-sm">Ready for cart or checkout.</p>
                      </div>
                      <span className="font-mono text-4xl tracking-tight text-ember-500">
                        ${calculatePrice().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6"
            >
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 font-mono text-xs tracking-[0.15em] uppercase transition-all ${currentStep === 1 ? 'text-[#1A1410]/20 cursor-not-allowed hidden sm:flex' : 'text-[#9B8D74] hover:text-[#1A1410]'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                {t('builder.actions.prev')}
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={!canContinue()}
                    className={`w-full sm:w-auto px-8 py-4 bg-ember-500 text-white font-body font-semibold text-sm tracking-[0.15em] uppercase hover:shadow-ember transition-all flex items-center justify-center gap-2 rounded-xl ${!canContinue() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {t('builder.actions.next')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={resetBuilder}
                      className="w-full sm:w-auto px-6 py-4 border border-[rgba(26,20,16,0.1)] text-[#9B8D74] font-body text-sm tracking-[0.1em] uppercase hover:text-[#1A1410] transition-all rounded-xl"
                    >
                      {t('builder.actions.reset')}
                    </button>
                    <button
                      onClick={addToCartInternal}
                      className="w-full sm:w-auto px-6 py-4 border border-gold-400/30 text-gold-400 font-body font-semibold text-sm tracking-[0.1em] uppercase hover:bg-gold-400/10 transition-all rounded-xl"
                    >
                      {t('builder.actions.add')}
                    </button>
                    <button
                      onClick={checkoutNow}
                      className="w-full sm:w-auto px-8 py-4 bg-ember-500 text-white font-body font-semibold text-sm tracking-[0.15em] uppercase hover:shadow-ember transition-all flex items-center justify-center gap-2 rounded-xl"
                    >
                      {t('builder.actions.order')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
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
        </div>
      </div>
    </section>
  )
}
