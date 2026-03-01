import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import emailjs from '@emailjs/browser'

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
    
    // Initialize EmailJS
    emailjs.init(EMAILJS_PUBLIC_KEY)
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

  const sendEmailToCustomer = async (customer, campaignData) => {
    try {
      const templateParams = {
        to_name: customer.name,
        to_email: customer.email,
        from_name: campaignData.fromName || 'Pizza Blast Team',
        reply_to: campaignData.replyTo || 'contact@pizzablast.com',
        subject: campaignData.subject,
        message: campaignData.message,
        restaurant_name: campaignData.fromName || 'Pizza Blast',
        customer_name: customer.name
      }

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      )

      return { success: true, response }
    } catch (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.text || 'Failed to send email' }
    }
  }

  const handleSendCampaign = async (e) => {
    e.preventDefault()
    
    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer')
      return
    }

    setSendingEmail(true)
    
    try {
      // Send emails to all selected customers
      const emailPromises = selectedCustomers.map(customer => 
        sendEmailToCustomer(customer, newCampaign)
      )
      
      const results = await Promise.allSettled(emailPromises)
      
      // Count successful and failed sends
      const successful = results.filter(r => r.value?.success).length
      const failed = results.filter(r => !r.value?.success).length
      
      // Create campaign record
      const campaignData = {
        ...newCampaign,
        recipients: selectedCustomers.map(customer => ({
          customerId: customer._id,
          email: customer.email,
          name: customer.name,
          status: 'sent'
        }))
      }

      const token = localStorage.getItem('adminToken')
      const campaignResponse = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      })
      
      if (campaignResponse.ok) {
        const savedCampaign = await campaignResponse.json()
        setCampaigns([savedCampaign, ...campaigns])
        setShowCreateModal(false)
        setNewCampaign({ 
          name: '', 
          subject: '', 
          message: '', 
          template: 'custom',
          fromName: '',
          replyTo: ''
        })
        setSelectedCustomers([])
        
        // Show success message
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMsg.textContent = `Campaign sent! ${successful} emails sent successfully, ${failed} failed.`
        document.body.appendChild(successMsg)
        
        setTimeout(() => {
          document.body.removeChild(successMsg)
        }, 5000)
      }
    } catch (err) {
      console.error('Failed to send campaign:', err)
      alert('Failed to send campaign. Please check your EmailJS configuration.')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSaveDraft = async (e) => {
    e.preventDefault()
    
    const campaignData = {
      ...newCampaign,
      recipients: selectedCustomers.map(customer => ({
        customerId: customer._id,
        email: customer.email,
        name: customer.name,
        status: 'pending'
      }))
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      })
      
      if (response.ok) {
        const data = await response.json()
        setCampaigns([data, ...campaigns])
        setShowCreateModal(false)
        setNewCampaign({ 
          name: '', 
          subject: '', 
          message: '', 
          template: 'custom',
          fromName: '',
          replyTo: ''
        })
        setSelectedCustomers([])
        
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMsg.textContent = 'Campaign saved as draft!'
        document.body.appendChild(successMsg)
        
        setTimeout(() => {
          document.body.removeChild(successMsg)
        }, 3000)
      }
    } catch (err) {
      console.error('Failed to save campaign:', err)
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">Email Campaigns</h3>
          <p className="text-wood-400">Create and send email marketing campaigns</p>
        </div>
        <motion.button
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-tomato-600 text-white font-semibold rounded-lg hover:bg-tomato-700 transition-colors"
        >
          Create Campaign
        </motion.button>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <motion.div
            key={campaign._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-wood-800 rounded-xl p-6 border border-wood-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">{campaign.name}</h4>
                <p className="text-wood-300 mb-2">{campaign.subject}</p>
                <div className="flex items-center gap-4 text-sm text-wood-400">
                  <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                  {campaign.sentAt && (
                    <span>Sent: {new Date(campaign.sentAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
                {campaign.stats && (
                  <div className="text-right text-sm text-wood-400">
                    <div>{campaign.stats.sent || 0} sent</div>
                    <div>{campaign.stats.opened || 0} opened</div>
                  </div>
                )}
              </div>
            </div>
            
            {campaign.stats && campaign.stats.totalRecipients > 0 && (
              <div className="mt-4 pt-4 border-t border-wood-700">
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-white">{campaign.stats.totalRecipients}</div>
                    <div className="text-xs text-wood-400">Recipients</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-400">{campaign.stats.delivered}</div>
                    <div className="text-xs text-wood-400">Delivered</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-400">{campaign.stats.opened}</div>
                    <div className="text-xs text-wood-400">Opened</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-tomato-400">{campaign.stats.clicked}</div>
                    <div className="text-xs text-wood-400">Clicked</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-400">{campaign.stats.bounced}</div>
                    <div className="text-xs text-wood-400">Bounced</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Email Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-wood-800 rounded-xl p-6 border border-wood-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Create Email Campaign</h3>
            
            <form className="space-y-4">
              {/* Campaign Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    placeholder="e.g., Weekend Special"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Template</label>
                  <select
                    value={newCampaign.template}
                    onChange={(e) => setNewCampaign({ ...newCampaign, template: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  >
                    <option value="custom">Custom</option>
                    <option value="promotion">Promotion</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
              </div>

              {/* Email Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">From Name</label>
                  <input
                    type="text"
                    value={newCampaign.fromName}
                    onChange={(e) => setNewCampaign({ ...newCampaign, fromName: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    placeholder="Pizza Blast Team"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Reply-to Email</label>
                  <input
                    type="email"
                    value={newCampaign.replyTo}
                    onChange={(e) => setNewCampaign({ ...newCampaign, replyTo: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    placeholder="contact@pizzablast.com"
                    required
                  />
                </div>
              </div>

              {/* Email Content */}
              <div>
                <label className="block text-sm font-medium text-wood-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  placeholder="Special Offer - 20% Off This Weekend!"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wood-300 mb-1">Message</label>
                <textarea
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                  className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  rows={6}
                  placeholder="Dear {{customer_name}},&#10;&#10;We're excited to offer you 20% off your next order!&#10;&#10;Use code: SPECIAL20&#10;&#10;Best regards,&#10;{{restaurant_name}}"
                  required
                />
                <div className="text-xs text-wood-400 mt-1">
                  Available variables: {"{{customer_name}}"}, {"{{restaurant_name}}"}
                </div>
              </div>

              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-wood-300 mb-2">
                  Select Recipients ({selectedCustomers.length} selected)
                </label>
                <div className="text-xs text-wood-400 mb-2">
                  Total customers available: {customers.length}
                </div>
                <div className="max-h-40 overflow-y-auto bg-wood-700 border border-wood-600 rounded-lg p-2">
                  {customers.length === 0 ? (
                    <div className="text-center text-wood-400 py-4">
                      No customers available. Please add customers first.
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <label key={customer._id} className="flex items-center space-x-2 p-2 hover:bg-wood-600 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.find(c => c._id === customer._id)}
                          onChange={() => toggleCustomerSelection(customer)}
                          className="rounded text-tomato-600 focus:ring-tomato-500"
                        />
                        <span className="text-white">{customer.name} ({customer.email})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* EmailJS Configuration Notice */}
              <div className="bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg p-4">
                <h4 className="text-blue-300 font-semibold mb-2">EmailJS Configuration Required</h4>
                <p className="text-blue-200 text-sm">
                  To send emails, configure EmailJS in the component:
                </p>
                <ul className="text-blue-200 text-sm mt-2 list-disc list-inside">
                  <li>Replace YOUR_PUBLIC_KEY with your EmailJS public key</li>
                  <li>Replace YOUR_SERVICE_ID with your EmailJS service ID</li>
                  <li>Replace YOUR_TEMPLATE_ID with your EmailJS template ID</li>
                  <li>Create an EmailJS account at <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">emailjs.com</a></li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  type="button"
                  onClick={handleSendCampaign}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={sendingEmail || selectedCustomers.length === 0}
                  className="flex-1 px-6 py-3 bg-tomato-600 text-white font-semibold rounded-lg hover:bg-tomato-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? `Sending to ${selectedCustomers.length} customers...` : `Send Campaign (${selectedCustomers.length} recipients)`}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSaveDraft}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={selectedCustomers.length === 0}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save as Draft
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-6 py-3 bg-wood-700 text-white font-semibold rounded-lg hover:bg-wood-600 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
