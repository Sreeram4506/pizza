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
      console.error('Campaign error:', err)
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
      }
    } catch (err) {
      console.error('Save draft error:', err)
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
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
        <p className="text-xs font-bold text-wood-400 uppercase tracking-widest animate-pulse">Loading Campaigns...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Email Campaigns</h3>
          <p className="text-wood-400 text-xs">Direct outreach to your loyal customers</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-6 py-3 bg-tomato-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-tomato-600/20"
        >
          New Campaign
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {campaigns.length === 0 ? (
          <div className="bg-wood-800 rounded-3xl py-16 text-center border border-wood-700">
            <span className="text-4xl mb-4 block">✉️</span>
            <p className="text-xs font-black uppercase tracking-widest text-wood-400">No active campaigns</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <motion.div
              key={campaign._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-wood-800 rounded-2xl p-5 border border-wood-700 hover:border-wood-600 transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-white font-bold truncate text-sm sm:text-base">{campaign.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${campaign.status === 'sent' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-wood-700 text-wood-400 border border-wood-600'}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-wood-400 text-xs italic truncate">"{campaign.subject}"</p>
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-wood-500 font-bold uppercase tracking-widest">
                    <span>📅 {new Date(campaign.createdAt).toLocaleDateString()}</span>
                    {campaign.stats?.totalRecipients > 0 && <span>👥 {campaign.stats.totalRecipients} Recipients</span>}
                  </div>
                </div>

                {campaign.stats?.totalRecipients > 0 && (
                  <div className="flex gap-4 p-3 bg-wood-900/50 rounded-xl border border-wood-700/50">
                    <div className="text-center min-w-[60px]">
                      <div className="text-sm font-black text-white">{campaign.stats.totalRecipients}</div>
                      <div className="text-[8px] text-wood-500 uppercase font-black mt-0.5">Reach</div>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <div className="text-sm font-black text-basil-400">{Math.round((campaign.stats.delivered / campaign.stats.totalRecipients) * 100) || 0}%</div>
                      <div className="text-[8px] text-wood-500 uppercase font-black mt-0.5">Success</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] p-3 flex items-end sm:items-center justify-center shadow-2xl" onClick={() => setShowCreateModal(false)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-wood-800 w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-wood-700 p-6 sm:p-8 max-h-[95vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-black text-white">New Campaign</h3>
                <button onClick={() => setShowCreateModal(false)} className="w-9 h-9 bg-wood-700 rounded-full flex items-center justify-center text-wood-300">✕</button>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Campaign ID</label>
                    <input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" placeholder="e.g. Summer Weekend Ops" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Design Vibe</label>
                    <select value={newCampaign.template} onChange={(e) => setNewCampaign({ ...newCampaign, template: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500 appearance-none">
                      <option value="custom">Standard Pizza Blast</option>
                      <option value="promotion">Flash Deal Layout</option>
                      <option value="newsletter">Weekly Roundup</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Target Subject Line</label>
                  <input type="text" value={newCampaign.subject} onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" placeholder="Free Garlic Knots with any Large Pizza! 🧄" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Message Content</label>
                  <textarea rows={5} value={newCampaign.message} onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500 resize-none" placeholder="Hey {{ customer_name }}, hope you're hungry!..." />
                </div>

                <section className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Target Audience</label>
                    <span className="text-[10px] font-black text-tomato-500">{selectedCustomers.length} selected</span>
                  </div>
                  <div className="bg-wood-900/50 rounded-2xl border border-wood-700 overflow-hidden max-h-40 overflow-y-auto space-y-px">
                    {customers.map((c) => (
                      <label key={c._id} className="flex items-center gap-3 p-3 hover:bg-wood-700 transition-colors cursor-pointer border-b border-wood-800 last:border-0">
                        <input type="checkbox" checked={selectedCustomers.some(sc => sc._id === c._id)} onChange={() => toggleCustomerSelection(c)} className="w-4 h-4 rounded border-wood-600 bg-wood-800 accent-tomato-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{c.name}</p>
                          <p className="text-[10px] text-wood-500 truncate">{c.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-tomato-500">{c.loyalty?.points || 0} PTS</p>
                          <p className="text-[9px] text-wood-400">$ {(c.totalSpent || 0).toFixed(0)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSelectedCustomers(customers)} className="text-[9px] font-black uppercase text-wood-400 hover:text-white transition-colors">Select All</button>
                    <button type="button" onClick={() => setSelectedCustomers([])} className="text-[9px] font-black uppercase text-wood-400 hover:text-white transition-colors">Clear</button>
                  </div>
                </section>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button type="button" onClick={handleSaveDraft} disabled={selectedCustomers.length === 0} className="w-full py-4 bg-wood-700 text-wood-300 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30">Save Draft</button>
                  <button type="button" onClick={handleSendCampaign} disabled={sendingEmail || selectedCustomers.length === 0} className="w-full sm:flex-[2] py-4 bg-tomato-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-tomato-600/30 flex items-center justify-center gap-2">
                    {sendingEmail ? '🚀 Launching...' : '📣 Broadcast Campaign'}
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
