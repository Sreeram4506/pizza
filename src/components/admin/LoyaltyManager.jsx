import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function LoyaltyManager() {
    const [loyaltyConfig, setLoyaltyConfig] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showRewardModal, setShowRewardModal] = useState(false)
    const [isEditingConfig, setIsEditingConfig] = useState(false)
    const [newReward, setNewReward] = useState({
        name: '',
        pointsCost: '',
        discountValue: '',
        discountType: 'fixed'
    })

    useEffect(() => {
        fetchLoyaltyConfig()
    }, [])

    const fetchLoyaltyConfig = async () => {
        try {
            const token = localStorage.getItem('adminToken')
            const res = await fetch('/api/customers/loyalty/config', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                setLoyaltyConfig(await res.json())
            }
        } catch (err) {
            console.error('Failed to fetch loyalty config:', err)
            toast.error('Failed to load loyalty settings')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateConfig = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('adminToken')
            const res = await fetch('/api/customers/loyalty/config', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loyaltyConfig)
            })
            if (res.ok) {
                toast.success('Loyalty settings updated')
                setIsEditingConfig(false)
            }
        } catch (err) {
            toast.error('Failed to update config')
        }
    }

    const handleSaveReward = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('adminToken')
            const res = await fetch('/api/customers/loyalty/rewards', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newReward,
                    pointsCost: Number(newReward.pointsCost),
                    discountValue: Number(newReward.discountValue)
                })
            })

            if (res.ok) {
                toast.success('Reward added!')
                setShowRewardModal(false)
                setNewReward({
                    name: '',
                    pointsCost: '',
                    discountValue: '',
                    discountType: 'fixed'
                })
                fetchLoyaltyConfig()
            }
        } catch (err) {
            console.error('Failed to save reward:', err)
            toast.error('Failed to save reward')
        }
    }

    const handleDeleteReward = async (rewardId) => {
        if (!confirm('Are you sure you want to remove this reward?')) return

        try {
            const token = localStorage.getItem('adminToken')
            const updatedRewards = (loyaltyConfig?.rewards || []).filter(r => r._id !== rewardId)
            const res = await fetch('/api/customers/loyalty/config', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...loyaltyConfig, rewards: updatedRewards })
            })
            if (res.ok) {
                toast.success('Reward removed')
                fetchLoyaltyConfig()
            }
        } catch (err) {
            toast.error('Failed to remove reward')
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
                <p className="text-xs font-bold text-wood-400 uppercase tracking-widest animate-pulse">Syncing Rewards...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-24 lg:pb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">Loyalty HQ</h2>
                    <p className="text-wood-400 text-sm mt-1">Configure rewards and loyalty tiers</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditingConfig(!isEditingConfig)}
                        className="px-6 py-3 bg-wood-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-wood-600 transition-colors"
                    >
                        {isEditingConfig ? 'Cancel' : '⚙️ Config'}
                    </button>
                    <button
                        onClick={() => setShowRewardModal(true)}
                        className="px-6 py-3 bg-basil-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-basil-600/20"
                    >
                        + New Reward
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isEditingConfig && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleUpdateConfig} className="bg-wood-800 border border-basil-600/30 rounded-3xl p-6 mb-6 space-y-4">
                            <h4 className="text-basil-400 text-[10px] font-black uppercase tracking-widest">Global Configuration</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Points per $1</label>
                                    <input
                                        type="number"
                                        value={loyaltyConfig?.pointsPerDollar || 0}
                                        onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, pointsPerDollar: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white outline-none focus:border-basil-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Welcome Bonus</label>
                                    <input
                                        type="number"
                                        value={loyaltyConfig?.welcomeBonus || 0}
                                        onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, welcomeBonus: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white outline-none focus:border-basil-500"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button type="submit" className="w-full py-3 bg-basil-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Save Settings</button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(!loyaltyConfig || loyaltyConfig.rewards?.length === 0) ? (
                    <div className="md:col-span-2 bg-wood-800 rounded-3xl py-16 text-center border border-wood-700">
                        <span className="text-4xl mb-4 block">📦</span>
                        <p className="text-xs font-black uppercase tracking-widest text-wood-400">No rewards active</p>
                    </div>
                ) : (
                    loyaltyConfig.rewards.map((reward) => (
                        <div key={reward._id} className="bg-wood-800 rounded-2xl p-5 border border-wood-700 flex justify-between items-center group">
                            <div>
                                <p className="text-white font-black text-lg">{reward.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-tomato-400 text-xs font-bold">{reward.pointsCost} POINTS</span>
                                    <span className="text-wood-500 text-[10px]">•</span>
                                    <span className="text-basil-400 text-xs font-bold uppercase tracking-widest">{reward.discountType === 'percentage' ? `${reward.discountValue}%` : `$${reward.discountValue}`} OFF</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteReward(reward._id)}
                                className="w-10 h-10 bg-wood-700 rounded-xl flex items-center justify-center text-wood-400 opacity-0 group-hover:opacity-100 hover:bg-tomato-600 hover:text-white transition-all"
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Reward Modal */}
            <AnimatePresence>
                {showRewardModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] p-4 flex items-center justify-center" onClick={() => setShowRewardModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-wood-800 w-full max-w-sm rounded-[2.5rem] border border-wood-700 p-8"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-display font-black text-white mb-6">Forge Reward</h3>
                            <form onSubmit={handleSaveReward} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Title</label>
                                    <input type="text" value={newReward.name} onChange={(e) => setNewReward({ ...newReward, name: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" placeholder="Free Pizza slice" required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Points Cost</label>
                                        <input type="number" value={newReward.pointsCost} onChange={(e) => setNewReward({ ...newReward, pointsCost: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Value</label>
                                        <input type="number" step="0.01" value={newReward.discountValue} onChange={(e) => setNewReward({ ...newReward, discountValue: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" required />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Reward Type</label>
                                    <div className="grid grid-cols-2 gap-2 bg-wood-700 p-1 rounded-xl">
                                        {['fixed', 'percentage'].map(type => (
                                            <button key={type} type="button" onClick={() => setNewReward({ ...newReward, discountType: type })} className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newReward.discountType === type ? 'bg-tomato-600 text-white shadow-md' : 'text-wood-400'}`}>
                                                {type === 'fixed' ? 'Fixed ($)' : 'Percent (%)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button type="button" onClick={() => setShowRewardModal(false)} className="flex-1 py-4 bg-wood-700 text-wood-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Back</button>
                                    <button type="submit" className="flex-1 py-4 bg-basil-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-basil-600/20">Forge</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
