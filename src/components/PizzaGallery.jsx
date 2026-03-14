import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useChatbot } from '../context/ChatbotContext'
import { useNavigate } from 'react-router-dom'
import wsService from '../services/websocket.js'

export default function PizzaGallery() {
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

  return (
    <section ref={ref} id="gallery" className="py-16 lg:py-32 relative overflow-hidden bg-[#FAFAF8] section-grain">
      <div className="absolute inset-0 gold-glow-bg" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8"
        >
          <div>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 block mb-4">
              Our Menu
            </span>
            <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-[#1A1410] tracking-tight italic">
              Handcrafted with Fire
            </h2>
          </div>
        </motion.div>

        <div className="divider-gold mb-12" />

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#F5F3EF] rounded-xl overflow-hidden border border-white flex flex-col relative aspect-square">
                {/* Image Skeleton */}
                <div className="absolute inset-0 bg-[#E8E3DB] animate-pulse" />

                {/* Content Skeleton Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-gradient-to-t from-black/20 to-transparent">
                  <div className="w-2/3 h-4 bg-white/60 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : (
            menuItems.slice(0, 8).map((item, index) => (
              <MenuCard
                key={item._id}
                image={item.image ? (item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || ''}${item.image}`) : 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?w=600&q=80'}
                name={item.name}
                price={item.price}
                description={item.description}
                category={getCategoryName(item.categoryId)}
                available={item.available}
                dietary={item.dietary}
                index={index}
                isInView={isInView}
                onOrder={() => navigate('/menu')}
              />
            ))
          )}
        </div>

        {/* View Full Menu */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/menu')}
            className="group text-[#1A1410] text-sm font-body font-medium tracking-[0.15em] uppercase inline-flex items-center gap-3 transition-colors hover:text-ember-500"
          >
            View Full Menu
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

function MenuCard({ image, name, price, description, category, available, dietary, index, isInView, onOrder }) {
  const [isHovered, setIsHovered] = useState(false)
  const [imgSrc, setImgSrc] = useState(image)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.05 * index, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`group cursor-pointer relative overflow-hidden rounded-xl shadow-sm hover:shadow-card-hover transition-all ${!available ? 'opacity-40' : ''}`}
      onClick={onOrder}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden aspect-square">
        {/* Image */}
        <motion.img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover img-noir"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.6 }}
          onError={() => setImgSrc('https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?w=600&q=80')}
        />

        {/* Dark overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Price — top-right */}
        <div className="absolute top-2 right-2 z-10">
          <span className="font-mono text-[10px] sm:text-xs tracking-wider text-white bg-black/40 px-2 py-1 backdrop-blur-sm rounded-md">
            ${price?.toFixed(2)}
          </span>
        </div>

        {/* Tags */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {dietary?.spicy && (
            <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-white bg-ember-500/80 px-1.5 py-0.5 backdrop-blur-sm rounded-sm">
              Spicy
            </span>
          )}
          {dietary?.vegetarian && (
            <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-white bg-[#D4922A]/80 px-1.5 py-0.5 backdrop-blur-sm rounded-sm">
              Veg
            </span>
          )}
        </div>

        {/* Quick Info — slides up on hover */}
        <motion.div
          className="absolute inset-x-0 bottom-0 p-3 sm:p-4 z-10 flex flex-col justify-end"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
               <h3 className="font-display text-sm sm:text-base italic text-white truncate">{name}</h3>
               {category && (
                <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-ember-300 block">
                  {category}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Resting state name */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-3 z-10 bg-gradient-to-t from-black/60 to-transparent"
          animate={{ opacity: isHovered ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="font-display text-xs sm:text-sm italic text-white truncate">{name}</h3>
        </motion.div>
      </div>
    </motion.div>
  )
}
