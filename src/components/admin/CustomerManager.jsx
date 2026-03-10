import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const tiers = {
  bronze: { color: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-100', label: 'Bronze' },
  silver: { color: 'bg-slate-400', text: 'text-slate-700', border: 'border-slate-200', label: 'Silver' },
  gold: { color: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-100', label: 'Gold' },
  platinum: { color: 'bg-[#1A1410]', text: 'text-white', border: 'border-black', label: 'Platinum' }
}

export default function CustomerManager() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => { fetchCustomers() }, [])

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
      toast.error('Failed to sync members')
    } finally {
      setLoading(false)
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
        toast.success(`Awarded ${points} points!`)
        fetchCustomers()
        if (selectedCustomer?._id === customerId) {
          const { customer } = await res.json()
          setSelectedCustomer(customer)
        }
      }
    } catch (err) {
      toast.error('Failed to award points')
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const stats = [
    { label: 'Total Members', value: customers.length, icon: '🏛️', color: 'text-[#1A1410]' },
    { label: 'Member Value', value: `$${(customers.length > 0 ? customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / customers.length : 0).toFixed(2)}`, icon: '💎', color: 'text-ember-600' },
    { label: 'Participation', value: `${((customers.filter(c => (c.loyalty?.points || 0) > 0).length / customers.length) * 100 || 0).toFixed(0)}%`, icon: '🏆', color: 'text-amber-600' }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-ember-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-ember-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] animate-pulse">Syncing Registers</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
      {/* ── Customer Header ─────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-[1px] bg-ember-600" />
            <span className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-ember-600">Clientele Registry</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-[#1A1410] leading-tight">
            Customer Base
          </h2>
          <p className="text-[#9B8D74] mt-2 font-medium tracking-tight">Intelligence on your most loyal pizza patrons.</p>
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[2rem] p-8 border border-[rgba(26,20,16,0.06)] shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-500">{stat.icon}</span>
              <span className="w-1.5 h-1.5 bg-ember-100 rounded-full" />
            </div>
            <p className={`text-3xl font-sans font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
            <label className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#9B8D74] mt-1">{stat.label}</label>
          </motion.div>
        ))}
      </div>

      {/* ── Search Command ───────────────────────── */}
      <div className="relative group">
        <input
          type="text"
          placeholder="Filter by name, email, or credentials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-16 px-16 bg-white border border-[rgba(26,20,16,0.06)] focus:border-ember-500 rounded-3xl text-[#1A1410] font-bold outline-none transition-all shadow-sm placeholder:text-[#9B8D74]/40"
        />
        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold uppercase font-sans text-ember-600">Reset</button>
        )}
      </div>

      {/* ── Directory List ───────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.length === 0 ? (
            <motion.div layout className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-[rgba(26,20,16,0.06)] shadow-inner">
              <span className="text-5xl mb-6 block grayscale opacity-30">👤</span>
              <h3 className="font-sans font-bold text-2xl text-[#1A1410]">Registry Empty</h3>
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#9B8D74] mt-2">No members found matching your query</p>
            </motion.div>
          ) : (
            filteredCustomers.map((customer) => (
              <motion.div
                key={customer._id}
                layout
                onClick={() => setSelectedCustomer(customer)}
                className="bg-white rounded-3xl p-6 border border-[rgba(26,20,16,0.06)] hover:border-ember-200 hover:shadow-xl hover:shadow-[#1A1410]/5 transition-all cursor-pointer group flex items-center gap-6"
              >
                <div className="w-14 h-14 bg-[#F5F3EF] rounded-full flex items-center justify-center text-xl text-[#1A1410] font-black flex-shrink-0 group-hover:bg-[#1A1410] group-hover:text-white transition-all duration-500 shadow-inner">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[#1A1410] font-sans font-bold text-xl group-hover:text-ember-600 transition-colors truncate">{customer.name}</h3>
                    {customer.isGuest && (
                      <span className="font-sans text-[8px] bg-[#F5F3EF] text-[#9B8D74] px-2 py-0.5 rounded-md font-bold uppercase tracking-widest border border-[rgba(26,20,16,0.03)]">Guest</span>
                    )}
                  </div>
                  <p className="text-[#9B8D74] font-sans text-[10px] uppercase font-bold tracking-widest mt-1">{customer.phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-[#1A1410]">{customer.loyalty?.tier || 'Bronze'}</span>
                  </div>
                  <p className="text-ember-600 font-sans font-bold text-lg leading-none">{customer.loyalty?.points || 0} <span className="text-[10px] font-sans uppercase font-bold opacity-30">PTS</span></p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Client Profile Modal ─────────────────── */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-[#1A1410]/40 backdrop-blur-md z-[200] p-4 flex items-center justify-center" onClick={() => setSelectedCustomer(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="bg-white w-full max-w-xl rounded-[4rem] border border-[rgba(26,20,16,0.06)] p-12 max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1A1410]" />

              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-[#1A1410] rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-black/10">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-4xl font-sans font-bold text-[#1A1410] leading-none mb-2">{selectedCustomer.name}</h3>
<h4 className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] border-b border-[rgba(26,20,16,0.06)] pb-2">Communications Audit</h4>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-full font-sans text-[9px] font-bold uppercase tracking-widest border shadow-sm ${tiers[selectedCustomer.loyalty?.tier || 'bronze'].color} text-white`}>
                        {selectedCustomer.loyalty?.tier || 'Bronze'} Member
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="w-12 h-12 bg-[#F5F3EF] rounded-full flex items-center justify-center text-[#9B8D74] hover:bg-rose-500 hover:text-white transition-all font-bold">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-[#FAFAF8] rounded-[2rem] p-6 border border-[rgba(26,20,16,0.03)] shadow-inner">
                  <label className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#9B8D74]">Lifetime Orders</label>
                  <p className="font-display font-black text-3xl italic text-[#1A1410] mt-2">{selectedCustomer.orderCount || 0}</p>
                </div>
                <div className="bg-[#FAFAF8] rounded-[2rem] p-6 border border-[rgba(26,20,16,0.03)] shadow-inner">
                  <label className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#9B8D74]">Gross Expenditure</label>
                  <p className="font-display font-black text-3xl italic text-ember-600 mt-2">${(selectedCustomer.totalSpent || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-[#1A1410] rounded-[2.5rem] p-10 mb-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 opacity-10 blur-xl w-32 h-32 bg-ember-400 rounded-full -translate-y-1/2 translate-x-1/2" />
                <label className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-ember-400 mb-2 block">Curent Accrual</label>
                <div className="flex items-end justify-between">
                  <p className="text-white font-display font-black italic text-6xl leading-none">{selectedCustomer.loyalty?.points || 0}</p>
                  <button
                    onClick={() => handleAwardPoints(selectedCustomer._id, 50)}
                    className="h-12 px-8 bg-white text-[#1A1410] rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-ember-400 hover:text-white transition-all shadow-xl shadow-black/20"
                  >
                    +50 Manual Bonus
                  </button>
                </div>
              </div>

              <section className="space-y-6 mb-10">
                <h4 className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[#9B8D74] border-b border-[rgba(26,20,16,0.06)] pb-2">Communications Audit</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-[#FAFAF8] p-5 rounded-2xl border border-[rgba(26,20,16,0.03)]">
                    <span className="text-xl">📧</span>
                    <div>
                      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-[#9B8D74] mb-0.5">Electronic Mail</p>
                      <p className="font-bold text-sm text-[#1A1410]">{selectedCustomer.email || 'None Record'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-[#FAFAF8] p-5 rounded-2xl border border-[rgba(26,20,16,0.03)]">
                    <span className="text-xl">📞</span>
                    <div>
                      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-[#9B8D74] mb-0.5">Telephonic Link</p>
                      <p className="font-bold text-sm text-[#1A1410]">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                </div>
                {selectedCustomer.lastOrderAt && (
                  <p className="font-mono text-[9px] text-[#9B8D74] font-black uppercase tracking-widest text-center mt-6 italic opacity-50">Last Active Engagement: {new Date(selectedCustomer.lastOrderAt).toLocaleDateString()}</p>
                )}
              </section>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full h-18 bg-[#FAFAF8] text-[#1A1410] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F5F3EF] transition-all border border-[rgba(26,20,16,0.06)]"
              >
                Terminate Session
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
