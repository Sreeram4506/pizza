import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

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
    backgroundColor: '#1A1410',
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
        toast.success('Promotional asset launched')
      }
    } catch (err) {
      toast.error('Launch failed')
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
        toast.success('Asset refinements saved')
      }
    } catch (err) {
      toast.error('Refinement failed')
    }
  }

  const handleDeleteBanner = async (id) => {
    if (!confirm('Liquidate this promotion?')) return
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/promotional-banners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setBanners(banners.filter(b => b._id !== id))
        toast.success('Asset liquidated')
      }
    } catch (err) {
      toast.error('Liquidation failed')
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
      backgroundColor: '#1A1410', textColor: '#FFFFFF',
      buttonText: '', buttonLink: '', position: 'top', size: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 1, targetAudience: ['all'], status: 'active'
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-amber-100 rounded-full" />
          <div className="absolute inset-0 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] animate-pulse">Syncing Visual Assets</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Orchestration Header ─────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-sans font-bold text-[#1A1410] leading-none mb-2">Visual Orchestration</h3>
          <p className="text-[#9B8D74] text-xs font-medium">Curate the aesthetic highlights for your patrons.</p>
        </div>
        <button
          onClick={() => { setEditingBanner(null); resetForm(); setShowCreateModal(true); }}
          className="h-14 px-10 bg-[#1A1410] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all active:scale-95"
        >
          Forge Visual Asset
        </button>
      </div>

      {/* ── Asset Inventory ──────────────────────── */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {banners.length === 0 ? (
            <motion.div layout className="py-24 text-center bg-white rounded-[3rem] border border-[rgba(26,20,16,0.06)] shadow-sm">
              <span className="text-5xl mb-6 block grayscale opacity-30">🖼️</span>
              <h4 className="font-sans font-bold text-2xl text-[#1A1410]">Gallery Empty</h4>
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#9B8D74] mt-2">No active banners in current rotation.</p>
            </motion.div>
          ) : (
            banners.map((banner) => (
              <motion.div
                key={banner._id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] p-8 border border-[rgba(26,20,16,0.06)] hover:border-amber-200 hover:shadow-2xl hover:shadow-[#1A1410]/5 transition-all overflow-hidden relative group"
              >
                <div className="flex flex-col lg:flex-row gap-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full font-sans text-[8px] font-bold uppercase tracking-widest border shadow-sm ${banner.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-[#FAFAF8] text-[#9B8D74] border-[rgba(26,20,16,0.06)]'
                        }`}>
                        {banner.status}
                      </span>
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full font-sans text-[8px] font-bold uppercase tracking-widest shadow-sm">
                        LOC: {banner.position}
                      </span>
                    </div>
                    <h4 className="text-3xl font-sans font-bold text-[#1A1410] mb-3 group-hover:text-amber-600 transition-colors">{banner.title}</h4>
                    <p className="text-[#9B8D74] text-xs font-medium line-clamp-2 leading-relaxed mb-6">{banner.description}</p>
                    <div className="flex items-center gap-6 font-mono text-[9px] font-black uppercase tracking-widest text-[#9B8D74]/60">
                      <span className="flex items-center gap-1.5"><span className="opacity-40">CAL</span> {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><span className="opacity-40">PRTY</span> {banner.priority}</span>
                    </div>
                  </div>

                  {/* High-End Preview */}
                  <div className="w-full lg:w-72 space-y-4">
                    <div
                      className="relative h-32 rounded-3xl flex flex-col justify-center px-6 border border-white/10 shadow-xl overflow-hidden group/preview"
                      style={{ backgroundColor: banner.backgroundColor }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                      <div className="relative z-10">
                        <p className="font-sans font-bold text-lg leading-tight" style={{ color: banner.textColor }}>{banner.title}</p>
                        <p className="font-sans text-[8px] font-bold uppercase tracking-widest opacity-60 mt-1" style={{ color: banner.textColor }}>{banner.subtitle}</p>
                      </div>
                      {banner.buttonText && (
                        <div
                          className="absolute right-6 bottom-4 px-4 py-1.5 rounded-full font-sans text-[7px] font-bold uppercase tracking-widest shadow-lg"
                          style={{ backgroundColor: banner.textColor, color: banner.backgroundColor }}
                        >
                          {banner.buttonText}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditBanner(banner)} className="flex-1 h-11 bg-[#FAFAF8] text-[#1A1410] rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#1A1410] hover:text-white transition-all border border-[rgba(26,20,16,0.06)]">Refine</button>
                      <button onClick={() => handleDeleteBanner(banner._id)} className="w-11 h-11 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm">🗑️</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Asset Orchestration Modal ────────────── */}
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
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600" />
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-4xl font-sans font-bold text-[#1A1410] leading-none">{editingBanner ? 'Refine Asset' : 'Forge Asset'}</h3>
                <button onClick={() => setShowCreateModal(false)} className="w-12 h-12 bg-[#FAFAF8] rounded-full flex items-center justify-center text-[#9B8D74] hover:bg-rose-500 hover:text-white transition-all font-bold">✕</button>
              </div>

              <form onSubmit={editingBanner ? handleUpdateBanner : handleCreateBanner} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Primary Signature (Title)</label>
                    <input type="text" value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-black font-display text-xl italic outline-none focus:bg-white focus:border-amber-500 transition-all shadow-sm" placeholder="e.g. Flash Mediterranean Sale" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Secondary Callout</label>
                    <input type="text" value={newBanner.subtitle} onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-bold outline-none focus:bg-white focus:border-amber-500 transition-all shadow-sm" placeholder="Exclusive To Elite Patrons" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Aesthetic Description</label>
                  <textarea value={newBanner.description} onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })} className="w-full px-6 py-4 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-medium text-sm outline-none focus:bg-white focus:border-amber-500 transition-all shadow-sm resize-none" rows={2} placeholder="Briefly describe the visual intent..." />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74]">Palette Base</label>
                    <div className="flex items-center gap-4 h-14 bg-[#FAFAF8] px-4 border border-[rgba(26,20,16,0.06)] rounded-2xl shadow-inner group">
                      <div
                        className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white shadow-lg overflow-hidden relative"
                        style={{ backgroundColor: newBanner.backgroundColor }}
                      >
                        <input type="color" value={newBanner.backgroundColor} onChange={(e) => setNewBanner({ ...newBanner, backgroundColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                      </div>
                      <span className="font-mono text-[9px] font-black text-[#9B8D74] uppercase tracking-tighter">{newBanner.backgroundColor}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74]">Text Tint</label>
                    <div className="flex items-center gap-4 h-14 bg-[#FAFAF8] px-4 border border-[rgba(26,20,16,0.06)] rounded-2xl shadow-inner group">
                      <div
                        className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white shadow-lg overflow-hidden relative"
                        style={{ backgroundColor: newBanner.textColor }}
                      >
                        <input type="color" value={newBanner.textColor} onChange={(e) => setNewBanner({ ...newBanner, textColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                      </div>
                      <span className="font-mono text-[9px] font-black text-[#9B8D74] uppercase tracking-tighter">{newBanner.textColor}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74]">Zonal Placement</label>
                    <div className="relative">
                      <select value={newBanner.position} onChange={(e) => setNewBanner({ ...newBanner, position: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-black text-[10px] uppercase tracking-widest outline-none appearance-none cursor-pointer focus:bg-white focus:border-amber-500 transition-all shadow-sm">
                        <option value="top">Celestial Header</option>
                        <option value="middle">Inter-Menu Nexus</option>
                        <option value="bottom">Foundational Footer</option>
                        <option value="hero">Heroic Overlay</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#9B8D74] text-[10px]">▼</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Action Registry & URI</label>
                    <div className="flex gap-4">
                      <input type="text" value={newBanner.buttonText} onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })} className="flex-1 h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-bold outline-none focus:bg-white focus:border-amber-500 transition-all shadow-sm" placeholder="Label (Select)" />
                      <input type="text" value={newBanner.buttonLink} onChange={(e) => setNewBanner({ ...newBanner, buttonLink: e.target.value })} className="flex-1 h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-bold outline-none focus:bg-white focus:border-amber-500 transition-all shadow-sm" placeholder="URI (/nexus)" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Temporal Duration</label>
                    <div className="flex gap-4">
                      <input type="date" value={newBanner.startDate} onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })} className="flex-1 h-14 px-4 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-mono text-[10px] outline-none" />
                      <input type="date" value={newBanner.endDate} onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })} className="flex-1 h-14 px-4 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-mono text-[10px] outline-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="h-16 bg-[#FAFAF8] text-[#9B8D74] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors border border-[rgba(26,20,16,0.06)]">Discard</button>
                  <button type="submit" className="md:col-span-2 h-16 bg-[#1A1410] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-black/10 hover:shadow-glow hover:shadow-amber-500/10 active:scale-95">
                    {editingBanner ? 'Apply Refined Protocols' : 'Commit & Launch Asset'}
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
