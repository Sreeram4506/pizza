import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) setBanners(await response.json())
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanner)
      })
      if (response.ok) {
        const data = await response.json()
        setBanners([data, ...banners])
        setShowCreateModal(false)
        resetForm()
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanner)
      })
      if (response.ok) {
        const data = await response.json()
        setBanners(banners.map(b => b._id === editingBanner._id ? data : b))
        setShowCreateModal(false)
        setEditingBanner(null)
        resetForm()
      }
    } catch (err) {
      console.error('Failed to update banner:', err)
    }
  }

  const handleDeleteBanner = async (id) => {
    if (!confirm('Delete this promotion?')) return
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/promotional-banners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) setBanners(banners.filter(b => b._id !== id))
    } catch (err) {
      console.error('Failed to delete banner:', err)
    }
  }

  const handleEditBanner = (banner) => {
    setEditingBanner(banner)
    setNewBanner({
      ...banner,
      startDate: new Date(banner.startDate).toISOString().split('T')[0],
      endDate: new Date(banner.endDate).toISOString().split('T')[0]
    })
    setShowCreateModal(true)
  }

  const resetForm = () => {
    setNewBanner({
      title: '', subtitle: '', description: '', imageUrl: '',
      backgroundColor: '#FF6B6B', textColor: '#FFFFFF',
      buttonText: '', buttonLink: '', position: 'top', size: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 1, targetAudience: ['all'], status: 'active'
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
        <p className="text-xs font-bold text-wood-400 uppercase tracking-widest animate-pulse">Loading Banners...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Visual Promotions</h3>
          <p className="text-wood-400 text-xs">Highlights for your homepage and menu</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { setEditingBanner(null); resetForm(); setShowCreateModal(true); }}
          className="w-full sm:w-auto px-6 py-3 bg-tomato-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-tomato-600/20"
        >
          New Banner
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {banners.length === 0 ? (
          <div className="bg-wood-800 rounded-3xl py-16 text-center border border-wood-700">
            <span className="text-4xl mb-4 block">🖼️</span>
            <p className="text-xs font-black uppercase tracking-widest text-wood-400">No active banners</p>
          </div>
        ) : (
          banners.map((banner) => (
            <motion.div
              key={banner._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-wood-800 rounded-2xl p-5 border border-wood-700 hover:border-wood-600 transition-all overflow-hidden"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${banner.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-wood-700 text-wood-400'}`}>
                      {banner.status}
                    </span>
                    <span className="px-2 py-0.5 bg-tomato-600/10 text-tomato-400 border border-tomato-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                      {banner.position}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white mb-1">{banner.title}</h4>
                  <p className="text-wood-400 text-xs line-clamp-2 h-8 leading-snug">{banner.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-[9px] font-black text-wood-500 uppercase tracking-widest">
                    <span>📅 {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}</span>
                    <span>⭐ Priority {banner.priority}</span>
                  </div>
                </div>

                <div className="w-full md:w-64 flex flex-col gap-3">
                  {/* Preview Card */}
                  <div
                    className="relative h-24 rounded-xl flex flex-col justify-center px-4 border border-white/10 shadow-inner overflow-hidden"
                    style={{ backgroundColor: banner.backgroundColor }}
                  >
                    <div className="relative z-10">
                      <p className="font-black text-sm leading-tight" style={{ color: banner.textColor }}>{banner.title}</p>
                      <p className="text-[10px] opacity-80" style={{ color: banner.textColor }}>{banner.subtitle}</p>
                    </div>
                    {banner.buttonText && (
                      <div className="absolute right-4 bottom-3 px-3 py-1 bg-white rounded-full text-[8px] font-bold" style={{ backgroundColor: banner.textColor, color: banner.backgroundColor }}>
                        {banner.buttonText}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditBanner(banner)} className="flex-1 py-2.5 bg-wood-700 text-wood-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-wood-600 transition-colors">Edit</button>
                    <button onClick={() => handleDeleteBanner(banner._id)} className="flex-1 py-2.5 bg-wood-900/50 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors">Del</button>
                  </div>
                </div>
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
                <h3 className="text-2xl font-display font-black text-white">{editingBanner ? 'Refine Offer' : 'Craft Promotion'}</h3>
                <button onClick={() => setShowCreateModal(false)} className="w-9 h-9 bg-wood-700 rounded-full flex items-center justify-center text-wood-300">✕</button>
              </div>

              <form onSubmit={editingBanner ? handleUpdateBanner : handleCreateBanner} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Primary Title</label>
                    <input type="text" value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" placeholder="e.g. Flash Sale!" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Secondary Text</label>
                    <input type="text" value={newBanner.subtitle} onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" placeholder="50% Off Everything" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Description</label>
                  <textarea value={newBanner.description} onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500 resize-none" rows={2} placeholder="Tell them what they're getting..." />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Background</label>
                    <div className="flex items-center gap-2 bg-wood-700 p-2 border border-wood-600 rounded-xl">
                      <input type="color" value={newBanner.backgroundColor} onChange={(e) => setNewBanner({ ...newBanner, backgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer p-0 border-none" />
                      <span className="text-[10px] font-mono text-wood-400 uppercase">{newBanner.backgroundColor}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Text Color</label>
                    <div className="flex items-center gap-2 bg-wood-700 p-2 border border-wood-600 rounded-xl">
                      <input type="color" value={newBanner.textColor} onChange={(e) => setNewBanner({ ...newBanner, textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer p-0 border-none" />
                      <span className="text-[10px] font-mono text-wood-400 uppercase">{newBanner.textColor}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Position</label>
                    <select value={newBanner.position} onChange={(e) => setNewBanner({ ...newBanner, position: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500 appearance-none">
                      <option value="top">Top Header Bar</option>
                      <option value="middle">In-Menu Divider</option>
                      <option value="bottom">Footer Offer</option>
                      <option value="hero">Hero Section Overlay</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Button Label & Link</label>
                    <div className="flex gap-2">
                      <input type="text" value={newBanner.buttonText} onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })} className="flex-1 px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" placeholder="Label (Order Now)" />
                      <input type="text" value={newBanner.buttonLink} onChange={(e) => setNewBanner({ ...newBanner, buttonLink: e.target.value })} className="flex-1 px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" placeholder="Link (/menu)" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Validity Period</label>
                    <div className="flex gap-2">
                      <input type="date" value={newBanner.startDate} onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })} className="flex-1 px-3 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-[10px] outline-none" />
                      <input type="date" value={newBanner.endDate} onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })} className="flex-1 px-3 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-[10px] outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 bg-wood-700 text-wood-300 rounded-2xl text-[10px] font-black uppercase tracking-widest">Discard</button>
                  <button type="submit" className="flex-[2] py-4 bg-tomato-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-tomato-600/30">
                    {editingBanner ? 'Save Refinements' : 'Launch Promotion'}
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
