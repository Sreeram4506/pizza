import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import wsService from '../services/websocket.js'
import toast from 'react-hot-toast'

export default function MenuPage() {
    const [categories, setCategories] = useState([])
    const [menuItems, setMenuItems] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('')
    const { openWithIntent, cartCount, addToCart, setIsOpen } = useChatbot()
    const { settings } = useSettings()
    const navigate = useNavigate()

    const mainScrollRef = useRef(null)
    const categoryRefs = useRef({})
    const sidebarScrollRef = useRef(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, itemRes] = await Promise.all([
                    fetch('/api/menu/categories'),
                    fetch('/api/menu/items')
                ])
                const cats = await catRes.json()
                const items = await itemRes.json()

                // Inject "Popular" if items exist
                const hasPopular = items.some(i => i.isPopular)
                const finalCats = hasPopular ? [{ _id: 'popular', name: 'Popular' }, ...cats] : cats

                setCategories(finalCats)
                setMenuItems(items)

                if (finalCats.length > 0) {
                    setActiveCategory(finalCats[0].name)
                }
            } catch (err) {
                console.error('Failed to fetch menu data:', err)
            }
        }

        fetchData()

        const handleUpdate = () => fetchData()
        wsService.on('item_added', handleUpdate)
        wsService.on('item_updated', handleUpdate)
        wsService.on('item_removed', handleUpdate)
        wsService.on('category_added', handleUpdate)
        wsService.on('category_updated', handleUpdate)
        wsService.on('category_removed', handleUpdate)

        return () => {
            wsService.off('item_added', handleUpdate)
            wsService.off('item_updated', handleUpdate)
            wsService.off('item_removed', handleUpdate)
        }
    }, [])

    // Optimized Scroll Spy for custom container
    useEffect(() => {
        const observerOptions = {
            root: mainScrollRef.current,
            threshold: [0.1, 0.5],
            rootMargin: '-80px 0px -50% 0px'
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                    const catName = entry.target.getAttribute('data-category')
                    if (catName) {
                        setActiveCategory(catName)

                        // Sync sidebar scroll
                        const activeBtn = document.querySelector(`[data-cat-btn="${catName}"]`)
                        if (activeBtn && sidebarScrollRef.current) {
                            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                        }
                    }
                }
            })
        }, observerOptions)

        const currentRefs = categoryRefs.current
        Object.values(currentRefs).forEach(ref => {
            if (ref) observer.observe(ref)
        })

        return () => observer.disconnect()
    }, [categories, menuItems, searchQuery])

    const handleCategoryClick = (catName) => {
        setActiveCategory(catName)
        const target = categoryRefs.current[catName]
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const handleOrder = (item) => {
        addToCart(item)
        setIsOpen(true)
    }

    const groupedItems = categories.reduce((acc, cat) => {
        if (cat.name === 'Popular') {
            acc[cat.name] = menuItems.filter(item => item.isPopular)
        } else {
            acc[cat.name] = menuItems.filter(item => (item.categoryId?._id || item.categoryId) === cat._id)
        }
        return acc
    }, {})

    const filteredMenuItems = (items) => {
        return items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    }

    const allFilteredItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const hasSearchResults = allFilteredItems.length > 0 || !searchQuery

    const [showMobileSearch, setShowMobileSearch] = useState(false)

    return (
        <div className="h-screen flex flex-col bg-[#FAFAF8] overflow-hidden selection:bg-ember-500/15 selection:text-[#1A1410] font-sans">
            {/* Split Screen Header */}
            <header className="h-16 sm:h-20 flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-[rgba(26,20,16,0.06)] px-4 sm:px-12 flex items-center justify-between z-50">
                <div
                    className="flex items-center gap-2 sm:gap-4 cursor-pointer group"
                    onClick={() => navigate('/')}
                >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-ember-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-mono font-bold text-lg sm:text-xl shadow-lg shadow-ember-600/20 group-hover:scale-105 transition-transform">
                        {settings?.restaurantName?.[0] || 'M'}
                    </div>
                    {!showMobileSearch && (
                        <div className="flex flex-col">
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="font-display font-bold text-lg sm:text-2xl tracking-tighter text-[#1A1410] italic truncate max-w-[120px] sm:max-w-none leading-none"
                            >
                                {settings?.restaurantName || 'Mustang Pizza'}
                            </motion.span>
                            <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-ember-600 mt-1">Menu Kitchen</span>
                        </div>
                    )}
                </div>

                {/* Desktop Nav Links in Menu Page */}
                <nav className="hidden lg:flex items-center gap-8">
                    {[
                        { name: 'Home', href: '/' },
                        { name: 'Kitchen', href: '/#atelier' },
                        { name: 'Deals', href: '/#deals' },
                        { name: 'Tracking', href: '/track' }
                    ].map(link => (
                        <button
                            key={link.name}
                            onClick={() => navigate(link.href)}
                            className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#9B8D74] hover:text-[#1A1410] transition-colors relative group"
                        >
                            {link.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-ember-500 transition-all group-hover:w-full" />
                        </button>
                    ))}
                </nav>

                {showMobileSearch && (
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        className="flex-1 max-w-md mx-4"
                    >
                        <div className="relative">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search menu..."
                                className="w-full pl-4 pr-10 py-2 bg-[#F5F3EF] border-none rounded-full text-sm font-medium focus:ring-2 focus:ring-ember-500/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button
                                onClick={() => { setShowMobileSearch(false); setSearchQuery(''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8D74]"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className="flex items-center gap-2 sm:gap-6">
                    <button
                        onClick={() => setShowMobileSearch(!showMobileSearch)}
                        className="sm:hidden p-2 rounded-full hover:bg-[#F5F3EF] text-[#1A1410]"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>

                    <button
                        onClick={() => openWithIntent('cart')}
                        className="relative p-2 sm:p-2.5 rounded-full bg-[#1A1410] text-white shadow-xl shadow-black/10 hover:bg-ember-600 transition-colors group"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-ember-500 text-white text-[8px] sm:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center p-2 sm:p-2.5 rounded-full bg-[#F5F3EF] text-[#1A1410] hover:bg-white transition-all shadow-sm border border-[rgba(26,20,16,0.04)]"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Slim Side Texture Overlays */}
                <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#FAFAF8] to-transparent z-20 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#FAFAF8] to-transparent z-20 pointer-events-none" />

                {/* LEFT SIDEBAR: Categories (Responsive Width) */}
                <aside
                    ref={sidebarScrollRef}
                    className="w-[75px] sm:w-72 lg:w-96 p-2 sm:p-8 overflow-y-auto border-r border-[rgba(26,20,16,0.06)] bg-[#FAFAF8] scrollbar-hide z-10 flex flex-col transition-all duration-500"
                >
                    <div className="hidden sm:block mb-10 pt-2">
                        <div className="relative group">
                            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9B8D74] opacity-50 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-12 pr-4 py-4 bg-white border border-[rgba(26,20,16,0.08)] rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-ember-500/5 transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 sm:space-y-12">
                        <span className="hidden sm:block font-mono text-[10px] tracking-[0.3em] uppercase text-ember-600 font-black px-2">Navigation</span>
                        <nav className="flex flex-col gap-1.5 sm:gap-2">
                            {categories.map((cat) => {
                                const catItems = filteredMenuItems(groupedItems[cat.name] || [])
                                const isVisible = catItems.length > 0
                                if (!isVisible && searchQuery) return null

                                return (
                                    <button
                                        key={cat._id}
                                        data-cat-btn={cat.name}
                                        onClick={() => handleCategoryClick(cat.name)}
                                        className={`group flex flex-col sm:flex-row items-center sm:justify-between p-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[12px] font-bold tracking-[0.02em] sm:tracking-[0.05em] uppercase transition-all duration-300 relative overflow-hidden ${activeCategory === cat.name
                                            ? 'bg-[#1A1410] text-[#FAFAFA] shadow-lg sm:shadow-2xl shadow-black/10'
                                            : 'text-[#5C554E] hover:bg-white hover:text-[#1A1410]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 sm:gap-4 relative z-10">
                                            <div className={`w-1 h-1 rounded-full transition-all duration-500 ${activeCategory === cat.name ? 'bg-ember-500 scale-125' : 'bg-transparent'}`} />
                                            <span className={`text-center sm:text-left leading-tight break-words sm:break-normal transition-colors ${activeCategory === cat.name ? 'text-white' : ''}`}>{cat.name}</span>
                                        </div>
                                        <span className={`hidden sm:block font-mono text-[10px] opacity-40 transition-opacity ${activeCategory === cat.name ? 'text-ember-400' : 'text-[#9B8D74]'}`}>
                                            {catItems.length}
                                        </span>
                                    </button>
                                )
                            })}
                        </nav>
                    </div>
                </aside>

                {/* RIGHT CONTENT Area */}
                <main
                    ref={mainScrollRef}
                    className="flex-1 overflow-y-auto p-3 sm:p-12 bg-white/40 backdrop-blur-3xl scroll-smooth"
                >
                    <div className="max-w-6xl mx-auto space-y-10 sm:space-y-24 pb-32">
                        {!hasSearchResults && (
                            <div className="flex flex-col items-center justify-center pt-20 text-center">
                                <div className="w-16 h-16 bg-[#F5F3EF] rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-[#9B8D74]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <h3 className="text-xl font-display font-black italic text-[#1A1410]">No items found</h3>
                                <p className="text-sm text-[#5C554E] opacity-60 mt-2">Try searching for something else like "Cheese" or "Pepperoni"</p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-8 text-ember-600 font-mono text-[10px] uppercase font-bold tracking-widest border-b border-ember-600/30 pb-1"
                                >
                                    Clear Search
                                </button>
                            </div>
                        )}

                        {categories.map((category) => {
                            const items = filteredMenuItems(groupedItems[category.name] || [])
                            if (items.length === 0) return null

                            return (
                                <section
                                    key={category._id}
                                    data-category={category.name}
                                    ref={el => categoryRefs.current[category.name] = el}
                                    className="relative flex flex-col pt-2 sm:pt-4"
                                >
                                    {/* SECTION HEADER: STICKY */}
                                    <div className="sticky top-0 z-30 -mx-4 px-4 py-3 sm:py-6 bg-white/60 backdrop-blur-xl mb-6 sm:mb-12 flex items-baseline justify-between border-b border-[rgba(26,20,16,0.04)]">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-1">
                                                <div className="w-1 h-1 rounded-full bg-ember-500" />
                                                <span className="font-mono text-[8px] sm:text-[10px] tracking-[0.3em] uppercase text-ember-600 font-bold opacity-70">
                                                    {category.name === 'Popular' ? 'Curated' : 'Selection'}
                                                </span>
                                            </div>
                                            <h2 className="text-xl sm:text-[56px] font-display font-black italic text-[#1A1410] tracking-tighter leading-none">
                                                {category.name}
                                            </h2>
                                        </div>
                                        <div className="font-mono text-[9px] sm:text-[11px] text-[#9B8D74] tracking-widest uppercase font-bold">
                                            {items.length} {items.length === 1 ? 'Item' : 'Items'}
                                        </div>
                                    </div>

                                    {/* ITEM GRID */}
                                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
                                        {items.map((item) => (
                                            <motion.div
                                                key={item._id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="group relative flex flex-col"
                                            >
                                                <div
                                                    className="relative aspect-[4/5] sm:aspect-square rounded-xl sm:rounded-3xl overflow-hidden bg-[#F5F3EF] border border-white shadow-sm transition-all duration-700 hover:shadow-2xl cursor-pointer"
                                                    onClick={() => handleOrder(item)}
                                                >
                                                    <img
                                                        src={item.image ? (item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || ''}${item.image}`) : 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50'}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover img-noir group-hover:scale-110 transition-transform duration-1000"
                                                    />

                                                    <div className="absolute top-1.5 right-1.5 sm:top-4 sm:right-4 z-10">
                                                        <div className="px-1.5 py-0.5 sm:px-4 sm:py-2 bg-white/90 backdrop-blur-md rounded-lg sm:rounded-2xl shadow-xl border border-white/50">
                                                            <span className="font-mono text-[9px] sm:text-sm font-black text-[#1A1410] tracking-tighter">
                                                                ${item.price?.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="absolute top-1.5 left-1.5 sm:top-4 sm:left-4 flex flex-col gap-1 z-10">
                                                        {item.dietary?.spicy && (
                                                            <div className="px-1.5 py-0.5 bg-ember-600 text-white text-[6px] sm:text-[9px] font-black uppercase tracking-[0.1em] rounded-md shadow-lg">Spicy</div>
                                                        )}
                                                        {item.dietary?.vegetarian && (
                                                            <div className="px-1.5 py-0.5 bg-green-600 text-white text-[6px] sm:text-[9px] font-black uppercase tracking-[0.1em] rounded-md shadow-lg">Veg</div>
                                                        )}
                                                    </div>

                                                    {/* Quick Add Overlay Mobile Hint */}
                                                    <div className="sm:hidden absolute bottom-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-[#1A1410] shadow-md">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                                                    </div>

                                                    <div className="hidden sm:flex absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex flex-col justify-end">
                                                        <button
                                                            className="w-full bg-white text-[#1A1410] font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-ember-500 hover:text-white transition-all shadow-xl"
                                                            onClick={(e) => { e.stopPropagation(); handleOrder(item); }}
                                                        >
                                                            Add to Order
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="py-2 sm:p-5 flex flex-col flex-1">
                                                    <h3 className="font-display text-[13px] sm:text-2xl font-black italic text-[#1A1410] tracking-tight group-hover:text-ember-600 transition-colors mb-0.5 line-clamp-1">{item.name}</h3>
                                                    <p className="text-[9px] sm:text-[13px] leading-tight sm:leading-relaxed text-[#5C554E] font-medium opacity-70 line-clamp-1 sm:line-clamp-2">
                                                        {item.description || "Handcrafted fresh daily."}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                #mainScrollRef::-webkit-scrollbar { width: 4px; }
            `}} />
        </div>
    )
}
