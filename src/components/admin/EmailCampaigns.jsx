import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
// Removed emailjs - now using backend

// EmailJS configuration
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'

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

  useEffect(() => {
    loadCampaigns()
    loadCustomers()

  }, [])

  const loadCampaigns = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/email-campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('EmailCampaigns: Customers loaded:', data)
        setCustomers(data)
      } else {
        console.error('Failed to load customers:', response.status)
      }
    } catch (err) {
      console.error('Failed to load customers:', err)
    }
  }

  const handleSendCampaign = async (e) => {
    e.preventDefault()
    if (selectedCustomers.length === 0) return alert('Please select recipients')

    setSendingEmail(true)
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        alert('Authentication lost. Please log in again.')
        navigate('/admin/login')
        return
      }

      console.log('EmailCampaigns: Sending campaign to', selectedCustomers.length, 'recipients')
      const response = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newCampaign,
          recipients: selectedCustomers.map(c => ({
            customerId: c._id,
            email: c.email,
            name: c.name
          })),
          sendNow: true
        })
      })

      if (response.ok) {
        const saved = await response.json()
        setCampaigns(prev => [saved, ...prev])
        setShowCreateModal(false)
        resetForm()
        alert('Campaign queued for sending!')
      } else {
        const errorData = await response.json()
        console.error('Campaign failed:', response.status, errorData)
        if (response.status === 401) {
          alert('Session expired. Please log in again.')
          navigate('/admin/login')
        } else {
          alert(`Failed to send campaign: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (err) {
      console.error('Campaign error:', err)
      alert('Network error. Is the server running?')
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
    setNewCampaign({
      name: '',
      subject: '',
      message: '',
      template: 'custom',
      fromName: '',
      replyTo: ''
    })
    setSelectedCustomers([])
  }

  const toggleCustomerSelection = (customer) => {
    console.log('EmailCampaigns: Toggling customer:', customer)
    setSelectedCustomers(prev => {
      const isSelected = prev.find(c => c._id === customer._id)
      console.log('EmailCampaigns: Customer was selected:', isSelected)
      const newSelection = isSelected
        ? prev.filter(c => c._id !== customer._id)
        : [...prev, customer]
      console.log('EmailCampaigns: New selection:', newSelection)
      return newSelection
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700'
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'sending': return 'bg-yellow-100 text-yellow-700'
      case 'sent': return 'bg-green-100 text-green-700'
      case 'paused': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tomato-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-stone-900">Email Marketing</h3>
          <p className="text-stone-500">Reach your customers with beautiful newsletters and offers</p>
        </div>
        <motion.button
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-tomato-600 text-white font-bold rounded-xl shadow-lg shadow-tomato-200 hover:bg-tomato-700 transition-all"
        >
          New Campaign
        </motion.button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-stone-100 text-center shadow-sm">
          <div className="text-6xl mb-4">✉️</div>
          <h3 className="text-xl font-bold text-stone-900">No campaigns yet</h3>
          <p className="text-stone-500 mt-2">Start your first marketing campaign to boost sales!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {campaigns.map((campaign) => (
            <motion.div
              key={campaign._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-bold text-stone-900">{campaign.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${campaign.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-500'
                      }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-stone-500 line-clamp-1">{campaign.subject}</p>

                  <div className="flex items-center gap-6 mt-6 text-sm">
                    <div>
                      <span className="block text-stone-400 text-[10px] uppercase font-bold mb-1">Created</span>
                      <span className="text-stone-700 font-medium">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                    </div>
                    {campaign.sentAt && (
                      <div>
                        <span className="block text-stone-400 text-[10px] uppercase font-bold mb-1">Sent</span>
                        <span className="text-stone-700 font-medium">{new Date(campaign.sentAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {campaign.stats && campaign.stats.totalRecipients > 0 && (
                  <div className="flex gap-8 px-8 py-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="text-center">
                      <div className="text-xl font-black text-stone-900">{campaign.stats.totalRecipients}</div>
                      <div className="text-[10px] text-stone-400 uppercase font-black">Recipients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-black text-emerald-600">
                        {Math.round((campaign.stats.delivered / campaign.stats.totalRecipients) * 100) || 0}%
                      </div>
                      <div className="text-[10px] text-stone-400 uppercase font-black">Success</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Campaign Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="p-8 border-b border-stone-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-stone-900">Create Campaign</h3>
                <p className="text-stone-500">Design your perfect customer outreach</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[#fbfbfb]">
              <form className="space-y-8">
                <section className="space-y-4">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">General Info</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Internal Name</label>
                      <input
                        type="text"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none transition-all font-medium text-stone-900"
                        placeholder="e.g., Summer Weekend Bash"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Template Style</label>
                      <select
                        value={newCampaign.template}
                        onChange={(e) => setNewCampaign({ ...newCampaign, template: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none transition-all font-medium appearance-none text-stone-900"
                      >
                        <option value="custom">Pizza Blast Premium (Default)</option>
                        <option value="promotion">Flash Sale Layout</option>
                        <option value="newsletter">Weekly Digest</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">Email Content</h4>
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Subject Line</label>
                      <input
                        type="text"
                        value={newCampaign.subject}
                        onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none transition-all font-medium text-stone-900"
                        placeholder="Special Offer: 50% Off Your Next Pizza! 🍕"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Message Body</label>
                      <textarea
                        value={newCampaign.message}
                        onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                        className="w-full px-5 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none transition-all font-medium min-h-[200px] text-stone-900"
                        placeholder="Write something appetizing..."
                      />
                      <p className="text-[10px] text-stone-400 ml-1 mt-1">
                        Use <code className="text-tomato-600 bg-tomato-50 px-1 rounded">{"{{ customer_name }}"}</code> for personalization.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">Audience Selection</h4>
                    <span className="text-xs font-bold text-tomato-600 bg-tomato-50 px-3 py-1 rounded-full border border-tomato-100">
                      {selectedCustomers.length} selected
                    </span>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-inner max-h-[240px] overflow-y-auto">
                    {customers.length === 0 ? (
                      <div className="p-8 text-center text-stone-400">No customers found in database</div>
                    ) : (
                      <div className="divide-y divide-stone-50">
                        {customers.map((customer) => (
                          <label
                            key={customer._id}
                            className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${selectedCustomers.find(c => c._id === customer._id) ? 'bg-tomato-50/30' : 'hover:bg-stone-50'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCustomers.some(c => c._id === customer._id)}
                              onChange={() => toggleCustomerSelection(customer)}
                              className="w-5 h-5 rounded border-stone-300 text-tomato-600 focus:ring-tomato-500 transition-all"
                            />
                            <div>
                              <div className="font-bold text-stone-900 text-sm">{customer.name}</div>
                              <div className="text-stone-500 text-xs">{customer.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomers(customers)}
                      className="text-[10px] font-black uppercase tracking-wider text-stone-500 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomers([])}
                      className="text-[10px] font-black uppercase tracking-wider text-stone-500 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </section>
              </form>
            </div>

            <div className="p-6 bg-white border-t border-stone-100 flex gap-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-4 bg-stone-100 text-stone-600 font-bold rounded-2xl hover:bg-stone-200 transition-all"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={selectedCustomers.length === 0}
                className="flex-1 px-6 py-4 bg-white border-2 border-tomato-600 text-tomato-600 font-bold rounded-2xl hover:bg-tomato-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleSendCampaign}
                disabled={sendingEmail || selectedCustomers.length === 0}
                className="flex-[2] px-6 py-4 bg-tomato-600 text-white font-bold rounded-2xl hover:bg-tomato-700 shadow-xl shadow-tomato-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>🚀 Launch Campaign</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
