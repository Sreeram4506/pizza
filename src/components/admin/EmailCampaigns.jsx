import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [sendingEmail, setSendingEmail] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    message: '',
    template: 'custom',
    fromName: '',
    replyTo: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadCampaigns()
    loadCustomers()
  }, [])

  const loadCampaigns = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/email-campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) setCampaigns(await response.json())
    } catch (err) {
      console.error('Failed to load campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/customers/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) setCustomers(await response.json())
    } catch (err) {
      console.error('Failed to load customers:', err)
    }
  }

  const handleSendCampaign = async (e) => {
    e.preventDefault()
    if (selectedCustomers.length === 0) return toast.error('Please select recipients')
    setSendingEmail(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newCampaign,
          recipients: selectedCustomers.map(c => ({ customerId: c._id, email: c.email, name: c.name })),
          sendNow: true
        })
      })
      if (response.ok) {
        const saved = await response.json()
        setCampaigns(prev => [saved, ...prev])
        setShowCreateModal(false)
        resetForm()
        toast.success('Campaign launched!')
      }
    } catch (err) {
      toast.error('Failed to launch campaign')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSaveDraft = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCampaign,
          recipients: selectedCustomers.map(c => ({ customerId: c._id, email: c.email, name: c.name })),
          sendNow: false
        })
      })
      if (response.ok) {
        const saved = await response.json()
        setCampaigns([saved, ...campaigns])
        setShowCreateModal(false)
        resetForm()
        toast.success('Draft saved')
      }
    } catch (err) {
      toast.error('Failed to save draft')
    }
  }

  const resetForm = () => {
    setNewCampaign({ name: '', subject: '', message: '', template: 'custom', fromName: '', replyTo: '' })
    setSelectedCustomers([])
  }

  const toggleCustomerSelection = (customer) => {
    setSelectedCustomers(prev =>
      prev.find(c => c._id === customer._id)
        ? prev.filter(c => c._id !== customer._id)
        : [...prev, customer]
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-ember-100 rounded-full" />
          <div className="absolute inset-0 border-2 border-ember-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] animate-pulse">Syncing Dispatch History</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Dispatch Header ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-display font-black italic text-[#1A1410] leading-none mb-2">Electronic Dispatch</h3>
          <p className="text-[#9B8D74] text-xs font-medium">Direct outreach to your elite Mediterranean circle.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="h-14 px-10 bg-[#1A1410] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all active:scale-95"
        >
          Initialize Transmission
        </button>
      </div>

      {/* ── Campaign History List ────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {campaigns.length === 0 ? (
            <motion.div layout className="py-24 text-center bg-white rounded-[3rem] border border-[rgba(26,20,16,0.06)] shadow-sm">
              <span className="text-5xl mb-6 block grayscale opacity-30">✉️</span>
              <h4 className="font-display font-black text-2xl italic text-[#1A1410]">Registry Clear</h4>
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#9B8D74] mt-2">No active dispatches in queue.</p>
            </motion.div>
          ) : (
            campaigns.map((campaign) => (
              <motion.div
                key={campaign._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 border border-[rgba(26,20,16,0.06)] hover:border-ember-200 hover:shadow-xl hover:shadow-[#1A1410]/5 transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="text-[#1A1410] font-display font-black text-xl italic group-hover:text-ember-600 transition-colors truncate">{campaign.name}</h4>
                      <span className={`px-3 py-1 rounded-full font-mono text-[8px] font-black uppercase tracking-widest border shadow-sm ${campaign.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-[#FAFAF8] text-[#9B8D74] border-[rgba(26,20,16,0.06)]'
                        }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-[#9B8D74] text-xs font-medium italic truncate block">Subject: {campaign.subject}</p>
                    <div className="flex items-center gap-4 mt-4 font-mono text-[9px] font-black uppercase tracking-widest text-[#9B8D74]/60">
                      <span className="flex items-center gap-1.5"><span className="opacity-40">CAL</span> {new Date(campaign.createdAt).toLocaleDateString()}</span>
                      {campaign.stats?.totalRecipients > 0 && <span className="flex items-center gap-1.5"><span className="opacity-40">GRP</span> {campaign.stats.totalRecipients} Contacts</span>}
                    </div>
                  </div>

                  {campaign.stats?.totalRecipients > 0 && (
                    <div className="flex gap-6 p-5 bg-[#FAFAF8] rounded-[1.5rem] border border-[rgba(26,20,16,0.03)] shadow-inner">
                      <div className="text-center min-w-[70px]">
                        <div className="font-display font-black text-2xl italic text-[#1A1410]">{campaign.stats.totalRecipients}</div>
                        <div className="font-mono text-[8px] text-[#9B8D74] uppercase font-black mt-1">Cohort</div>
                      </div>
                      <div className="text-center min-w-[70px]">
                        <div className="font-display font-black text-2xl italic text-emerald-600">{Math.round((campaign.stats.delivered / campaign.stats.totalRecipients) * 100) || 0}%</div>
                        <div className="font-mono text-[8px] text-[#9B8D74] uppercase font-black mt-1">Efficacy</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Composition Studio Modal ──────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-[#1A1410]/40 backdrop-blur-md z-[210] p-4 flex items-center justify-center shadow-2xl" onClick={() => setShowCreateModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="bg-white w-full max-w-3xl rounded-[4rem] border border-[rgba(26,20,16,0.06)] p-12 max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1A1410]" />
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-4xl font-display font-black italic text-[#1A1410] leading-none">Campaign Studio</h3>
                <button onClick={() => setShowCreateModal(false)} className="w-12 h-12 bg-[#FAFAF8] rounded-full flex items-center justify-center text-[#9B8D74] hover:bg-rose-500 hover:text-white transition-all font-bold">✕</button>
              </div>

              <form className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Campaign Identifier</label>
                    <input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-bold outline-none focus:bg-white focus:border-ember-500 transition-all shadow-sm" placeholder="e.g. Authentic Weekend Vol.1" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Visual Protocol</label>
                    <div className="relative">
                      <select value={newCampaign.template} onChange={(e) => setNewCampaign({ ...newCampaign, template: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-black text-[10px] uppercase tracking-widest outline-none appearance-none cursor-pointer focus:bg-white focus:border-emerald-500 transition-all shadow-sm">
                        <option value="custom">Standard Pizza Selection</option>
                        <option value="promotion">Elite Offer Blueprint</option>
                        <option value="newsletter">Weekly Culinary Journal</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#9B8D74] text-[10px]">▼</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Target Subject Descriptor</label>
                  <input type="text" value={newCampaign.subject} onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-black font-display text-xl italic outline-none focus:bg-white focus:border-ember-500 transition-all shadow-sm" placeholder="Ancient Flavors Await Your Table... 🍕" />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Culinary Invitation (Message)</label>
                  <textarea rows={5} value={newCampaign.message} onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })} className="w-full px-6 py-4 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-medium text-sm outline-none focus:bg-white focus:border-ember-500 transition-all shadow-sm resize-none" placeholder="Salute {{ customer_name }}, we've lit the ovens just for you..." />
                </div>

                <section className="space-y-4">
                  <div className="flex justify-between items-center px-1 border-b border-[rgba(26,20,16,0.06)] pb-2">
                    <label className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[#9B8D74]">Selected Cohort</label>
                    <span className="font-display font-black text-lg italic text-ember-600">{selectedCustomers.length} <span className="text-[9px] font-mono uppercase font-black opacity-40">Recipients</span></span>
                  </div>
                  <div className="bg-[#FAFAF8] rounded-[2.5rem] border border-[rgba(26,20,16,0.06)] overflow-hidden max-h-48 overflow-y-auto scrollbar-hide shadow-inner divide-y divide-[rgba(26,20,16,0.03)]">
                    {customers.map((c) => (
                      <label key={c._id} className="flex items-center gap-4 p-5 hover:bg-white transition-all cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" checked={selectedCustomers.some(sc => sc._id === c._id)} onChange={() => toggleCustomerSelection(c)} className="sr-only peer" />
                          <div className="w-6 h-6 border-2 border-[rgba(26,20,16,0.1)] rounded-lg flex items-center justify-center transition-all peer-checked:bg-[#1A1410] peer-checked:border-black">
                            <span className="text-white text-[10px] scale-0 peer-checked:scale-100 transition-transform">✓</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1A1410] group-hover:text-ember-600 transition-colors truncate">{c.name}</p>
                          <p className="font-mono text-[9px] uppercase font-black text-[#9B8D74] opacity-50 truncate tracking-tighter">{c.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-black text-lg italic text-ember-600 leading-none">{c.loyalty?.points || 0}</p>
                          <p className="font-mono text-[8px] font-black uppercase text-[#9B8D74]">PTS</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-4 px-2">
                    <button type="button" onClick={() => setSelectedCustomers(customers)} className="font-mono text-[9px] font-black uppercase text-[#9B8D74] hover:text-[#1A1410] transition-colors tracking-widest">Select Entire Pool</button>
                    <button type="button" onClick={() => setSelectedCustomers([])} className="font-mono text-[9px] font-black uppercase text-[#9B8D74] hover:text-rose-500 transition-colors tracking-widest">Reset Registry</button>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <button type="button" onClick={handleSaveDraft} disabled={selectedCustomers.length === 0} className="h-16 bg-[#FAFAF8] text-[#9B8D74] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-[#1A1410] transition-colors border border-[rgba(26,20,16,0.06)] disabled:opacity-30">Archive Draft</button>
                  <button type="button" onClick={handleSendCampaign} disabled={sendingEmail || selectedCustomers.length === 0} className="md:col-span-2 h-16 bg-[#1A1410] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-black/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                    {sendingEmail ? (
                      <span className="flex items-center gap-3 animate-pulse">Launching Transmission <span className="w-1 h-1 bg-white rounded-full animate-ping" /></span>
                    ) : (
                      <>🚀 Commit & Broadcast Dispatch</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
