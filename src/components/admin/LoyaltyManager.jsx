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

    useEffect(() => { fetchLoyaltyConfig() }, [])

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
                toast.success('Loyalty architecture updated')
                setIsEditingConfig(false)
            }
        } catch (err) {
            toast.error('Architectural update failed')
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
                toast.success('Reward asset created!')
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
            toast.error('Asset creation failed')
        }
    }

    const handleDeleteReward = async (rewardId) => {
        if (!confirm('Liquidate this reward asset?')) return

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
                toast.success('Asset liquidated')
                fetchLoyaltyConfig()
            }
        } catch (err) {
            toast.error('Liquidation failed')
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] animate-pulse">Synchronizing Loyalty Protocols</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
            {/* ── Loyalty Header ─────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-8 h-[1px] bg-emerald-600" />
                        <span className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-600">Retention Strategy</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-sans font-bold text-[#1A1410] leading-tight">
                        Loyalty HQ
                    </h2>
                    <p className="text-[#9B8D74] mt-2 font-medium tracking-tight">Engineer the perfect value loop for your elite patrons.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsEditingConfig(!isEditingConfig)}
                        className={`h-12 px-6 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 border shadow-sm ${isEditingConfig ? 'bg-[#1A1410] text-white border-black' : 'bg-white text-[#1A1410] border-[rgba(26,20,16,0.06)] hover:bg-[#F5F3EF]'
                            }`}
                    >
                        ⚙️ Architecture
                    </button>
                    <button
                        onClick={() => setShowRewardModal(true)}
                        className="h-12 px-8 bg-[#1A1410] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all active:scale-95"
                    >
                        + Create Asset
                    </button>
                </div>
            </div>

            {/* ── Architecture Controls ────────────────── */}
            <AnimatePresence>
                {isEditingConfig && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: -20 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -20 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleUpdateConfig} className="bg-white border border-[rgba(26,20,16,0.06)] rounded-[2.5rem] p-10 mb-8 shadow-sm">
                            <h4 className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] mb-8 pb-2 border-b border-[rgba(26,20,16,0.03)]">Core Parameters</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-1.5">
                                    <label className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Earnings Ratio (Pts/$1)</label>
                                    <input
                                        type="number"
                                        value={loyaltyConfig?.pointsPerDollar || 0}
                                        onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, pointsPerDollar: Number(e.target.value) })}
                                        className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Initiation Bonus</label>
                                    <input
                                        type="number"
                                        value={loyaltyConfig?.welcomeBonus || 0}
                                        onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, welcomeBonus: Number(e.target.value) })}
                                        className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button type="submit" className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/10 hover:bg-emerald-700 transition-all">Apply Protocols</button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Asset Inventory ──────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {(!loyaltyConfig || loyaltyConfig.rewards?.length === 0) ? (
                        <motion.div layout className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-[rgba(26,20,16,0.06)] shadow-inner">
                            <span className="text-5xl mb-6 block grayscale opacity-30">🎁</span>
                            <h3 className="font-sans font-bold text-2xl text-[#1A1410]">No Active Assets</h3>
                            <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#9B8D74] mt-2">The reward repository is currently empty.</p>
                        </motion.div>
                    ) : (
                        loyaltyConfig.rewards.map((reward) => (
                            <motion.div
                                key={reward._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[2.5rem] p-8 border border-[rgba(26,20,16,0.06)] shadow-sm hover:shadow-xl hover:shadow-[#1A1410]/5 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <button
                                        onClick={() => handleDeleteReward(reward._id)}
                                        className="w-10 h-10 bg-[#FAFAF8] rounded-full flex items-center justify-center text-[#9B8D74] opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <p className="text-[#1A1410] font-sans font-bold text-2xl group-hover:text-emerald-600 transition-colors">{reward.name}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="font-sans text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">Active Asset</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-[rgba(26,20,16,0.03)]">
                                    <div>
                                        <label className="font-sans text-[8px] font-bold uppercase tracking-widest text-[#9B8D74] block mb-1">Exchange Cost</label>
                                        <p className="text-emerald-600 font-sans font-bold text-3xl leading-none">{reward.pointsCost} <span className="text-[10px] font-sans uppercase font-bold opacity-30">PTS</span></p>
                                    </div>
                                    <div className="text-right">
                                        <label className="font-sans text-[8px] font-bold uppercase tracking-widest text-[#9B8D74] block mb-1">Asset Value</label>
                                        <p className="text-[#1A1410] font-sans text-xl font-bold tracking-tighter">
                                            {reward.discountType === 'percentage' ? `${reward.discountValue}%` : `$${reward.discountValue}`} <span className="text-[10px] font-sans uppercase font-bold opacity-30">OFF</span>
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* ── Asset Forging Modal ───────────────────── */}
            <AnimatePresence>
                {showRewardModal && (
                    <div className="fixed inset-0 bg-[#1A1410]/40 backdrop-blur-md z-[210] p-4 flex items-center justify-center" onClick={() => setShowRewardModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[3.5rem] border border-[rgba(26,20,16,0.06)] p-12 shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
                            <h3 className="text-4xl font-display font-black italic text-[#1A1410] mb-8">Forge Asset</h3>
                            <form onSubmit={handleSaveReward} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Asset Label</label>
                                    <input type="text" value={newReward.name} onChange={(e) => setNewReward({ ...newReward, name: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-sm" placeholder="Free Artisanal Selection" required />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Points Cost</label>
                                        <input type="number" value={newReward.pointsCost} onChange={(e) => setNewReward({ ...newReward, pointsCost: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-display font-black text-xl italic outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-sm" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Face Value</label>
                                        <input type="number" step="0.01" value={newReward.discountValue} onChange={(e) => setNewReward({ ...newReward, discountValue: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-mono text-xl font-black outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-sm" required />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Discount Logic</label>
                                    <div className="grid grid-cols-2 gap-2 bg-[#FAFAF8] p-1.5 rounded-2xl border border-[rgba(26,20,16,0.06)]">
                                        {['fixed', 'percentage'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewReward({ ...newReward, discountType: type })}
                                                className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newReward.discountType === type ? 'bg-[#1A1410] text-white shadow-lg' : 'text-[#9B8D74] hover:bg-white'}`}
                                            >
                                                {type === 'fixed' ? 'Currency ($)' : 'Proportion (%)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-6">
                                    <button type="button" onClick={() => setShowRewardModal(false)} className="h-14 bg-[#FAFAF8] text-[#9B8D74] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-[#1A1410] transition-colors">Discard</button>
                                    <button type="submit" className="h-14 bg-[#1A1410] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-black/10 hover:shadow-glow hover:shadow-emerald-500/10">Commit Asset</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
