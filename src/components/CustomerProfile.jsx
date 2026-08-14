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
            // We'll create this endpoint in the backend
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setProfile(data.user)
                setOrders(data.orders || [])
                setAvailableRewards(data.availableRewards || [])
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
        // Since we are interacting with the Context Cart via the Chatbot/OrderService interface
        // We simulate "adding to cart" and opening the checkout summary
        const reorderItems = pastOrder.items.map(item => `${item.quantity}x ${item.menuItem?.name || 'Custom Pizza'}`).join(', ')
        toast.success(`Reordering: ${reorderItems}`, { duration: 4000 })

        // Open checkout directly with the total price and an intent to skip building
        openWithIntent('checkout', {
            item: `Reorder #${pastOrder.orderNumber}`,
            price: pastOrder.total.toFixed(2)
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-ember-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    const tiers = {
        bronze: { color: 'bg-amber-600', text: 'text-amber-600', label: 'Bronze' },
        silver: { color: 'bg-slate-400', text: 'text-slate-500', label: 'Silver' },
        gold: { color: 'bg-yellow-500', text: 'text-yellow-600', label: 'Gold' },
        platinum: { color: 'bg-purple-500', text: 'text-purple-600', label: 'Platinum' }
    }

    const currentTier = tiers[profile?.loyalty?.tier || 'bronze']

    return (
        <div className="min-h-screen bg-[#FAFAF8] selection:bg-ember-200">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-full md:w-1/3 bg-white rounded-[2.5rem] p-10 shadow-ember border border-[#EBEBE6]"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-ember-500 to-orange-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg mb-6 text-white">
                                    {profile?.name?.charAt(0).toUpperCase()}
                                </div>
                                <h2 className="font-display font-black text-3xl text-[#1A1410] tracking-tight mb-2 uppercase">{profile?.name}</h2>
                                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${currentTier.color} text-white mb-6 shadow-md`}>
                                    {currentTier.label} Member
                                </div>

                                <div className="w-full space-y-4 text-left border-t border-[#EBEBE6] pt-8">
                                    <div className="flex items-center gap-4 text-[#1A1410]/60">
                                        <span className="w-10 h-10 bg-[#F5F3EF] rounded-xl flex items-center justify-center">✉️</span>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9B8D74]">Email Address</p>
                                            <p className="font-bold text-sm">{profile?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-[#1A1410]/60">
                                        <span className="w-10 h-10 bg-[#F5F3EF] rounded-xl flex items-center justify-center">📞</span>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9B8D74]">Phone Number</p>
                                            <p className="font-bold text-sm">{profile?.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full mt-8 pt-6 border-t border-[#EBEBE6] space-y-3">
                                    <button
                                        onClick={() => navigate('/')}
                                        className="w-full py-3 bg-[#F5F3EF] hover:bg-[#EBEBE6] text-[#1A1410]/60 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>🏠</span> Back to Home
                                    </button>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('customerToken');
                                            toast.success('Logged out successfully');
                                            navigate('/');
                                        }}
                                        className="w-full py-3 border border-ember-200 hover:bg-ember-50 text-ember-600 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center gap-2"
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
                                className="bg-[#1A1410] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl group"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-ember-500/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-transform group-hover:scale-125" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <p className="text-ember-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Loyalty Points Balance</p>
                                            <h3 className="text-6xl font-black tracking-tighter">{profile?.loyalty?.points || 0} <span className="text-2xl text-[#9B8D74] tracking-normal ml-1">pts</span></h3>
                                        </div>
                                        <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center text-3xl italic font-black text-ember-500 border border-white/10 shadow-xl">
                                            PB
                                        </div>
                                    </div>

                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                        <div className="flex justify-between text-sm font-bold uppercase tracking-widest mb-3">
                                            <span>Tier Progress</span>
                                            <span className="text-ember-400">{profile?.loyalty?.points || 0} / 500 to Silver</span>
                                        </div>
                                        <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((profile?.loyalty?.points || 0) / 500 * 100, 100)}%` }}
                                                className="h-full bg-gradient-to-r from-ember-500 to-orange-400 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                            />
                                        </div>
                                    </div>

                                    {availableRewards.length > 0 && (
                                        <div className="mt-8 pt-8 border-t border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9B8D74] mb-4">Available Rewards</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {availableRewards.map((reward, i) => {
                                                    const canAfford = (profile?.loyalty?.points || 0) >= reward.pointsCost;
                                                    return (
                                                        <div key={i} className={`p-4 rounded-xl border ${canAfford ? 'bg-ember-500/10 border-ember-500/30' : 'bg-white/5 border-white/10 opacity-60'}`}>
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-bold text-sm text-white">{reward.name}</p>
                                                                    <p className="text-[10px] text-[#9B8D74] mt-1 uppercase font-bold tracking-wider">{reward.discountType === 'percentage' ? `${reward.discountValue}% OFF` : `$${reward.discountValue} OFF`}</p>
                                                                </div>
                                                                <span className={`text-xs font-black ${canAfford ? 'text-ember-400' : 'text-[#9B8D74]'}`}>{reward.pointsCost} PTS</span>
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
                                className="bg-white rounded-[2.5rem] p-10 shadow-ember border border-[#EBEBE6]"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-display font-black text-2xl text-[#1A1410] tracking-tight uppercase">Recent Orders</h3>
                                    <button className="text-ember-600 font-black text-xs uppercase tracking-widest hover:text-ember-700 transition-colors">View All History →</button>
                                </div>

                                <div className="space-y-4">
                                    {orders.length === 0 ? (
                                        <div className="text-center py-12 bg-[#F5F3EF] rounded-3xl border-2 border-dashed border-[#EBEBE6]">
                                            <span className="text-4xl mb-4 block">🍕</span>
                                            <p className="text-[#9B8D74] font-medium">No orders yet. Ready for your first slice?</p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="mt-6 px-8 py-3 bg-ember-600 text-white rounded-full font-black uppercase tracking-widest shadow-lg hover:bg-ember-700 transition-all"
                                            >
                                                Order Now
                                            </button>
                                        </div>
                                    ) : (
                                        orders.map((order, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-6 bg-[#F5F3EF] rounded-3xl hover:bg-[#EBEBE6] transition-all group border border-transparent hover:border-[#EBEBE6]">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-[#EBEBE6] group-hover:scale-110 transition-transform">
                                                        🍕
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-[#1A1410] uppercase tracking-tight text-sm">Order #{order.orderNumber}</p>
                                                        <p className="text-xs text-[#9B8D74] font-bold uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-ember-600 tracking-tighter">${order.total?.toFixed(2)}</p>
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white text-[#1A1410]/60 border border-[#EBEBE6] mt-1 inline-block">
                                                        {order.status}
                                                    </span>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                                                        className="ml-3 px-4 py-1.5 bg-ember-50 text-ember-600 border border-ember-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-ember-600 hover:text-white transition-colors"
                                                    >
                                                        Reorder
                                                    </motion.button>
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
