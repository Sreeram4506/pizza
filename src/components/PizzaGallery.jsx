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
    <section ref={ref} id="gallery" className="py-24 lg:py-40 relative overflow-hidden bg-[#FAFAF8]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        {/* Section Header */}
        <div
           className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8"
        >
          <div className="max-w-3xl">
            <motion.span variants={itemVariants} className="block mb-4 text-[#8A7A62] text-[11px] font-black tracking-[0.2em] uppercase">
              {t('gallery.titleLabel')}
            </motion.span>
            <motion.h2 variants={itemVariants} className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1A1410] leading-tight tracking-tight">
              {t('gallery.title')}
            </motion.h2>
          </div>
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/menu')}
            className="self-start lg:self-auto bg-white border border-[#EBEBE6] rounded-full px-8 py-4 text-[#1A1410] text-[11px] font-black tracking-[0.15em] uppercase inline-flex items-center gap-2 group shadow-sm hover:shadow-md hover:border-[#1A1410] transition-all"
          >
            {t('gallery.viewFullMenu')}
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.button>
        </div>

        <div 
          className="w-full h-px bg-[#EBEBE6] mb-16 origin-left" 
        />

        {/* Menu Grid */}
        <div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8"
        >
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#EBEBE6] rounded-2xl overflow-hidden flex flex-col relative aspect-[4/5]" />
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
        </div>

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
      className={`group cursor-pointer relative overflow-hidden bg-white border border-[#EBEBE6] rounded-2xl hover:shadow-xl transition-all ${!available ? 'opacity-40' : ''}`}
      onClick={onOrder}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden aspect-[4/5] bg-[#F5F5F0]">
        {/* Image */}
        <motion.img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover img-noir"
          animate={{ scale: isHovered ? 1.08 : 1 }}
          transition={{ duration: 0.8 }}
          onError={() => setImgSrc(image)}
        />

        <motion.div
          className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none"
        />

        {/* Content Box (moved below image instead of overlaying to match menu) */}
      </div>
      <div className="p-4 sm:p-5 flex flex-col">
          <span className="font-sans text-[9px] font-black tracking-[0.2em] uppercase text-[#8A7A62] mb-1.5 block">
            {category || 'Specials'}
          </span>
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-[#1A1410] text-[16px] sm:text-[18px] uppercase tracking-tight leading-tight group-hover:text-ember-700 transition-colors">
              {name}
            </h3>
            <span className="font-black text-[#1A1410] text-[15px] sm:text-[16px] shrink-0">
              ${price?.toFixed(2)}
            </span>
          </div>
          {dietary?.spicy && (
            <span className="w-2 h-2 rounded-full bg-ember-600 mt-1" />
          )}
      </div>
    </motion.div>
  )
}
