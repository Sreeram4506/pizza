import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useChatbot } from '../context/ChatbotContext'
import { useNavigate } from 'react-router-dom'
import wsService from '../services/websocket.js'
import { useTranslation } from 'react-i18next'
import { resolveMenuItemImage } from '../utils/menuArtwork'

export default function PizzaGallery() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const navigate = useNavigate()
  const { openWithIntent } = useChatbot()
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenuData()
    wsService.connect()
    wsService.on('menu_updated', () => fetchMenuData(true))
    wsService.on('item_added', () => fetchMenuData(true))
    wsService.on('item_updated', () => fetchMenuData(true))
    wsService.on('item_removed', () => fetchMenuData(true))
    return () => wsService.disconnect()
  }, [])

  const fetchMenuData = async () => {
    setLoading(true)
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        fetch('/api/menu/categories'),
        fetch('/api/menu/items')
      ])
      if (categoriesRes.ok) setCategories(await categoriesRes.json())
      if (itemsRes.ok) setMenuItems(await itemsRes.json())
    } catch (err) {
      console.error('PizzaGallery: Failed to fetch menu data:', err)
    } finally {
      setLoading(false)
    }
  }


  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId)
    return category ? category.name : ''
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <section ref={ref} id="gallery" className="py-24 lg:py-40 relative overflow-hidden section-grain glass-shell">
      <div className="absolute inset-0 gold-glow-bg opacity-40" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* Section Header */}
        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate={isInView ? "visible" : "hidden"}
           className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8"
        >
          <div className="max-w-3xl">
            <motion.span variants={itemVariants} className="section-eyebrow block mb-4">
              {t('gallery.titleLabel')}
            </motion.span>
            <motion.h2 variants={itemVariants} className="section-title">
              {t('gallery.title')}
            </motion.h2>
          </div>
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/menu')}
            className="self-start lg:self-auto glass-button-light px-8 py-4 rounded-full text-[#1A1410] text-[11px] font-black tracking-[0.15em] uppercase inline-flex items-center gap-2 group"
          >
            {t('gallery.viewFullMenu')}
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.button>
        </motion.div>

        <motion.div 
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, ease: "circOut" }}
          className="section-rule mb-16 origin-left" 
        />

        {/* Menu Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8"
        >
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card overflow-hidden flex flex-col relative aspect-[4/5] animate-pulse bg-[#E8E3DB]/30" />
            ))
          ) : (
            menuItems.slice(0, 8).map((item, index) => (
              <MenuCard
                key={item._id}
                image={resolveMenuItemImage(item)}
                name={item.name}
                price={item.price}
                description={item.description}
                category={getCategoryName(item.categoryId)}
                available={item.available}
                dietary={item.dietary}
                index={index}
                animateIn={true}
                onOrder={() => navigate('/menu')}
              />
            ))
          )}
        </motion.div>

      </div>
    </section>
  )
}

function MenuCard({ image, name, price, description, category, available, dietary, index, animateIn, onOrder }) {
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const [imgSrc, setImgSrc] = useState(image)

  useEffect(() => {
    setImgSrc(image)
  }, [image])

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
      }}
      className={`group cursor-pointer relative overflow-hidden glass-card glass-highlight-ring hover:shadow-2xl transition-all ${!available ? 'opacity-40' : ''}`}
      onClick={onOrder}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden aspect-[4/5]">
        {/* Image */}
        <motion.img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover img-noir"
          animate={{ scale: isHovered ? 1.08 : 1 }}
          transition={{ duration: 0.8 }}
          onError={() => setImgSrc(image)}
        />

        {/* Subtle glass overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: isHovered ? 0.8 : 0.4 }}
        />

        {/* Content */}
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
           <motion.div
             animate={{ y: isHovered ? 0 : 5 }}
             transition={{ duration: 0.3 }}
           >
             <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ember-400 mb-1 block">
               {category || 'Specials'}
             </span>
             <h3 className="font-serif-1947 text-lg sm:text-xl lg:text-2xl italic text-white leading-tight mb-2">
               {name}
             </h3>
             <div className="flex items-center justify-between">
               <span className="font-mono text-xs sm:text-sm text-white/90">
                 ${price?.toFixed(2)}
               </span>
               {dietary?.spicy && (
                 <span className="w-2 h-2 rounded-full bg-ember-500 shadow-[0_0_8px_rgba(193,68,14,0.8)]" />
               )}
             </div>
           </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
