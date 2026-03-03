import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useChatbot } from '../context/ChatbotContext'
import wsService from '../services/websocket.js'

export default function PizzaGallery() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const { openWithIntent } = useChatbot()
  const [activeCategory, setActiveCategory] = useState('All')
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  useEffect(() => {
    fetchMenuData()

    // Connect to WebSocket for real-time updates
    wsService.connect()

    // Listen for menu updates
    wsService.on('menu_updated', (data) => {
      console.log('PizzaGallery: Menu updated via WebSocket:', data)
      fetchMenuData(true) // Force refresh
    })

    wsService.on('item_added', (data) => {
      console.log('PizzaGallery: Item added via WebSocket:', data)
      fetchMenuData(true)
    })

    wsService.on('item_updated', (data) => {
      console.log('PizzaGallery: Item updated via WebSocket:', data)
      fetchMenuData(true)
    })

    wsService.on('item_removed', (data) => {
      console.log('PizzaGallery: Item removed via WebSocket:', data)
      fetchMenuData(true)
    })

    return () => {
      wsService.disconnect()
    }
  }, [])

  const fetchMenuData = async (forceRefresh = false) => {
    console.log('PizzaGallery: Fetching menu data...')
    setLoading(true)
    try {
      // Fetch categories
      const categoriesRes = await fetch('/api/menu/categories')
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      } else {
        console.error('PizzaGallery: Failed to fetch categories:', categoriesRes.status)
      }

      // Fetch menu items
      const itemsRes = await fetch('/api/menu/items')
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json()
        setMenuItems(itemsData)
      } else {
        console.error('PizzaGallery: Failed to fetch items:', itemsRes.status)
      }

      setLastRefresh(Date.now())
    } catch (err) {
      console.error('PizzaGallery: Failed to fetch menu data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(item => {
      const category = categories.find(cat => cat._id === item.categoryId)
      return category && (
        (activeCategory === 'Classic' && category.name.toLowerCase().includes('classic')) ||
        (activeCategory === 'Meat' && category.name.toLowerCase().includes('meat')) ||
        (activeCategory === 'Veggie' && category.name.toLowerCase().includes('veg')) ||
        (activeCategory === 'Spicy' && category.name.toLowerCase().includes('spicy')) ||
        (activeCategory === 'Gourmet' && category.name.toLowerCase().includes('gourmet'))
      )
    })

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId)
    return category ? category.name : 'Uncategorized'
  }

  return (
    <section ref={ref} id="gallery" className="py-24 relative overflow-hidden bg-mozzarella-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 pizza-bg opacity-30" />

      {/* Decorative Elements */}
      <motion.div
        className="absolute top-40 left-10 opacity-10 hidden xl:block"
        animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-8xl">🍅</span>
      </motion.div>
      <motion.div
        className="absolute bottom-40 right-10 opacity-10 hidden xl:block"
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <span className="text-8xl">🧀</span>
      </motion.div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 bg-tomato-100 rounded-full mb-6"
          >
            <span className="text-2xl">🍕</span>
            <span className="text-tomato-700 text-sm font-semibold tracking-wide">Our Menu</span>
            <button
              onClick={() => fetchMenuData(true)}
              className="ml-4 p-2 bg-tomato-600 text-white rounded-full hover:bg-tomato-700 transition-colors"
              title="Refresh menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v2M1 7h2a1 1 0 011 0v2a1 1 0 011-2H1a1 1 0 01-1V5a1 1 0 01-1z" />
              </svg>
            </button>
          </motion.div>

          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-wood-800 mt-4 mb-6 tracking-tight">
            Handcrafted with <span className="text-tomato-600">Love</span>
          </h2>
          <p className="text-wood-500 text-lg max-w-2xl mx-auto">
            Each pizza is a masterpiece, topped with the freshest ingredients and baked to perfection in our wood-fired oven.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          <motion.button
            onClick={() => setActiveCategory('All')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${activeCategory === 'All'
                ? 'bg-tomato-600 text-white shadow-lg'
                : 'bg-mozzarella-200 text-wood-600 hover:bg-mozzarella-300 border border-tomato-200'
              }`}
          >
            All ({menuItems.length})
          </motion.button>
          {categories.map((category) => (
            <motion.button
              key={category._id}
              onClick={() => setActiveCategory(category.name)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${activeCategory === category.name
                  ? 'bg-tomato-600 text-white shadow-lg'
                  : 'bg-mozzarella-200 text-wood-600 hover:bg-mozzarella-300 border border-tomato-200'
                }`}
            >
              {category.name} ({menuItems.filter(item => item.categoryId === category._id).length})
            </motion.button>
          ))}
        </motion.div>

        {/* Pizza Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-mozzarella-200 rounded-3xl overflow-hidden shadow-lg border border-basil-200">
                <div className="aspect-square bg-gray-200 animate-pulse"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))
          ) : (
            filteredItems.map((item, index) => (
              <PizzaCard
                key={item._id}
                image={item.image ? `${import.meta.env.VITE_API_URL || ''}${item.image}` : 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?w=500'}
                name={item.name}
                price={item.price}
                description={item.description}
                category={getCategoryName(item.categoryId)}
                available={item.available}
                dietary={item.dietary}
                index={index}
                isInView={isInView}
                onOrder={() => openWithIntent('order', { item: item.name })}
              />
            ))
          )}
        </div>

        {/* View Full Menu Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <motion.button
            onClick={() => openWithIntent('menu')}
            className="px-8 py-4 bg-tomato-600 text-white font-semibold rounded-full hover:bg-tomato-700 transition-all shadow-lg inline-flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Full Menu
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

function PizzaCard({ image, name, price, description, category, available, dietary, index, isInView, onOrder }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group cursor-pointer"
      onClick={onOrder}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`bg-mozzarella-200 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-basil-200 ${!available ? 'opacity-60' : ''
        }`}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          <motion.img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* Availability Badge */}
          {!available && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-tomato-600 text-white text-xs font-bold rounded-full">
              Out of Stock
            </div>
          )}

          {/* Dietary Tags */}
          {dietary && (
            <div className="absolute bottom-4 left-4 flex gap-1">
              {dietary.vegetarian && (
                <span className="px-2 py-1 bg-basil-100 text-basil-700 text-xs rounded-full">🥬 Veg</span>
              )}
              {dietary.vegan && (
                <span className="px-2 py-1 bg-basil-100 text-basil-700 text-xs rounded-full">🌱 Vegan</span>
              )}
              {dietary.glutenFree && (
                <span className="px-2 py-1 bg-crust-100 text-crust-700 text-xs rounded-full">🌾 GF</span>
              )}
              {dietary.spicy && (
                <span className="px-2 py-1 bg-tomato-100 text-tomato-700 text-xs rounded-full">🌶️ Spicy</span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-display font-bold text-xl text-wood-800 group-hover:text-tomato-600 transition-colors">{name}</h3>
            <span className="text-tomato-600 font-bold text-xl">${price.toFixed(2)}</span>
          </div>

          {category && (
            <p className="text-wood-600 text-sm mb-3">{category}</p>
          )}

          {description && (
            <p className="text-wood-500 text-sm line-clamp-2">{description}</p>
          )}

          {/* Quick Add Button */}
          <motion.button
            className="w-full mt-4 py-2 bg-tomato-600 text-white font-semibold rounded-lg hover:bg-tomato-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation()
              onOrder()
            }}
          >
            Order Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

