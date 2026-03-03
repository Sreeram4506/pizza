import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tiers = {
  bronze: { color: 'bg-amber-600', text: 'text-amber-400', label: 'Bronze' },
  silver: { color: 'bg-slate-400', text: 'text-slate-300', label: 'Silver' },
  gold: { color: 'bg-yellow-500', text: 'text-yellow-400', label: 'Gold' },
  platinum: { color: 'bg-purple-500', text: 'text-purple-400', label: 'Platinum' }
}

export default function CustomerManager() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loyaltyConfig, setLoyaltyConfig] = useState(null)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    pointsCost: '',
    discountValue: '',
    discountType: 'fixed'
  })

  useEffect(() => {
    fetchCustomers()
    fetchLoyaltyConfig()
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    } finally {
      setLoading(false)
    }
  }

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
        body: JSON.stringify(newReward)
      })

      if (res.ok) {
        setShowRewardModal(false)
        setNewReward({
          name: '',
          description: '',
          pointsCost: '',
          discountValue: '',
          discountType: 'fixed'
        })
        fetchLoyaltyConfig()
      }
    } catch (err) {
      console.error('Failed to save reward:', err)
    }
  }

  const handleAwardPoints = async (customerId, points) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/customers/${customerId}/award-points`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ points, reason: 'Manual bonus' })
      })

      if (res.ok) {
        fetchCustomers()
        if (selectedCustomer?._id === customerId) {
          const updated = await res.json()
          setSelectedCustomer(updated)
        }
      }
    } catch (err) {
      console.error('Failed to award points:', err)
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const stats = [
    { label: 'Total Customers', value: customers.length, icon: '👥', color: 'text-blue-400' },
    { label: 'Points Owed', value: customers.reduce((sum, c) => sum + (c.loyalty?.points || 0), 0).toLocaleString(), icon: '🏆', color: 'text-amber-400' },
    { label: 'Avg Spend', value: `$${(customers.length > 0 ? customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / customers.length : 0).toFixed(2)}`, icon: '💰', color: 'text-basil-400' }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
        <p className="text-xs font-bold text-wood-400 uppercase tracking-widest animate-pulse">Syncing Members...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-24 lg:pb-10">
      {/* ── Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">Customer Lab</h2>
          <p className="text-wood-400 text-sm mt-1">Loyalty management and member insights</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowRewardModal(true)}
          className="px-6 py-3 bg-basil-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-basil-600/20"
        >
          + Create Reward
        </motion.button>
      </div>

      {/* ── Stats Grid ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-wood-800 rounded-2xl p-4 border border-wood-700">
            <span className="text-xl mb-2 block">{stat.icon}</span>
            <p className="text-wood-400 text-[10px] font-black uppercase tracking-widest leading-none">{stat.label}</p>
            <p className={`text-xl sm:text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filters ────────────────── */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-5 py-4 bg-wood-800 border-2 border-wood-700 focus:border-tomato-500 rounded-2xl text-white outline-none transition-all placeholder:text-wood-500 text-sm"
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-wood-400">🔍</span>
      </div>

      {/* ── Rewards Pills ──────────────────── */}
      {loyaltyConfig?.rewards?.length > 0 && (
        <div className="space-y-3">
          <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest ml-1">Current Rewards</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {loyaltyConfig.rewards.map((reward) => (
              <div key={reward._id} className="flex-shrink-0 bg-wood-800 rounded-xl px-4 py-3 border border-wood-700 min-w-[140px]">
                <p className="text-white text-xs font-black truncate">{reward.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-tomato-400 text-[10px] font-bold">{reward.pointsCost} pts</span>
                  <span className="text-basil-400 text-[9px] font-bold uppercase tracking-tight">{reward.discountType === 'percentage' ? `${reward.discountValue}%` : `$${reward.discountValue}`} Off</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Customer List ───────────────────── */}
      <div className="grid grid-cols-1 gap-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-wood-800 rounded-3xl py-16 text-center border border-wood-700">
            <span className="text-4xl mb-4 block">👻</span>
            <p className="text-xs font-black uppercase tracking-widest text-wood-400">No members found</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <motion.div
              key={customer._id}
              onClick={() => setSelectedCustomer(customer)}
              className="bg-wood-800 rounded-2xl p-4 border border-wood-700 hover:border-wood-600 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-crust-500 rounded-full flex items-center justify-center text-xl text-black font-black flex-shrink-0 group-hover:bg-tomato-500 transition-colors">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold truncate text-sm sm:text-base">{customer.name}</h3>
                    {customer.isGuest && (
                      <span className="text-[9px] bg-wood-700 text-wood-400 px-2 py-0.5 rounded-full font-black uppercase">Guest</span>
                    )}
                  </div>
                  <p className="text-wood-400 text-xs truncate mt-0.5">{customer.phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className={`w-2 h-2 rounded-full ${tiers[customer.loyalty?.tier || 'bronze'].color}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{customer.loyalty?.tier || 'Bronze'}</span>
                  </div>
                  <p className="text-tomato-400 text-sm font-black mt-1">{customer.loyalty?.points || 0} PTS</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── Detail Modal (Mobile Drawer) ─────── */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] p-3 flex items-end sm:items-center justify-center" onClick={() => setSelectedCustomer(null)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-wood-800 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-wood-700 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-tomato-600 rounded-2xl flex items-center justify-center text-2xl font-black text-black">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-black text-white">{selectedCustomer.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tiers[selectedCustomer.loyalty?.tier || 'bronze'].color} text-white`}>
                        {selectedCustomer.loyalty?.tier || 'Bronze'} Member
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="w-10 h-10 bg-wood-700 rounded-full flex items-center justify-center text-wood-300">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-wood-700/50 rounded-2xl p-4 border border-wood-700">
                  <p className="text-wood-400 text-[10px] font-black uppercase tracking-widest leading-none">Total Orders</p>
                  <p className="text-white text-2xl font-black mt-2">{selectedCustomer.orderCount || 0}</p>
                </div>
                <div className="bg-wood-700/50 rounded-2xl p-4 border border-wood-700">
                  <p className="text-wood-400 text-[10px] font-black uppercase tracking-widest leading-none">Total Spent</p>
                  <p className="text-tomato-400 text-2xl font-black mt-2">${(selectedCustomer.totalSpent || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-basil-600/10 to-basil-600/5 rounded-3xl p-6 border border-basil-600/20 mb-8">
                <p className="text-wood-300 text-xs font-bold mb-1">Available Points</p>
                <div className="flex items-end justify-between">
                  <p className="text-white text-4xl font-black leading-none">{selectedCustomer.loyalty?.points || 0}</p>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleAwardPoints(selectedCustomer._id, 50)} className="px-4 py-2 bg-basil-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-basil-600/20 hover:bg-basil-700 transition-colors">+50 Bonus</button>
                  </div>
                </div>
              </div>

              <section className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1 block mb-2">Contact Details</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-wood-700/30 p-3 rounded-xl border border-wood-700/50">
                      <span className="text-sm">📧</span>
                      <span className="text-sm text-white font-medium truncate">{selectedCustomer.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-wood-700/30 p-3 rounded-xl border border-wood-700/50">
                      <span className="text-sm">📞</span>
                      <span className="text-sm text-white font-medium">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                </div>
                {selectedCustomer.lastOrderAt && (
                  <p className="text-[10px] text-wood-500 font-bold uppercase tracking-widest text-center italic">Last seen: {new Date(selectedCustomer.lastOrderAt).toLocaleDateString()}</p>
                )}
              </section>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-5 bg-wood-700 text-wood-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-wood-600 transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Reward Modal ────────────────────── */}
      <AnimatePresence>
        {showRewardModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] p-4 flex items-center justify-center shadow-2xl" onClick={() => setShowRewardModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-wood-800 w-full max-w-sm rounded-[2.5rem] border border-wood-700 p-8"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-display font-black text-white mb-6">Create Reward</h3>
              <form onSubmit={handleSaveReward} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Reward Name</label>
                  <input type="text" value={newReward.name} onChange={(e) => setNewReward({ ...newReward, name: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" required />
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
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Discount Type</label>
                  <div className="grid grid-cols-2 gap-2 bg-wood-700 p-1 rounded-xl">
                    {['fixed', 'percentage'].map(type => (
                      <button key={type} type="button" onClick={() => setNewReward({ ...newReward, discountType: type })} className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newReward.discountType === type ? 'bg-tomato-600 text-white shadow-md' : 'text-wood-400'}`}>
                        {type === 'fixed' ? 'Fixed ($)' : 'Percent (%)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setShowRewardModal(false)} className="flex-1 py-4 bg-wood-700 text-wood-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-basil-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-basil-600/20">Launch Reward</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
