import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { resolveAssetUrl } from '../utils/env'

export default function PizzaGallery() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const navigate = useNavigate()
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenuData()
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
    <section ref={ref} id="gallery" className="py-24 lg:py-32 relative overflow-hidden bg-[#FAFAF8] section-grain">
      <div className="absolute inset-0 gold-glow-bg" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`bg-[#F5F3EF] rounded-xl overflow-hidden border border-white flex flex-col relative ${i === 0 ? 'aspect-[3/4] md:row-span-2' : 'aspect-square'}`}>
                {/* Image Skeleton */}
                <div className="absolute inset-0 bg-[#E8E3DB] animate-pulse" />

                {/* Content Skeleton Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10 bg-gradient-to-t from-black/20 to-transparent">
                  <div className="w-1/3 h-3 bg-white/40 rounded animate-pulse mb-3" />
                  <div className="w-2/3 h-6 bg-white/60 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : (
            menuItems.slice(0, 4).map((item, index) => (
              <MenuCard
                key={item._id}
                image={item.image ? resolveAssetUrl(item.image) : '/pizza-hero-poster.svg'}
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
      initial={{ opacity: 0, y: 18 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.04 * index, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`group cursor-pointer relative overflow-hidden rounded-3xl shadow-sm hover:shadow-md transition-all ${!available ? 'opacity-40' : ''}`}
      onClick={onOrder}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-3xl aspect-[4/4.2] md:aspect-[4/4.1]">
        {/* Image */}
        <motion.img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover img-noir will-change-transform"
          animate={{ scale: isHovered ? 1.03 : 1 }}
          transition={{ duration: 0.35 }}
          onError={() => setImgSrc('/pizza-hero-poster.svg')}
        />

        {/* Dark overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Price — top-right */}
        <div className="absolute top-3 right-3 z-10">
          <span className="font-mono text-[10px] sm:text-[11px] tracking-wider text-white bg-black/40 px-2 py-1 backdrop-blur-sm rounded-md">
            ${price?.toFixed(2)}
          </span>
        </div>

        {/* Tags */}
        {dietary?.spicy && (
          <div className="absolute top-3 left-3 z-10">
            <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-white bg-ember-500/80 px-2 py-1 backdrop-blur-sm rounded-md">
              Spicy
            </span>
          </div>
        )}
        {dietary?.vegetarian && (
          <div className="absolute top-3 left-3 z-10">
            <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-white bg-[#D4922A]/80 px-2 py-1 backdrop-blur-sm rounded-md">
              Vegetarian
            </span>
          </div>
        )}

        {/* Dish name — slides up on hover */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {category && (
            <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-ember-200 block mb-2">
              {category}
            </span>
          )}
          <h3 className="font-display text-base lg:text-lg text-white mb-1 leading-tight not-italic">{name}</h3>
          {description && (
            <p className="text-white/70 text-[10px] lg:text-[11px] line-clamp-2 max-w-sm">{description}</p>
          )}

          <motion.button
            className="mt-3 w-9 h-9 border border-white/30 flex items-center justify-center text-white bg-black/20 backdrop-blur-sm hover:bg-ember-500 hover:border-ember-500 hover:shadow-lg hover:shadow-ember-500/30 transition-all rounded-lg"
            onClick={(e) => { e.stopPropagation(); onOrder(); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Resting state name */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10 bg-gradient-to-t from-black/50 to-transparent"
          animate={{ opacity: isHovered ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="font-display text-sm lg:text-base text-white leading-tight not-italic">{name}</h3>
        </motion.div>
      </div>
    </motion.div>
  )
}
