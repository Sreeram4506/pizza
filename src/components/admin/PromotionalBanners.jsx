import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function PromotionalBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    backgroundColor: '#FF6B6B',
    textColor: '#FFFFFF',
    buttonText: '',
    buttonLink: '',
    position: 'top',
    size: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 1,
    targetAudience: ['all'],
    status: 'active'
  })

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/promotional-banners', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBanners(data)
      }
    } catch (err) {
      console.error('Failed to load banners:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBanner = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/promotional-banners', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBanner)
      })
      
      if (response.ok) {
        const data = await response.json()
        setBanners([data, ...banners])
        setShowCreateModal(false)
        resetForm()
        
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMsg.textContent = 'Banner created successfully!'
        document.body.appendChild(successMsg)
        
        setTimeout(() => {
          document.body.removeChild(successMsg)
        }, 3000)
      }
    } catch (err) {
      console.error('Failed to create banner:', err)
    }
  }

  const handleUpdateBanner = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/promotional-banners/${editingBanner._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBanner)
      })
      
      if (response.ok) {
        const data = await response.json()
        setBanners(banners.map(b => b._id === editingBanner._id ? data : b))
        setShowCreateModal(false)
        setEditingBanner(null)
        resetForm()
        
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMsg.textContent = 'Banner updated successfully!'
        document.body.appendChild(successMsg)
        
        setTimeout(() => {
          document.body.removeChild(successMsg)
        }, 3000)
      }
    } catch (err) {
      console.error('Failed to update banner:', err)
    }
  }

  const handleDeleteBanner = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/promotional-banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setBanners(banners.filter(b => b._id !== id))
        
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMsg.textContent = 'Banner deleted successfully!'
        document.body.appendChild(successMsg)
        
        setTimeout(() => {
          document.body.removeChild(successMsg)
        }, 3000)
      }
    } catch (err) {
      console.error('Failed to delete banner:', err)
    }
  }

  const handleEditBanner = (banner) => {
    setEditingBanner(banner)
    setNewBanner({
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      imageUrl: banner.imageUrl,
      backgroundColor: banner.backgroundColor,
      textColor: banner.textColor,
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink,
      position: banner.position,
      size: banner.size,
      startDate: new Date(banner.startDate).toISOString().split('T')[0],
      endDate: new Date(banner.endDate).toISOString().split('T')[0],
      priority: banner.priority,
      targetAudience: banner.targetAudience,
      status: banner.status
    })
    setShowCreateModal(true)
  }

  const resetForm = () => {
    setNewBanner({
      title: '',
      subtitle: '',
      description: '',
      imageUrl: '',
      backgroundColor: '#FF6B6B',
      textColor: '#FFFFFF',
      buttonText: '',
      buttonLink: '',
      position: 'top',
      size: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 1,
      targetAudience: ['all'],
      status: 'active'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-gray-100 text-gray-700'
      case 'paused': return 'bg-yellow-100 text-yellow-700'
      case 'expired': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPositionColor = (position) => {
    switch (position) {
      case 'top': return 'bg-blue-100 text-blue-700'
      case 'middle': return 'bg-purple-100 text-purple-700'
      case 'bottom': return 'bg-orange-100 text-orange-700'
      case 'hero': return 'bg-pink-100 text-pink-700'
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
          <h3 className="text-2xl font-bold text-white">Promotional Banners</h3>
          <p className="text-wood-400">Create and manage promotional banners for your website</p>
        </div>
        <motion.button
          onClick={() => {
            setEditingBanner(null)
            resetForm()
            setShowCreateModal(true)
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-tomato-600 text-white font-semibold rounded-lg hover:bg-tomato-700 transition-colors"
        >
          Create Banner
        </motion.button>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {banners.map((banner) => (
          <motion.div
            key={banner._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-wood-800 rounded-xl p-6 border border-wood-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-xl font-semibold text-white">{banner.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(banner.status)}`}>
                    {banner.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(banner.position)}`}>
                    {banner.position}
                  </span>
                </div>
                {banner.subtitle && (
                  <p className="text-wood-300 mb-2">{banner.subtitle}</p>
                )}
                {banner.description && (
                  <p className="text-wood-400 text-sm mb-3">{banner.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-wood-400">
                  <span>Priority: {banner.priority}</span>
                  <span>Size: {banner.size}</span>
                  {banner.buttonText && (
                    <span>CTA: {banner.buttonText}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-wood-400 mt-2">
                  <span>Start: {new Date(banner.startDate).toLocaleDateString()}</span>
                  <span>End: {new Date(banner.endDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4">
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => handleEditBanner(banner)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </motion.button>
                  <motion.button
                    onClick={() => handleDeleteBanner(banner._id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </motion.button>
                </div>
                <div className="text-right text-sm text-wood-400">
                  <div>{banner.clicks || 0} clicks</div>
                  <div>{banner.impressions || 0} impressions</div>
                </div>
              </div>
            </div>
            
            {/* Banner Preview */}
            <div className="mt-4 pt-4 border-t border-wood-700">
              <div className="text-sm text-wood-400 mb-2">Preview:</div>
              <div 
                className="p-4 rounded-lg border border-wood-600"
                style={{ backgroundColor: banner.backgroundColor }}
              >
                <h5 
                  className="text-lg font-bold mb-1"
                  style={{ color: banner.textColor }}
                >
                  {banner.title}
                </h5>
                {banner.subtitle && (
                  <p 
                    className="text-sm mb-2"
                    style={{ color: banner.textColor }}
                  >
                    {banner.subtitle}
                  </p>
                )}
                {banner.buttonText && (
                  <button
                    className="px-4 py-2 rounded text-sm font-medium"
                    style={{ 
                      backgroundColor: banner.textColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
                      color: banner.backgroundColor 
                    }}
                  >
                    {banner.buttonText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Banner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-wood-800 rounded-xl p-6 border border-wood-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingBanner ? 'Edit Banner' : 'Create Promotional Banner'}
            </h3>
            
            <form onSubmit={editingBanner ? handleUpdateBanner : handleCreateBanner} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    placeholder="Weekend Special"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={newBanner.subtitle}
                    onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    placeholder="50% Off All Pizzas"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-wood-300 mb-1">Description</label>
                <textarea
                  value={newBanner.description}
                  onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })}
                  className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  rows={3}
                  placeholder="Get 50% off on all pizzas this weekend only!"
                />
              </div>

              {/* Visual Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Background Color</label>
                  <input
                    type="color"
                    value={newBanner.backgroundColor}
                    onChange={(e) => setNewBanner({ ...newBanner, backgroundColor: e.target.value })}
                    className="w-full h-10 bg-wood-700 border border-wood-600 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Text Color</label>
                  <input
                    type="color"
                    value={newBanner.textColor}
                    onChange={(e) => setNewBanner({ ...newBanner, textColor: e.target.value })}
                    className="w-full h-10 bg-wood-700 border border-wood-600 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newBanner.priority}
                    onChange={(e) => setNewBanner({ ...newBanner, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  />
                </div>
              </div>

              {/* Button Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={newBanner.buttonText}
                    onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    placeholder="Order Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Button Link</label>
                  <input
                    type="text"
                    value={newBanner.buttonLink}
                    onChange={(e) => setNewBanner({ ...newBanner, buttonLink: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    placeholder="/menu"
                  />
                </div>
              </div>

              {/* Display Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Position</label>
                  <select
                    value={newBanner.position}
                    onChange={(e) => setNewBanner({ ...newBanner, position: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                    <option value="hero">Hero</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Size</label>
                  <select
                    value={newBanner.size}
                    onChange={(e) => setNewBanner({ ...newBanner, size: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="full">Full Width</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Status</label>
                  <select
                    value={newBanner.status}
                    onChange={(e) => setNewBanner({ ...newBanner, status: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newBanner.startDate}
                    onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newBanner.endDate}
                    onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-wood-300 mb-1">Target Audience</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'new_customers', 'returning_customers', 'vip_customers'].map((audience) => (
                    <label key={audience} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newBanner.targetAudience.includes(audience)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewBanner({ ...newBanner, targetAudience: [...newBanner.targetAudience, audience] })
                          } else {
                            setNewBanner({ ...newBanner, targetAudience: newBanner.targetAudience.filter(a => a !== audience) })
                          }
                        }}
                        className="rounded text-tomato-600 focus:ring-tomato-500"
                      />
                      <span className="text-white capitalize">{audience.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-6 py-3 bg-tomato-600 text-white font-semibold rounded-lg hover:bg-tomato-700 transition-colors"
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingBanner(null)
                    resetForm()
                  }}
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
