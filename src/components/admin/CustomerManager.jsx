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

  const stats = {
    total: customers.length,
    totalPoints: customers.reduce((sum, c) => sum + (c.loyalty?.points || 0), 0),
    avgOrderValue: customers.length > 0
      ? customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / customers.length
      : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-10 h-10 border-3 border-tomato-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-black text-white">Customer Management</h2>
          <p className="text-wood-400 mt-1">View customer profiles and manage loyalty program</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            onClick={() => setShowRewardModal(true)}
            className="px-4 py-2 bg-basil-600 text-white rounded-lg font-medium hover:bg-basil-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            + Create Reward
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', value: stats.total, icon: '👥' },
          { label: 'Points Outstanding', value: stats.totalPoints.toLocaleString(), icon: '🏆' },
          { label: 'Avg. Order Value', value: `$${stats.avgOrderValue.toFixed(2)}`, icon: '💰' }
        ].map((stat) => (
          <div key={stat.label} className="bg-wood-800 rounded-xl p-4 border border-wood-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-wood-400 text-sm">{stat.label}</p>
                <p className="text-white text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-wood-800 border border-wood-700 rounded-xl text-white placeholder:text-wood-500 focus:border-tomato-500 outline-none"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-wood-400">🔍</span>
      </div>

      {/* Loyalty Rewards */}
      {loyaltyConfig?.rewards?.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Available Rewards</h3>
          <div className="flex gap-3 flex-wrap">
            {loyaltyConfig.rewards.map((reward) => (
              <div key={reward._id} className="bg-wood-800 rounded-lg p-3 border border-wood-700">
                <p className="text-white font-medium">{reward.name}</p>
                <p className="text-tomato-400 text-sm">{reward.pointsCost} points</p>
                <p className="text-wood-400 text-xs">{reward.discountType === 'percentage' ? `${reward.discountValue}% off` : `$${reward.discountValue} off`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-wood-800 rounded-xl border border-wood-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-wood-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Orders</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Spent</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Loyalty</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wood-700">
            {filteredCustomers.map((customer) => (
              <tr key={customer._id} className="hover:bg-wood-700/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-crust-500 rounded-full flex items-center justify-center text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{customer.name}</p>
                      {customer.isGuest && (
                        <span className="text-xs bg-wood-600 text-wood-300 px-2 py-0.5 rounded">Guest</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-wood-300 text-sm">{customer.phone}</p>
                  <p className="text-wood-400 text-xs">{customer.email || '-'}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-white font-medium">{customer.orderCount || 0}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-tomato-400 font-medium">${(customer.totalSpent || 0).toFixed(2)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${tiers[customer.loyalty?.tier || 'bronze'].color
                      } ${tiers[customer.loyalty?.tier || 'bronze'].text} bg-opacity-20`}>
                      {tiers[customer.loyalty?.tier || 'bronze'].label}
                    </span>
                    <span className="text-wood-300 text-sm">{customer.loyalty?.points || 0} pts</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="p-2 text-wood-400 hover:text-white hover:bg-wood-600 rounded-lg"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleAwardPoints(customer._id, 50)}
                      className="px-3 py-1 bg-basil-600/20 text-basil-400 rounded-lg text-sm hover:bg-basil-600/30"
                    >
                      +50 pts
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-wood-400">
            <p className="text-4xl mb-4">👤</p>
            <p>No customers found</p>
          </div>
        )}
      </div>

      {/* Create Reward Modal */}
      <AnimatePresence>
        {showRewardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRewardModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-wood-800 rounded-2xl p-6 w-full max-w-md border border-wood-700"
            >
              <h3 className="text-xl font-bold text-white mb-4">Create Loyalty Reward</h3>
              <form onSubmit={handleSaveReward} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Reward Name</label>
                  <input
                    type="text"
                    value={newReward.name}
                    onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Description</label>
                  <textarea
                    value={newReward.description}
                    onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-wood-300 mb-1">Points Cost</label>
                    <input
                      type="number"
                      value={newReward.pointsCost}
                      onChange={(e) => setNewReward({ ...newReward, pointsCost: e.target.value })}
                      className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-wood-300 mb-1">Discount Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newReward.discountValue}
                      onChange={(e) => setNewReward({ ...newReward, discountValue: e.target.value })}
                      className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Discount Type</label>
                  <select
                    value={newReward.discountType}
                    onChange={(e) => setNewReward({ ...newReward, discountType: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  >
                    <option value="fixed">Fixed Amount ($)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRewardModal(false)}
                    className="flex-1 px-4 py-2 bg-wood-700 text-white rounded-lg hover:bg-wood-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-tomato-600 text-white rounded-lg hover:bg-tomato-700"
                  >
                    Create Reward
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-wood-800 rounded-2xl w-full max-w-lg border border-wood-700"
            >
              <div className="p-6 border-b border-wood-700">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-crust-500 rounded-full flex items-center justify-center text-2xl">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedCustomer.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${tiers[selectedCustomer.loyalty?.tier || 'bronze'].color
                      } ${tiers[selectedCustomer.loyalty?.tier || 'bronze'].text} bg-opacity-20`}>
                      {tiers[selectedCustomer.loyalty?.tier || 'bronze'].label} Member
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-wood-700/50 rounded-lg p-4 text-center">
                    <p className="text-wood-400 text-sm">Total Orders</p>
                    <p className="text-white text-2xl font-bold">{selectedCustomer.orderCount || 0}</p>
                  </div>
                  <div className="bg-wood-700/50 rounded-lg p-4 text-center">
                    <p className="text-wood-400 text-sm">Lifetime Points</p>
                    <p className="text-tomato-400 text-2xl font-bold">{selectedCustomer.loyalty?.lifetimePoints || 0}</p>
                  </div>
                </div>

                <div className="bg-wood-700/50 rounded-lg p-4">
                  <p className="text-wood-400 text-sm mb-2">Current Balance</p>
                  <div className="flex items-center justify-between">
                    <p className="text-white text-3xl font-bold">{selectedCustomer.loyalty?.points || 0}</p>
                    <button
                      onClick={() => handleAwardPoints(selectedCustomer._id, 100)}
                      className="px-4 py-2 bg-basil-600 text-white rounded-lg hover:bg-basil-700"
                    >
                      Award 100 pts
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-wood-400 text-sm mb-2">Contact Info</p>
                  <p className="text-white">📞 {selectedCustomer.phone}</p>
                  <p className="text-white">✉️ {selectedCustomer.email || 'No email'}</p>
                </div>

                {selectedCustomer.lastOrderAt && (
                  <div>
                    <p className="text-wood-400 text-sm mb-1">Last Order</p>
                    <p className="text-white">{new Date(selectedCustomer.lastOrderAt).toLocaleDateString()}</p>
                  </div>
                )}

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-full py-3 bg-wood-700 text-white rounded-lg hover:bg-wood-600"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
