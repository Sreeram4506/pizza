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
    const { openWithIntent, cartCount, addToCart, setIsOpen, orderType, setOrderType } = useChatbot()
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

    const handleOrder = (item) => {
        addToCart(item)
        setIsOpen(true)
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
        <div className="glass-shell min-h-screen bg-[#FAFAF8] text-[#1A1410] selection:bg-ember-500/15 font-sans overflow-x-hidden">
            <header className="fixed top-0 left-0 right-0 h-20 glass-panel-strong border-b border-white/60 z-[100] flex items-center justify-between px-6 lg:px-12">
                <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer">
                    <div className="w-12 h-12 glass-button-dark rounded-2xl flex items-center justify-center text-white font-serif-1947 font-black text-2xl">
                        {settings?.restaurantName?.[0] || 'M'}
                    </div>
                    <div>
                        <h1 className="font-serif-1947 text-2xl tracking-tight text-[#1A1410] leading-tight">{brandFirst}</h1>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-[#9B8D74] -mt-1 font-bold">{brandSecond}</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-10">
                    {menuNavigation.map((link) => (
                        <button
                            key={link.label}
                            onClick={link.action}
                            className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8A7A62] hover:text-[#1A1410] transition-colors"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <button 
                        onClick={() => setShowPointsInstructions(true)}
                        className="h-11 sm:h-12 px-4 glass-pill flex items-center gap-2.5 hover:bg-white/40 transition-all group"
                    >
                        <div className="w-6 h-6 bg-ember-600 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-sm group-hover:scale-110 transition-transform italic">PB</div>
                        <div className="hidden sm:block">
                            <p className="text-[9px] font-black tracking-widest text-[#9B8D74] uppercase leading-none mb-0.5">
                                {profile ? t('loyalty.pointsBalance') : t('loyalty.loginToSee')}
                            </p>
                            <p className="text-[11px] font-bold text-[#1A1410] leading-none">
                                {profile ? `${profile.loyalty?.points || 0} ${t('loyalty.pts')}` : 'Join PB'}
                            </p>
                        </div>
                    </button>

                    <button onClick={() => openWithIntent('cart')} className="w-11 h-11 sm:w-12 sm:h-12 glass-button-dark rounded-2xl flex items-center justify-center relative transition-all group">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-ember-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#FAFAF8]">
                                {cartCount}
                            </span>
                        )}
                    </button>
                    <button onClick={() => navigate('/')} className="w-11 h-11 sm:w-12 sm:h-12 glass-button-light rounded-2xl flex items-center justify-center lg:hidden">
                        <svg className="w-5 h-5 text-[#1A1410]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
            </header>

            <div className="flex pt-20 h-screen overflow-hidden">
                <aside className="w-[300px] border-r border-white/40 overflow-y-auto scrollbar-hide hidden lg:flex flex-col p-6 space-y-8 glass-panel-strong rounded-r-[2rem]">
                    <div className="relative mb-2">
                        <input
                            type="text"
                            placeholder={t('menu.search.sidebar')}
                            className="w-full h-12 glass-input px-12 text-sm font-medium focus:ring-4 focus:ring-ember-500/5 outline-none transition-all placeholder:text-[#9B8D74]/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9B8D74] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>

                    <div className="space-y-6">
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-600 font-black px-4">{t('menu.categories.navigation')}</span>
                        <nav ref={sidebarScrollRef} className="space-y-1.5">
                            {categories.map((category) => (
                                <button
                                    key={category._id}
                                    data-cat-btn={category.name}
                                    onClick={() => handleCategoryClick(category.name)}
                                    className={`w-full text-left px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${activeCategory === category.name ? 'glass-button-dark text-white' : 'glass-button-light text-[#5C554E] hover:text-[#1A1410]'}`}
                                >
                                    {getLocalizedCatName(category.name)}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                <main ref={mainScrollRef} className="flex-1 overflow-y-auto pt-10 px-4 sm:px-12 pb-32 scroll-smooth scrollbar-hide bg-white/20 backdrop-blur-3xl">
                    <div className="mb-12 glass-panel glass-highlight-ring p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                            <div className="max-w-3xl">
                                <span className="section-eyebrow block mb-4">{t('menu.categories.curated')}</span>
                                <h2 className="text-4xl sm:text-6xl font-serif-1947 italic mb-4 text-[#1A1410] tracking-tight">{restaurantName} Menu</h2>
                                <div className="flex flex-col gap-2 text-[#7E705B] font-black text-[11px] uppercase tracking-[0.16em]">
                                    <span className="flex items-center gap-2">Address: {settings?.address || 'Visit our main location'}</span>
                                    <span className="flex items-center gap-2">
                                        Hours: {t('contact.hours')}
                                        {timezoneLabel ? <span className="text-ember-600">{timezoneLabel}</span> : null}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
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

                                {phoneHref && (
                                    <a href={phoneHref} className="glass-pill px-6 py-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5C554E] transition-all hover:text-[#1A1410]">
                                        Call
                                    </a>
                                )}
                                <button onClick={() => navigate('/track')} className="glass-pill px-6 py-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5C554E] transition-all hover:text-[#1A1410]">
                                    {t('nav.trackOrder')}
                                </button>
                                {mapsHref && (
                                    <a href={mapsHref} target="_blank" rel="noreferrer" className="glass-pill px-6 py-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5C554E] transition-all hover:text-[#1A1410]">
                                        {t('contact.directions')}
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="relative mt-8 lg:hidden">
                            <input
                                type="text"
                                placeholder={t('menu.search.placeholder')}
                                className="w-full h-12 glass-input px-12 text-sm font-medium focus:ring-4 focus:ring-ember-500/5 outline-none transition-all placeholder:text-[#9B8D74]/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9B8D74] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                    </div>

                    {!hasSearchResults && (
                        <div className="glass-card glass-highlight-ring p-10 text-center mb-16">
                            <h3 className="font-serif-1947 text-3xl italic text-[#1A1410] mb-3">{t('menu.search.empty')}</h3>
                            <p className="text-[#7E705B] text-sm sm:text-base mb-6">{t('menu.search.emptySubtitle')}</p>
                            <button onClick={() => setSearchQuery('')} className="glass-button-dark px-6 py-3 rounded-xl text-white text-[11px] font-black uppercase tracking-[0.16em]">
                                {t('menu.search.clear')}
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
                                className="mb-20"
                            >
                                <div className="flex justify-between items-end mb-10 border-b border-white/50 pb-6 sticky top-0 glass-panel-strong z-20 -mx-4 px-4 pt-3 rounded-[2rem]">
                                    <div>
                                        <h3 className="text-3xl font-serif-1947 text-[#1A1410] italic">{getLocalizedCatName(category.name)}</h3>
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8A7A62] mt-2">
                                            {t('menu.items.count', { count: items.length })}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-8">
                                    {items.map((item) => (
                                        <motion.article
                                            key={item._id}
                                            whileHover={{ y: -4 }}
                                            className={`group glass-card glass-highlight-ring overflow-hidden ${item.available === false ? 'opacity-70' : ''}`}
                                        >
                                            <div className="relative aspect-[4/3] overflow-hidden">
                                                <img
                                                    src={resolveMenuItemImage(item)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover img-noir group-hover:scale-105 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-x-0 top-0 p-4 flex flex-wrap gap-2">
                                                    {getDietaryBadges(item).map((badge) => (
                                                        <span key={`${item._id}-${badge.label}`} className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] ${badge.tone}`}>
                                                            {badge.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-5 sm:p-6">
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-lg tracking-tight text-[#1A1410] group-hover:text-ember-600 transition-colors">
                                                            {item.name}
                                                        </h4>
                                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8A7A62] mt-2">
                                                            {getLocalizedCatName(category.name)}
                                                        </p>
                                                    </div>
                                                    <p className="text-ember-600 font-black tracking-tighter text-lg whitespace-nowrap">
                                                        ${item.price?.toFixed(2)}
                                                    </p>
                                                </div>

                                                <p className="text-[#5C554E] text-[15px] leading-relaxed min-h-[3rem]">
                                                    {item.description || t('menu.items.fresh')}
                                                </p>

                                                <div className="mt-6 flex items-center justify-between gap-3">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8A7A62]">
                                                        {orderType === 'delivery' ? 'Delivery ready' : 'Pickup ready'}
                                                    </p>
                                                    <button
                                                        onClick={() => handleOrder(item)}
                                                        disabled={item.available === false}
                                                        className="glass-button-dark px-5 py-3 rounded-xl text-white text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        {t('menu.items.add')}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.article>
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </main>
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
        </div>
    )
}
