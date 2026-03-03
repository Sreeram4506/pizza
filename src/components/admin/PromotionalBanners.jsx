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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-stone-900">Promotional Banners</h3>
          <p className="text-stone-500">Visual highlights for your homepage and menu</p>
        </div>
        <motion.button
          onClick={() => {
            setEditingBanner(null)
            resetForm()
            setShowCreateModal(true)
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-tomato-600 text-white font-bold rounded-xl shadow-lg shadow-tomato-200 hover:bg-tomato-700 transition-all font-display"
        >
          New Banner
        </motion.button>
      </div>

      {banners.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-stone-100 text-center shadow-sm">
          <div className="text-6xl mb-4">🖼️</div>
          <h3 className="text-xl font-bold text-stone-900">No banners active</h3>
          <p className="text-stone-500 mt-2">Create a banner to highlight your weekend specials!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {banners.map((banner) => (
            <motion.div
              key={banner._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getStatusColor(banner.status)}`}>
                      {banner.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getPositionColor(banner.position)}`}>
                      {banner.position}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      Priority {banner.priority}
                    </span>
                  </div>

                  <h4 className="text-2xl font-black text-stone-900 mb-2">{banner.title}</h4>
                  {banner.subtitle && <p className="text-tomato-600 font-bold mb-3">{banner.subtitle}</p>}
                  {banner.description && <p className="text-stone-500 text-sm mb-6 leading-relaxed">{banner.description}</p>}

                  <div className="flex items-center gap-4 text-xs font-bold text-stone-400">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor font-medium">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(banner.startDate).toLocaleDateString()} — {new Date(banner.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-80 flex flex-col gap-4">
                  <div
                    className="p-6 rounded-2xl border border-stone-100 shadow-inner relative overflow-hidden h-40 flex flex-col justify-center"
                    style={{ backgroundColor: banner.backgroundColor }}
                  >
                    <div className="relative z-10">
                      <h5 className="font-black text-lg leading-tight mb-1" style={{ color: banner.textColor }}>{banner.title}</h5>
                      <p className="text-xs opacity-90 mb-3" style={{ color: banner.textColor }}>{banner.subtitle}</p>
                      {banner.buttonText && (
                        <span
                          className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm inline-block"
                          style={{
                            backgroundColor: banner.textColor,
                            color: banner.backgroundColor
                          }}
                        >
                          {banner.buttonText}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditBanner(banner)}
                      className="flex-1 py-2 text-xs font-black uppercase tracking-widest bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-colors"
                    >
                      Edit ✎
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner._id)}
                      className="flex-1 py-2 text-xs font-black uppercase tracking-widest bg-stone-50 text-red-400 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Remove ✕
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Re-styled similarly to EmailCampaigns */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-white z-10">
              <div>
                <h3 className="text-2xl font-black text-stone-900 tracking-tight">
                  {editingBanner ? 'Refine Banner' : 'New Promotion'}
                </h3>
                <p className="text-stone-500 font-medium">Capture attention with stunning visuals</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[#fbfbfb]">
              <form onSubmit={editingBanner ? handleUpdateBanner : handleCreateBanner} className="space-y-8">
                <section className="space-y-4">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">Headline Content</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Main Title *</label>
                      <input type="text" value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} className="w-full px-5 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none transition-all font-medium" placeholder="Weekend Special" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Catchy Subtitle</label>
                      <input type="text" value={newBanner.subtitle} onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })} className="w-full px-5 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none transition-all font-medium" placeholder="50% Off All Pizzas" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-stone-700 ml-1">Short Description</label>
                    <textarea value={newBanner.description} onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })} className="w-full px-5 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none transition-all font-medium" rows={2} placeholder="Briefly describe the offer..." />
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">Visual Aesthetics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Background</label>
                      <div className="flex items-center gap-3 bg-white p-2 border border-stone-200 rounded-xl">
                        <input type="color" value={newBanner.backgroundColor} onChange={(e) => setNewBanner({ ...newBanner, backgroundColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-none p-0" />
                        <span className="text-xs font-mono text-stone-500 uppercase">{newBanner.backgroundColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Text Color</label>
                      <div className="flex items-center gap-3 bg-white p-2 border border-stone-200 rounded-xl">
                        <input type="color" value={newBanner.textColor} onChange={(e) => setNewBanner({ ...newBanner, textColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-none p-0" />
                        <span className="text-xs font-mono text-stone-500 uppercase">{newBanner.textColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Priority (1-10)</label>
                      <input type="number" min="1" max="10" value={newBanner.priority} onChange={(e) => setNewBanner({ ...newBanner, priority: parseInt(e.target.value) })} className="w-full px-5 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none font-medium text-center" />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">Call to Action</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Label</label>
                      <input type="text" value={newBanner.buttonText} onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })} className="w-full px-5 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none font-medium" placeholder="Order Now" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-stone-700 ml-1">Link Destination</label>
                      <input type="text" value={newBanner.buttonLink} onChange={(e) => setNewBanner({ ...newBanner, buttonLink: e.target.value })} className="w-full px-5 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none font-medium" placeholder="/menu" />
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-stone-700 ml-1">Placement</label>
                    <select value={newBanner.position} onChange={(e) => setNewBanner({ ...newBanner, position: e.target.value })} className="w-full px-5 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-tomato-500/20 focus:border-tomato-500 outline-none transition-all font-medium appearance-none">
                      <option value="top">Top Bar</option>
                      <option value="middle">In-Menu Divider</option>
                      <option value="bottom">Footer Promotion</option>
                      <option value="hero">Hero Overlay</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-stone-700 ml-1">Campaign Period</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" value={newBanner.startDate} onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl outline-none font-medium text-xs" />
                      <input type="date" value={newBanner.endDate} onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl outline-none font-medium text-xs" />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-8 bg-white border-t border-stone-100 flex gap-4">
              <button onClick={() => setShowCreateModal(false)} className="px-8 py-4 bg-stone-100 text-stone-600 font-bold rounded-2xl hover:bg-stone-200 transition-all">Discard</button>
              <button onClick={editingBanner ? handleUpdateBanner : handleCreateBanner} className="flex-1 px-8 py-4 bg-tomato-600 text-white font-bold rounded-2xl shadow-xl shadow-tomato-200 hover:bg-tomato-700 transition-all">Save {editingBanner ? 'Changes' : 'Promotion'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
