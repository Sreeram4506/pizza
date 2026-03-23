import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import wsService from '../services/websocket.js'
import { useTranslation } from 'react-i18next'
import { resolveMenuItemImage } from '../utils/menuArtwork'

export default function MenuPage() {
    const { t } = useTranslation()
    const [categories, setCategories] = useState([])
    const [menuItems, setMenuItems] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('')
    const { openWithIntent, cart, cartCount, addToCart, setIsOpen, orderType, setOrderType, setIsCartOpen } = useChatbot()
    const [flyingItems, setFlyingItems] = useState([]) // Array of { id, x, y } for floating +1s
    const { settings } = useSettings()
    const navigate = useNavigate()

    const mainScrollRef = useRef(null)
    const categoryRefs = useRef({})
    const sidebarScrollRef = useRef(null)
    const [profile, setProfile] = useState(null)
    const [showPointsInstructions, setShowPointsInstructions] = useState(false)

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

                const hasPopular = items.some((item) => item.isPopular)
                const finalCats = hasPopular ? [{ _id: 'popular', name: 'Popular' }, ...cats] : cats

                setCategories(finalCats)
                setMenuItems(items)

                if (finalCats.length > 0) {
                    setActiveCategory((current) => current || finalCats[0].name)
                }
            } catch (err) {
                console.error('Failed to fetch menu data:', err)
            }
        }

        fetchData()

        const token = localStorage.getItem('customerToken')
        if (token) {
            fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => { if (data.user) setProfile(data.user) })
                .catch(err => console.error('Failed to fetch profile:', err))
        }

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
            wsService.off('category_added', handleUpdate)
            wsService.off('category_updated', handleUpdate)
            wsService.off('category_removed', handleUpdate)
        }
    }, [])

    useEffect(() => {
        const observerOptions = {
            root: mainScrollRef.current,
            threshold: [0.1, 0.5],
            rootMargin: '-80px 0px -50% 0px'
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                    const catName = entry.target.getAttribute('data-category')
                    if (catName) {
                        setActiveCategory(catName)

                        const activeButton = document.querySelector(`[data-cat-btn="${catName}"]`)
                        if (activeButton && sidebarScrollRef.current) {
                            activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                        }
                    }
                }
            })
        }, observerOptions)

        Object.values(categoryRefs.current).forEach((ref) => {
            if (ref) observer.observe(ref)
        })

        return () => observer.disconnect()
    }, [categories, menuItems, searchQuery])

    const handleCategoryClick = (categoryName) => {
        setActiveCategory(categoryName)
        const target = categoryRefs.current[categoryName]
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const handleAddWithAnimation = (item, e) => {
        addToCart(item)
        const rect = e.currentTarget.getBoundingClientRect()
        const newAnim = { id: Date.now(), x: rect.left + rect.width / 2, y: rect.top }
        setFlyingItems(prev => [...prev, newAnim])
        setTimeout(() => {
            setFlyingItems(prev => prev.filter(a => a.id !== newAnim.id))
        }, 1000)
    }

    const groupedItems = categories.reduce((accumulator, category) => {
        if (category.name === 'Popular') {
            accumulator[category.name] = menuItems.filter((item) => item.isPopular)
        } else {
            accumulator[category.name] = menuItems.filter((item) => (item.categoryId?._id || item.categoryId) === category._id)
        }
        return accumulator
    }, {})

    const filteredMenuItems = (items) => {
        return items.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    }

    const allFilteredItems = menuItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const hasSearchResults = allFilteredItems.length > 0 || !searchQuery
    const restaurantName = settings?.restaurantName || 'Mustang Pizza'
    const [brandFirst, ...brandRest] = restaurantName.split(' ')
    const brandSecond = brandRest.join(' ') || 'Pizza'
    const mapsHref = settings?.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
        : null
    const phoneHref = settings?.phone ? `tel:${settings.phone.replace(/\D/g, '')}` : null

    const getLocalizedCatName = (name) => {
        if (name === 'Popular') return t('menu.categories.popular')
        return name
    }

    const getTimezoneLabel = (timezone) => {
        if (!timezone) return ''
        try {
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                timeZoneName: 'short'
            }).formatToParts(new Date())
            return parts.find((part) => part.type === 'timeZoneName')?.value || timezone
        } catch (error) {
            return timezone
        }
    }

    const getDietaryBadges = (item) => {
        const badges = []
        if (item.isPopular) badges.push({ label: t('menu.categories.popular'), tone: 'bg-ember-500 text-white' })
        if (item.dietary?.vegetarian) badges.push({ label: t('menu.items.veg'), tone: 'bg-[#D4922A] text-white' })
        if (item.dietary?.vegan) badges.push({ label: 'Vegan', tone: 'bg-emerald-700 text-white' })
        if (item.dietary?.glutenFree) badges.push({ label: 'GF', tone: 'bg-slate-700 text-white' })
        if (item.dietary?.spicy) badges.push({ label: t('menu.items.spicy'), tone: 'bg-rose-600 text-white' })
        if (item.available === false) badges.push({ label: 'Unavailable', tone: 'bg-white/90 text-[#1A1410]' })
        return badges
    }

    const menuNavigation = [
        { label: t('nav.home'), action: () => navigate('/') },
        { label: t('nav.trackOrder'), action: () => navigate('/track') },
        { label: t('nav.catering'), action: () => navigate('/catering') },
        { label: t('nav.contact'), action: () => navigate('/#contact') }
    ]

    const timezoneLabel = getTimezoneLabel(settings?.timezone)

    return (
        <div className="min-h-screen bg-[#FAFAF8] text-[#1A1410] selection:bg-ember-500/15 font-sans overflow-x-hidden">
            <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-[#EBEBE6] z-[100] flex items-center justify-between px-6 lg:px-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-9 h-9 bg-[#1A1410] text-white rounded-[10px] flex items-center justify-center font-serif-1947 font-black text-lg group-hover:scale-105 transition-transform duration-300">
                        {settings?.restaurantName?.[0] || '1'}
                    </div>
                    <div>
                        <h1 className="font-serif-1947 text-lg tracking-tight text-[#1A1410] leading-none">{brandFirst}</h1>
                        <p className="text-[8px] uppercase tracking-[0.25em] text-[#8A7A62] mt-0.5 font-bold">{brandSecond}</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-10">
                    {menuNavigation.map((link) => (
                        <button
                            key={link.label}
                            onClick={link.action}
                            className="text-[12px] uppercase tracking-widest font-bold text-[#7A6F64] hover:text-[#1A1410] transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1.5px] after:bg-[#1A1410] hover:after:w-full after:transition-all"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowPointsInstructions(true)}
                        className="h-9 px-3.5 flex items-center gap-2 rounded-full border border-[#EBEBE6] transition-all hover:bg-[#F0F0EE] bg-white"
                    >
                        <div className="w-4.5 h-4.5 bg-[#1A1410] rounded-full flex items-center justify-center text-[8px] font-black text-white italic">PB</div>
                        <div className="hidden sm:block">
                            <p className="text-[11px] font-bold text-[#1A1410] tracking-tight">
                                {profile ? `${profile.loyalty?.points || 0} pts` : 'Join Rewards'}
                            </p>
                        </div>
                    </button>

                    <button onClick={() => setIsCartOpen(true)} className="w-9 h-9 bg-white border border-[#EBEBE6] rounded-full flex items-center justify-center relative hover:bg-[#F9F9F7] transition-colors shadow-sm">
                        <svg className="w-3.5 h-3.5 text-[#1A1410]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        {cartCount > 0 && (
                            <motion.span 
                                key={cartCount}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-ember-600 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white"
                            >
                                {cartCount}
                            </motion.span>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex pt-16 h-screen overflow-hidden">
                <aside className="w-[260px] border-r border-[#EBEBE6] overflow-y-auto scrollbar-hide hidden lg:flex flex-col py-8 px-5 space-y-8 bg-white/50">
                    <div className="relative">
                        <svg className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A62]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder={t('menu.search.sidebar') || "Search..."}
                            className="w-full h-10 bg-[#F5F5F0] border-none rounded-xl pl-10 pr-4 text-[13px] font-semibold focus:ring-1 focus:ring-[#1A1410] outline-none transition-all placeholder:text-[#9B8D74] text-[#1A1410]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <nav ref={sidebarScrollRef} className="space-y-1.5">
                        {categories.map((category) => (
                            <button
                                key={category._id}
                                data-cat-btn={category.name}
                                onClick={() => handleCategoryClick(category.name)}
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-[13px] uppercase tracking-wider transition-all ${activeCategory === category.name ? 'bg-[#1A1410] text-white shadow-lg' : 'text-[#7A6F64] hover:text-[#1A1410] hover:bg-[#F0F0EE]'}`}
                            >
                                {getLocalizedCatName(category.name)}
                            </button>
                        ))}
                    </nav>
                </aside>

                <main ref={mainScrollRef} className="flex-1 overflow-y-auto px-6 sm:px-10 lg:px-12 pb-32 scroll-smooth scrollbar-hide bg-[#FAFAF8]">
                    <div className="pt-10 pb-6 border-b border-[#EBEBE6] mb-0 max-w-5xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                            <div>
                                <h2 className="text-[32px] sm:text-[44px] font-serif tracking-tight text-[#1A1410] leading-none mb-3">{restaurantName} Menu</h2>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#8A7A62] text-[13px] font-bold">
                                    <span className="flex items-center gap-1.5 uppercase tracking-wide"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg> {settings?.address?.split(',')[0]}</span>
                                    <span className="flex items-center gap-1.5 uppercase tracking-wide">&bull; <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 11H5a1 1 0 010-2h3V5a1 1 0 112 0v5a1 1 0 01-1 1z" /></svg> Opens 11:00 AM</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-[#F0F0EE] p-1 rounded-full flex border border-[#EBEBE6]">
                                    <button
                                        onClick={() => setOrderType('pickup')}
                                        className={`px-5 py-2 rounded-full text-[12px] uppercase tracking-wider font-extrabold transition-all ${orderType === 'pickup' ? 'bg-white text-[#1A1410] shadow-sm' : 'text-[#7A6F64] hover:text-[#1A1410]'}`}
                                    >
                                        Pickup
                                    </button>
                                    <button
                                        onClick={() => setOrderType('delivery')}
                                        className={`px-5 py-2 rounded-full text-[12px] uppercase tracking-wider font-extrabold transition-all ${orderType === 'delivery' ? 'bg-white text-[#1A1410] shadow-sm' : 'text-[#7A6F64] hover:text-[#1A1410]'}`}
                                    >
                                        Delivery
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-md pt-8 pb-4 border-b border-[#EBEBE6] mb-12 -mx-6 px-6 sm:-mx-10 sm:px-10 lg:-mx-12 lg:px-12">
                        <div className="max-w-5xl mx-auto flex flex-col gap-6">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder={t('menu.search.placeholder') || "Find your favorite pizza..."}
                                    className="w-full h-12 sm:h-14 bg-white border border-[#EBEBE6] rounded-2xl pl-12 pr-6 text-[15px] font-semibold focus:ring-1 focus:ring-[#1A1410] focus:border-[#1A1410] outline-none transition-all placeholder:text-[#9B8D74] text-[#1A1410] shadow-sm group-hover:shadow-md"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#8A7A62]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 no-scrollbar">
                                {categories.map((category) => (
                                    <button
                                        key={`main-cat-${category._id}`}
                                        onClick={() => handleCategoryClick(category.name)}
                                        className={`shrink-0 px-6 py-2.5 rounded-full text-[12px] font-extrabold uppercase tracking-widest transition-all whitespace-nowrap shadow-sm ${activeCategory === category.name ? 'bg-[#1A1410] text-white shadow-md' : 'bg-white border border-[#EBEBE6] text-[#7A6F64] hover:border-[#1A1410]'}`}
                                    >
                                        {getLocalizedCatName(category.name)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {!hasSearchResults && (
                        <div className="bg-white border border-[#EBEBE6] rounded-3xl p-16 text-center mb-16 shadow-[0_10px_30px_rgba(0,0,0,0.03)] max-w-lg mx-auto">
                            <h3 className="font-serif text-3xl text-[#1A1410] mb-4">No results found</h3>
                            <p className="text-[#8A7A62] mb-8 font-medium">Try searching for something else like "Pepperoni" or "Salad"</p>
                            <button onClick={() => setSearchQuery('')} className="bg-[#1A1410] text-white px-8 py-3 rounded-2xl text-[14px] font-bold hover:scale-105 transition-transform shadow-lg">
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
                                ref={(element) => { categoryRefs.current[category.name] = element }}
                                className="mb-20 max-w-7xl mx-auto"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10 sm:gap-x-10 xl:gap-x-12">
                                    {items.map((item) => (
                                        <article
                                            key={item._id}
                                            className={`w-full relative group flex gap-5 sm:gap-8 items-center transition-all cursor-pointer border-b border-[#EBEBE6]/60 pb-8 last:border-0 hover:bg-white/40 rounded-2xl -mx-4 px-4 ${item.available === false ? 'opacity-50 grayscale' : ''}`}
                                            onClick={(e) => handleAddWithAnimation(item, e)}
                                        >
                                            <div className="flex-1 min-w-0 order-1">
                                                <div className="flex flex-col h-full">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-serif text-[18px] sm:text-[22px] leading-tight text-[#1A1410] group-hover:text-ember-700 transition-colors uppercase tracking-tight line-clamp-2">{item.name}</h4>
                                                        {getDietaryBadges(item).length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {getDietaryBadges(item).slice(0, 1).map((badge, i) => (
                                                                    <span key={i} className="px-1.5 py-0.5 rounded shadow-sm bg-white/95 backdrop-blur-sm text-[8px] font-black uppercase tracking-tighter text-[#1A1410] border border-[#EBEBE6]">
                                                                        {badge.label}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-[#8A7A62] text-[13px] sm:text-[14px] leading-relaxed font-medium line-clamp-3 mb-4">
                                                        {item.description || "Freshly prepared with authentic ingredients and our signature secret sauce."}
                                                    </p>
                                                    
                                                    <div className="flex items-center gap-4 mt-auto">
                                                        <p className="font-black text-[#1A1410] text-[16px] sm:text-[18px] tracking-tight">${item.price?.toFixed(2)}</p>
                                                        <motion.button 
                                                            whileTap={{ scale: 0.8 }}
                                                            whileHover={{ scale: 1.15 }}
                                                            onClick={(e) => { e.stopPropagation(); handleAddWithAnimation(item, e); }}
                                                            disabled={item.available === false}
                                                            className="w-10 h-10 rounded-full bg-[#1A1410] text-white flex items-center justify-center transition-all shadow-md group-hover:bg-[#EBB250] group-hover:text-[#1A1410]"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative w-[100px] sm:w-[140px] lg:w-[160px] aspect-square rounded-2xl overflow-hidden shrink-0 border border-[#EBEBE6] bg-[#F5F5F0] shadow-sm group-hover:shadow-xl transition-all order-2">
                                                <img
                                                    src={resolveMenuItemImage(item)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
                                                
                                                {/* Quantity Badge on Item */}
                                                <AnimatePresence>
                                                    {(cart?.find(i => (i._id || i.itemId) === item._id)?.qty > 0) && (
                                                        <motion.div 
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            className="absolute top-2 right-2 w-7 h-7 bg-ember-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg z-10"
                                                        >
                                                            {cart.find(i => (i._id || i.itemId) === item._id)?.qty}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </main>
            </div>

            {/* Floating +1 Animations */}
            <div className="fixed inset-0 pointer-events-none z-[9999]">
                <AnimatePresence>
                    {flyingItems.map(anim => (
                        <motion.div
                            key={anim.id}
                            initial={{ opacity: 1, scale: 0.5, x: anim.x - 20, y: anim.y - 20 }}
                            animate={{ opacity: 0, scale: 1.5, y: anim.y - 100 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute text-ember-600 font-black text-xl pointer-events-none"
                            style={{ textShadow: '0 0 10px rgba(255,255,255,0.8)' }}
                        >
                            +1
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            {/* Points Instructions Modal */}
            <AnimatePresence>
                {showPointsInstructions && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPointsInstructions(false)}
                            className="absolute inset-0 bg-[#1A1410]/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg glass-panel-strong rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-white/60"
                        >
                            <button 
                                onClick={() => setShowPointsInstructions(false)}
                                className="absolute top-6 right-6 w-10 h-10 glass-pill flex items-center justify-center hover:bg-white/40 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>

                            <div className="text-center mb-10">
                                <div className="w-16 h-16 bg-ember-600 rounded-2xl flex items-center justify-center text-3xl font-serif-1947 italic text-white shadow-xl mx-auto mb-6">PB</div>
                                <h2 className="text-3xl font-serif-1947 italic text-[#1A1410] tracking-tight">{t('loyalty.instructionsTitle')}</h2>
                            </div>

                            <div className="space-y-6">
                                {[1, 2, 3].map((step) => (
                                    <div key={step} className="flex gap-5">
                                        <div className="w-8 h-8 rounded-full bg-ember-500/15 flex items-center justify-center text-ember-600 font-black text-xs shrink-0">{step}</div>
                                        <div>
                                            <h4 className="font-bold text-[#1A1410] mb-1">{t(`loyalty.step${step}.title`)}</h4>
                                            <p className="text-sm text-[#5C554E] leading-relaxed">{t(`loyalty.step${step}.desc`)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10">
                                {profile ? (
                                    <div className="bg-ember-500/5 rounded-2xl p-5 border border-ember-500/10 mb-6 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#9B8D74]">{t('loyalty.pointsBalance')}</span>
                                        <span className="text-lg font-black text-ember-600 tracking-tight">{profile.loyalty?.points || 0} PTS</span>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => navigate('/login')}
                                        className="w-full h-14 glass-button-dark rounded-xl text-white font-black text-[11px] uppercase tracking-widest mb-4"
                                    >
                                        Login to Start Earning
                                    </button>
                                )}
                                <button 
                                    onClick={() => setShowPointsInstructions(false)}
                                    className="w-full h-14 bg-[#1A1410] text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                                >
                                    {t('loyalty.gotIt')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <style dangerouslySetInnerHTML={{ __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    )
}
