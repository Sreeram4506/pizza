import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useChatbot } from '../context/ChatbotContext'
import toast from 'react-hot-toast'

export default function CustomerProfile() {
    const [profile, setProfile] = useState(null)
    const [orders, setOrders] = useState([])
    const [availableRewards, setAvailableRewards] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const { openWithIntent } = useChatbot()
    const [expandedOrderId, setExpandedOrderId] = useState(null)
    const [isAddingAddress, setIsAddingAddress] = useState(false)
    const [newAddress, setNewAddress] = useState({ label: '', street: '', city: '', zip: '', isDefault: false })

    const [loyaltyConfig, setLoyaltyConfig] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('customerToken')
        if (!token) {
            navigate('/login')
            return
        }
        fetchProfileData(token)
    }, [])

    const fetchProfileData = async (token) => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setProfile(data.user)
                setOrders(data.orders || [])
                setAvailableRewards(data.availableRewards || [])
                setLoyaltyConfig(data.loyaltyConfig)
            } else {
                localStorage.removeItem('customerToken')
                navigate('/login')
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleReorder = (pastOrder) => {
        // Send all items at once to the chatbot for reordering
        openWithIntent('reorder', { items: pastOrder.items })
        toast.success(`Items from Order #${pastOrder.orderNumber} added to cart!`)
    }

    const handleAddAddress = async (e) => {
        e.preventDefault()
        const token = localStorage.getItem('customerToken')
        try {
            const res = await fetch('/api/auth/address-book', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newAddress)
            })
            if (res.ok) {
                const data = await res.json()
                setProfile(prev => ({ ...prev, addressBook: data.addressBook }))
                setIsAddingAddress(false)
                setNewAddress({ label: '', street: '', city: '', zip: '', isDefault: false })
                toast.success('Address added to your book!')
            } else {
                const errData = await res.json()
                toast.error(errData.error || 'Failed to add address')
            }
        } catch (err) {
            console.error('Add address error:', err)
            toast.error('Network error. Please try again.')
        }
    }

    const handleDeleteAddress = async (addressId) => {
        const token = localStorage.getItem('customerToken')
        try {
            const res = await fetch(`/api/auth/address-book/${addressId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setProfile(prev => ({ ...prev, addressBook: data.addressBook }))
                toast.success('Address removed')
            }
        } catch (err) {
            console.error('Delete address error:', err)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-mozzarella-100 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-tomato-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    const tiers = {
        bronze: { color: 'bg-amber-600', text: 'text-amber-600', label: 'Bronze' },
        silver: { color: 'bg-slate-400', text: 'text-slate-500', label: 'Silver' },
        gold: { color: 'bg-yellow-500', text: 'text-yellow-600', label: 'Gold' },
        platinum: { color: 'bg-purple-500', text: 'text-purple-600', label: 'Platinum' }
    }

    const tiersList = ['bronze', 'silver', 'gold', 'platinum']
    const currentTierName = profile?.loyalty?.tier || 'bronze'
    const currentTierIndex = tiersList.indexOf(currentTierName)
    const nextTierName = currentTierIndex < tiersList.length - 1 ? tiersList[currentTierIndex + 1] : null
    const nextTierConfig = nextTierName ? (loyaltyConfig?.tiers?.[nextTierName] || { minPoints: 500 }) : null
    
    const progressPoints = profile?.loyalty?.points || 0
    const nextPoints = nextTierConfig?.minPoints || 0
    const progressPercent = nextPoints > 0 ? Math.min((progressPoints / nextPoints) * 100, 100) : 100

    const currentTier = tiers[currentTierName]

    return (
        <div className="min-h-screen bg-mozzarella-100 selection:bg-tomato-200">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-full md:w-1/3 bg-white rounded-[2.5rem] p-10 shadow-crust border border-crust-100"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-tomato-500 to-orange-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg mb-6 text-white">
                                    {profile?.name?.charAt(0).toUpperCase()}
                                </div>
                                <h2 className="font-display font-black text-3xl text-wood-800 tracking-tight mb-2 uppercase">{profile?.name}</h2>
                                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${currentTier.color} text-white mb-6 shadow-md`}>
                                    {currentTier.label} Member
                                </div>

                                <div className="w-full space-y-4 text-left border-t border-crust-100 pt-8">
                                    <div className="flex items-center gap-4 text-wood-600">
                                        <span className="w-10 h-10 bg-crust-50 rounded-xl flex items-center justify-center">✉️</span>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-wood-400">Email Address</p>
                                            <p className="font-bold text-sm">{profile?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-wood-600">
                                        <span className="w-10 h-10 bg-crust-50 rounded-xl flex items-center justify-center">📞</span>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-wood-400">Phone Number</p>
                                            <p className="font-bold text-sm">{profile?.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full mt-8 pt-6 border-t border-crust-100 space-y-3">
                                    <button
                                        onClick={() => navigate('/')}
                                        className="w-full py-3 bg-crust-50 hover:bg-crust-100 text-wood-600 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>🏠</span> Back to Home
                                    </button>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('customerToken');
                                            toast.success('Logged out successfully');
                                            navigate('/');
                                        }}
                                        className="w-full py-3 border border-tomato-200 hover:bg-tomato-50 text-tomato-600 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>🚪</span> Logout
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        <div className="flex-1 space-y-8 w-full">
                            {/* Loyalty Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-[#1A1410] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl group shadow-black/20"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-tomato-500/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-transform group-hover:scale-125" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <p className="text-tomato-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Loyalty Points Balance</p>
                                            <h3 className="text-6xl font-black tracking-tighter">{profile?.loyalty?.points || 0} <span className="text-2xl text-wood-400 tracking-normal ml-1">pts</span></h3>
                                        </div>
                                        <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center text-3xl italic font-black text-tomato-500 border border-white/10 shadow-xl">
                                            PB
                                        </div>
                                    </div>

                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                        <div className="flex justify-between text-sm font-bold uppercase tracking-widest mb-3">
                                            <span>Tier Progress</span>
                                            <span className="text-tomato-400">
                                                {nextTierName ? `${progressPoints} / ${nextPoints} to ${nextTierName.charAt(0).toUpperCase() + nextTierName.slice(1)}` : 'Maximum Tier Achieved'}
                                            </span>
                                        </div>
                                        <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercent}%` }}
                                                className="h-full bg-gradient-to-r from-tomato-500 to-orange-400 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                            />
                                        </div>
                                    </div>

                                    {availableRewards.length > 0 && (
                                        <div className="mt-8 pt-8 border-t border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-wood-400 mb-4">Available Rewards</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {availableRewards.map((reward, i) => {
                                                    const canAfford = (profile?.loyalty?.points || 0) >= reward.pointsCost;
                                                    return (
                                                        <div key={i} className={`p-4 rounded-xl border ${canAfford ? 'bg-tomato-500/10 border-tomato-500/30' : 'bg-white/5 border-white/10 opacity-60'}`}>
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-bold text-sm text-white">{reward.name}</p>
                                                                    <p className="text-[10px] text-wood-400 mt-1 uppercase font-bold tracking-wider">{reward.discountType === 'percentage' ? `${reward.discountValue}% OFF` : `$${reward.discountValue} OFF`}</p>
                                                                </div>
                                                                <span className={`text-xs font-black ${canAfford ? 'text-tomato-400' : 'text-wood-500'}`}>{reward.pointsCost} PTS</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Order History */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-[2.5rem] p-10 shadow-crust border border-crust-100"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-display font-black text-2xl text-wood-800 tracking-tight uppercase">Recent Orders</h3>
                                    <button className="text-tomato-600 font-black text-xs uppercase tracking-widest hover:text-tomato-700 transition-colors">View All History →</button>
                                </div>

                                <div className="space-y-4">
                                    {orders.length === 0 ? (
                                        <div className="text-center py-12 bg-crust-50 rounded-3xl border-2 border-dashed border-crust-200">
                                            <span className="text-4xl mb-4 block">🍕</span>
                                            <p className="text-wood-500 font-medium">No orders yet. Ready for your first slice?</p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="mt-6 px-8 py-3 bg-tomato-600 text-white rounded-full font-black uppercase tracking-widest shadow-lg hover:bg-tomato-700 transition-all"
                                            >
                                                Order Now
                                            </button>
                                        </div>
                                    ) : (
                                        orders.map((order, idx) => (
                                            <div key={idx} className="flex flex-col bg-crust-50 rounded-3xl hover:bg-crust-100 transition-all group border border-transparent hover:border-crust-200 overflow-hidden">
                                                <div 
                                                    onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                                                    className="flex items-center justify-between p-6 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-crust-100 group-hover:scale-110 transition-transform">
                                                            🍕
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-wood-800 uppercase tracking-tight text-sm">Order #{order.orderNumber}</p>
                                                            <p className="text-xs text-wood-500 font-bold uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <p className="text-lg font-black text-tomato-600 tracking-tighter">${order.total?.toFixed(2)}</p>
                                                            <div className="flex flex-col items-end gap-1 mt-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white text-wood-600 border border-crust-100 inline-block">
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={`w-8 h-8 rounded-full border border-crust-200 flex items-center justify-center transition-transform ${expandedOrderId === order._id ? 'rotate-180' : ''}`}>
                                                            ↓
                                                        </div>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {expandedOrderId === order._id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="px-6 pb-6"
                                                        >
                                                            <div className="pt-4 border-t border-crust-100 space-y-3">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-wood-400 mb-2">Order Items</p>
                                                                {order.items.map((item, i) => (
                                                                    <div key={i} className="flex justify-between items-center text-sm">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="w-6 h-6 rounded-lg bg-white border border-crust-100 flex items-center justify-center text-[10px] font-black text-tomato-500">
                                                                                {item.quantity}x
                                                                            </span>
                                                                            <span className="font-bold text-wood-700">{item.name}</span>
                                                                        </div>
                                                                        <span className="font-black text-wood-800">${(item.price * item.quantity).toFixed(2)}</span>
                                                                    </div>
                                                                ))}
                                                                
                                                                <div className="flex justify-between items-center pt-4 mt-2 border-t border-crust-100 border-dashed">
                                                                    <div className="flex flex-col gap-1">
                                                                        {order.pointsEarned > 0 && (
                                                                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">+ {order.pointsEarned} pts earned</span>
                                                                        )}
                                                                        {order.pointsRedeemed > 0 && (
                                                                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">- {order.pointsRedeemed} pts used</span>
                                                                        )}
                                                                    </div>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                                                                        className="px-6 py-2 bg-tomato-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-tomato-600/20 hover:bg-tomato-700 transition-colors"
                                                                    >
                                                                        Reorder This
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>

                            {/* Address Book Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-white rounded-[2.5rem] p-10 shadow-crust border border-crust-100"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-display font-black text-2xl text-wood-800 tracking-tight uppercase">Address Book</h3>
                                    <button 
                                        onClick={() => setIsAddingAddress(!isAddingAddress)}
                                        className="bg-wood-800 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                                    >
                                        {isAddingAddress ? 'Cancel' : '+ Add Address'}
                                    </button>
                                </div>

                                {isAddingAddress && (
                                    <form onSubmit={handleAddAddress} className="mb-8 p-6 bg-crust-50 rounded-3xl border border-crust-200 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <input 
                                                required
                                                placeholder="Label (e.g. Home, Work)" 
                                                className="bg-white border border-crust-200 rounded-xl px-4 py-3 outline-none focus:border-tomato-500 transition-all font-bold text-sm"
                                                value={newAddress.label}
                                                onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                                            />
                                            <input 
                                                required
                                                placeholder="Street Address" 
                                                className="bg-white border border-crust-200 rounded-xl px-4 py-3 outline-none focus:border-tomato-500 transition-all font-bold text-sm"
                                                value={newAddress.street}
                                                onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                                            />
                                            <input 
                                                required
                                                placeholder="City" 
                                                className="bg-white border border-crust-200 rounded-xl px-4 py-3 outline-none focus:border-tomato-500 transition-all font-bold text-sm"
                                                value={newAddress.city}
                                                onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                                            />
                                            <input 
                                                placeholder="Zip Code" 
                                                className="bg-white border border-crust-200 rounded-xl px-4 py-3 outline-none focus:border-tomato-500 transition-all font-bold text-sm"
                                                value={newAddress.zip}
                                                onChange={e => setNewAddress({...newAddress, zip: e.target.value})}
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 accent-tomato-500"
                                                checked={newAddress.isDefault}
                                                onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})}
                                            />
                                            <span className="text-xs font-bold text-wood-600 group-hover:text-wood-800">Set as default address</span>
                                        </label>
                                        <button type="submit" className="w-full py-3 bg-tomato-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-tomato-600/20 hover:bg-tomato-700 transition-all">
                                            Save Address
                                        </button>
                                    </form>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(profile?.addressBook || []).length === 0 ? (
                                        <div className="col-span-2 text-center py-10 opacity-50">
                                            <p className="font-bold text-sm">No saved addresses</p>
                                        </div>
                                    ) : (
                                        profile.addressBook.map((addr) => (
                                            <div key={addr._id} className="p-6 bg-crust-50 rounded-3xl border border-crust-100 hover:border-crust-200 transition-all relative group">
                                                {addr.isDefault && <span className="absolute top-4 right-4 text-[8px] bg-[#EBB250] text-[#1A1410] px-2 py-0.5 rounded font-black uppercase tracking-widest">Default</span>}
                                                <h4 className="font-black text-wood-800 uppercase tracking-tight text-sm mb-2">{addr.label}</h4>
                                                <p className="text-xs text-wood-600 font-bold mb-1 leading-relaxed">{addr.street}</p>
                                                <p className="text-[10px] text-wood-400 font-black uppercase tracking-widest">{addr.city}, {addr.zip}</p>
                                                
                                                <div className="mt-4 flex gap-2">
                                                    <button 
                                                        onClick={() => handleDeleteAddress(addr._id)}
                                                        className="text-[9px] font-black text-tomato-600 uppercase tracking-tighter hover:underline"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
