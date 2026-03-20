import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import wsService from '../services/websocket.js'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function MenuPage() {
    const { t } = useTranslation()
    const [categories, setCategories] = useState([])
    const [menuItems, setMenuItems] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('')
    const { openWithIntent, cartCount, addToCart, setIsOpen, orderType, setOrderType } = useChatbot()
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

                if (!catRes.ok || !itemRes.ok) {
                    throw new Error(`Failed to fetch: ${catRes.status} / ${itemRes.status}`)
                }

                const rawCats = await catRes.json()
                const rawItems = await itemRes.json()
                const cats = Array.isArray(rawCats) ? rawCats : []
                const items = Array.isArray(rawItems) ? rawItems : []

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
                if (err instanceof SyntaxError) {
                    console.error('Potential non-JSON response (e.g., Rate Limited or Server Error)')
                }
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
    const restaurantName = settings?.restaurantName || 'Mustang Pizza'
    const [brandFirst, ...brandRest] = restaurantName.split(' ')
    const brandSecond = brandRest.join(' ') || 'Pizza'

    const getLocalizedCatName = (name) => {
        if (name === 'Popular') return t('menu.categories.popular')
        return name
    }

    return (
        <div className="glass-shell min-h-screen bg-[#FAFAF8] text-[#1A1410] selection:bg-ember-500/15 font-sans overflow-x-hidden">
            {/* ── TOP NAVIGATION ── */}
            <header className="fixed top-0 left-0 right-0 h-20 glass-panel-strong border-b border-white/60 z-[100] flex items-center justify-between px-6 lg:px-12">
                <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer">
                    <div className="w-12 h-12 glass-button-dark rounded-2xl flex items-center justify-center text-white font-serif-1947 font-black text-2xl">
                        {settings?.restaurantName?.[0] || 'M'}
                    </div>
                    <div>
                      <h1 className="font-serif-1947 text-2xl tracking-tight text-[#1A1410] leading-tight">{brandFirst}</h1>
                      <p className="text-[8px] uppercase tracking-[0.3em] text-[#9B8D74] -mt-1 font-bold">{brandSecond}</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-10">
                    {['Home', 'Order Online', 'Track Order', 'More'].map(link => (
                        <button key={link} className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9B8D74] hover:text-[#1A1410] transition-colors">{link}</button>
                    ))}
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    
                    <button onClick={() => openWithIntent('cart')} className="w-11 h-11 sm:w-12 sm:h-12 glass-button-dark rounded-2xl flex items-center justify-center relative transition-all group">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-ember-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#FAFAF8]">
                                {cartCount}
                            </span>
                        )}
                    </button>
                    <button onClick={() => navigate('/')} className="w-11 h-11 sm:w-12 sm:h-12 glass-button-light rounded-2xl flex items-center justify-center lg:hidden">
                        <svg className="w-5 h-5 text-[#1A1410]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16m-7 6h7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
            </header>

            <div className="flex pt-20 h-screen overflow-hidden">
                {/* ── LEFT SIDEBAR ── */}
                <aside className="w-[300px] border-r border-white/40 overflow-y-auto scrollbar-hide hidden lg:flex flex-col p-6 space-y-8 glass-panel-strong rounded-r-[2rem]">
                    <div className="relative mb-2">
                        <input 
                            type="text" 
                            placeholder="Search menu"
                            className="w-full h-12 glass-input px-12 text-sm font-medium focus:ring-4 focus:ring-ember-500/5 outline-none transition-all placeholder:text-[#9B8D74]/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9B8D74] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>

                    <div className="space-y-6">
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-600 font-black px-4">{t('menu.categories.navigation')}</span>
                        <nav className="space-y-1.5">
                            {categories.map((cat) => (
                                <button
                                    key={cat._id}
                                    onClick={() => handleCategoryClick(cat.name)}
                                    className={`w-full text-left px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${activeCategory === cat.name ? 'glass-button-dark text-white' : 'glass-button-light text-[#5C554E] hover:text-[#1A1410]'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ── */}
                <main ref={mainScrollRef} className="flex-1 overflow-y-auto pt-10 px-4 sm:px-12 pb-32 scroll-smooth scrollbar-hide bg-white/20 backdrop-blur-3xl">
                    {/* Location Header */}
                    <div className="mb-12 glass-panel glass-highlight-ring p-6 sm:p-8">
                        <h2 className="text-4xl sm:text-6xl font-serif-1947 italic mb-4 text-[#1A1410] tracking-tight">{restaurantName} Menu</h2>
                        <div className="flex flex-col gap-2 text-[#9B8D74] font-black text-[10px] uppercase tracking-[0.2em]">
                            <span className="flex items-center gap-2">📍 {settings?.address || '997 Boston Providence Hwy, Norwood, MA'}</span>
                            <span className="flex items-center gap-2 text-ember-600">🌙 Opens 11:00 AM EDT</span>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <div className="glass-pill p-1 flex">
                                <button 
                                    onClick={() => setOrderType('pickup')}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orderType === 'pickup' ? 'glass-button-light text-[#1A1410]' : 'text-[#9B8D74] hover:text-[#1A1410]'}`}
                                >
                                    Pickup
                                </button>
                                <button 
                                    onClick={() => setOrderType('delivery')}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orderType === 'delivery' ? 'glass-button-light text-[#1A1410]' : 'text-[#9B8D74] hover:text-[#1A1410]'}`}
                                >
                                    Delivery
                                </button>
                            </div>
                            
                            <button className="glass-pill px-6 py-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5C554E] transition-all">
                                🕒 {orderType === 'pickup' ? 'Pickup' : 'Delivery'} time...
                                <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>

                            
                        </div>
                    </div>

                    {categories.map((category) => {
                        const items = filteredMenuItems(groupedItems[category.name] || [])
                        if (items.length === 0) return null

                        return (
                            <section
                                key={category._id}
                                data-category={category.name}
                                ref={el => categoryRefs.current[category.name] = el}
                                className="mb-20"
                            >
                                <div className="flex justify-between items-end mb-10 border-b border-white/50 pb-6 sticky top-0 glass-panel-strong z-20 -mx-4 px-4 pt-3 rounded-[2rem]">
                                    <h3 className="text-3xl font-serif-1947 text-[#1A1410] italic">{category.name}</h3>
                                    <div className="flex gap-2">
                                        <button className="w-10 h-10 bg-[#F5F3EF] rounded-full flex items-center justify-center border border-[rgba(26,20,16,0.04)] text-[#9B8D74] hover:text-[#1A1410] transition-colors hover:scale-105">←</button>
                                        <button className="w-10 h-10 bg-[#F5F3EF] rounded-full flex items-center justify-center border border-[rgba(26,20,16,0.04)] text-[#9B8D74] hover:text-[#1A1410] transition-colors hover:scale-105">→</button>
                                    </div>
                                </div>

                                {category.name === 'Discounts' ? (
                                    <div className="max-w-md glass-panel glass-highlight-ring p-8 mb-12 relative overflow-hidden group hover:shadow-xl transition-all">
                                        <div className="relative z-10">
                                            <p className="font-mono text-[9px] tracking-widest font-black text-ember-600 mb-2 uppercase">Limited Offer</p>
                                            <h4 className="text-xl font-bold tracking-tight text-[#1A1410]">Get 10% off on our new items</h4>
                                        </div>
                                        <button className="absolute right-6 bottom-6 w-12 h-12 glass-button-dark text-white rounded-2xl flex items-center justify-center transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-10">
                                        {items.map((item) => (
                                            <motion.div
                                                key={item._id}
                                                whileHover={{ y: -5 }}
                                                className="group cursor-pointer flex flex-col"
                                                onClick={() => handleOrder(item)}
                                            >
                                                <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden glass-card glass-highlight-ring mb-5 group-hover:shadow-2xl transition-all duration-700">
                                                    <img
                                                        src={item.image ? (item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || ''}${item.image}`) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover img-noir group-hover:scale-110 transition-transform duration-1000"
                                                    />
                                                    <button className="absolute right-4 bottom-4 w-10 h-10 glass-button-light rounded-xl flex items-center justify-center text-[#1A1410] group-hover:bg-[#1A1410] group-hover:text-white transition-all shadow-xl">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </button>
                                                </div>
                                                <div className="px-1">
                                                    <h4 className="font-bold text-sm mb-1 tracking-tight text-[#1A1410] group-hover:text-ember-600 transition-colors line-clamp-1">{item.name}</h4>
                                                    <p className="text-ember-600 font-black tracking-tighter text-sm">${item.price?.toFixed(2)}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )
                    })}
                </main>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    )
}

