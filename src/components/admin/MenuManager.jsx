import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function MenuManager() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    available: true,
    modifiers: [],
    tags: [],
    dietary: { vegetarian: false, vegan: false, glutenFree: false, spicy: false },
    image: ''
  })

  useEffect(() => { fetchMenuData() }, [])

  const fetchMenuData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const [catRes, itemsRes] = await Promise.all([
        fetch('/api/admin/menu/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/menu/items', { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (itemsRes.ok) setItems(await itemsRes.json())
    } catch (err) {
      console.error('Failed to fetch menu:', err)
      toast.error('Failed to load menu data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('adminToken')
    const url = editingCategory ? `/api/admin/menu/categories/${editingCategory._id}` : '/api/admin/menu/categories'
    const method = editingCategory ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryForm)
      })

      if (res.ok) {
        setShowCategoryModal(false)
        setEditingCategory(null)
        setCategoryForm({ name: '', description: '' })
        fetchMenuData()
        toast.success(editingCategory ? 'Category updated' : 'Category created')
      }
    } catch (err) {
      toast.error('Failed to save category')
    }
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('adminToken')
    const url = editingItem ? `/api/admin/menu/items/${editingItem._id}` : '/api/admin/menu/items'
    const method = editingItem ? 'PUT' : 'POST'

    try {
      const formData = new FormData()
      formData.append('name', itemForm.name)
      formData.append('description', itemForm.description)
      formData.append('price', itemForm.price)
      formData.append('categoryId', activeCategory || itemForm.categoryId)
      formData.append('available', itemForm.available)
      formData.append('modifiers', JSON.stringify(itemForm.modifiers))
      formData.append('tags', JSON.stringify(itemForm.tags))
      formData.append('dietary', JSON.stringify(itemForm.dietary))

      if (itemForm.imageFile) formData.append('image', itemForm.imageFile)

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!res.ok) throw new Error('Failed to save')

      setShowItemModal(false)
      setEditingItem(null)
      setItemForm({
        name: '', description: '', price: '', categoryId: '', available: true,
        modifiers: [], tags: [], dietary: { vegetarian: false, vegan: false, glutenFree: false, spicy: false },
        image: ''
      })
      setImagePreview(null)
      fetchMenuData()
      toast.success('Pizza saved successfully!')
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('Move this item to archives?')) return
    const token = localStorage.getItem('adminToken')
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchMenuData()
        toast.success('Item archived')
      }
    } catch (err) {
      toast.error('Deletion failed')
    }
  }

  const filteredItems = activeCategory
    ? items.filter(item => item.categoryId === activeCategory || item.categoryId?._id === activeCategory)
    : items

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-ember-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-ember-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[#9B8D74] animate-pulse">Consulting the Kitchen</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
      {/* ── Kitchen Header ───────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-[1px] bg-ember-600" />
            <span className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-ember-600">Inventory Control</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black italic text-[#1A1410] leading-tight">
            Menu Kitchen
          </h2>
          <p className="text-[#9B8D74] mt-2 font-medium tracking-tight">Curate your authentic Mediterranean selections.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }); setShowCategoryModal(true) }}
            className="h-12 px-6 bg-white border border-[rgba(26,20,16,0.06)] text-[#1A1410] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F5F3EF] transition-all active:scale-95 shadow-sm"
          >
            + New Category
          </button>
          <button
            onClick={() => {
              setEditingItem(null)
              setItemForm({
                name: '', description: '', price: '', categoryId: activeCategory || '', available: true,
                modifiers: [], tags: [], dietary: { vegetarian: false, vegan: false, glutenFree: false, spicy: false },
                image: ''
              })
              setImagePreview(null)
              setShowItemModal(true)
            }}
            className="h-12 px-8 bg-[#1A1410] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all active:scale-95"
          >
            + Create Pizza
          </button>
        </div>
      </div>

      {/* ── Category Navigation ──────────────────── */}
      <div className="flex gap-2 p-1.5 bg-white border border-[rgba(26,20,16,0.06)] rounded-[2rem] overflow-x-auto scrollbar-hide shadow-sm sticky top-0 z-10 backdrop-blur-xl bg-white/90">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-8 py-3 rounded-[1.5rem] font-mono text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === null ? 'bg-[#1A1410] text-white shadow-lg' : 'text-[#9B8D74] hover:bg-[#F5F3EF]'
            }`}
        >
          Entire Collection ({items.length})
        </button>
        {categories.map((cat) => (
          <div key={cat._id} className="relative flex-shrink-0 flex items-center">
            <button
              onClick={() => setActiveCategory(cat._id)}
              className={`px-8 py-3 rounded-[1.5rem] font-mono text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat._id ? 'bg-[#1A1410] text-white shadow-lg' : 'text-[#9B8D74] hover:bg-[#F5F3EF]'
                }`}
            >
              {cat.name}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description }); setShowCategoryModal(true); }}
              className="ml-[-24px] mr-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] hover:scale-120 active:scale-90"
            >✏️</button>
          </div>
        ))}
      </div>

      {/* ── Culinary Grid ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div layout className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-[rgba(26,20,16,0.06)] shadow-inner">
              <span className="text-5xl mb-6 block grayscale opacity-30">🍕</span>
              <h3 className="font-display font-black text-2xl italic text-[#1A1410]">Kitchen is Empty</h3>
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#9B8D74] mt-2">No selections recorded in this category</p>
            </motion.div>
          ) : (
            filteredItems.map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] p-6 border border-[rgba(26,20,16,0.06)] shadow-sm hover:shadow-xl hover:shadow-[#1A1410]/5 transition-all group overflow-hidden relative"
              >
                <div className="flex gap-6">
                  {item.image && (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-[rgba(26,20,16,0.03)] group-hover:scale-105 transition-transform duration-500">
                      <img
                        src={item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || ''}${item.image}`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-display font-black text-xl italic text-[#1A1410] truncate group-hover:text-ember-600 transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingItem(item); setItemForm({ ...item, dietary: item.dietary || { vegetarian: false, vegan: false, glutenFree: false, spicy: false } }); setImagePreview(item.image ? (item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || ''}${item.image}`) : null); setShowItemModal(true); }} className="w-8 h-8 rounded-lg bg-[#FAFAF8] flex items-center justify-center text-xs hover:bg-[#1A1410] hover:text-white transition-all shadow-sm">✏️</button>
                          <button onClick={() => handleDeleteItem(item._id)} className="w-8 h-8 rounded-lg bg-[#FAFAF8] flex items-center justify-center text-xs hover:bg-rose-500 hover:text-white transition-all shadow-sm">🗑️</button>
                        </div>
                      </div>
                      <p className="text-[#9B8D74] font-medium text-xs leading-relaxed line-clamp-2 h-9">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-[rgba(26,20,16,0.03)]">
                      <div className="space-y-0.5">
                        <p className="font-display font-black text-2xl italic text-[#1A1410] tracking-tight">
                          <span className="text-xs font-mono font-black italic opacity-30 mr-1">$</span>
                          {item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[9px] font-black uppercase tracking-widest border shadow-sm ${item.available ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                        <span className={`w-1 h-1 rounded-full ${item.available ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                        {item.available ? 'Active Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Category Modal ───────────────────────── */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 bg-[#1A1410]/40 backdrop-blur-md z-[200] p-4 flex items-center justify-center" onClick={() => setShowCategoryModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[3rem] border border-[rgba(26,20,16,0.06)] p-10 shadow-2xl overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ember-400 to-ember-600" />
              <h3 className="text-3xl font-display font-black italic text-[#1A1410] mb-8">
                {editingCategory ? 'Edit Section' : 'Add Section'}
              </h3>
              <form onSubmit={handleSaveCategory} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Section Title</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-bold outline-none focus:border-ember-500 focus:bg-white transition-all shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Narrative (Optional)</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-6 py-4 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-medium text-sm outline-none focus:border-ember-500 focus:bg-white transition-all shadow-sm resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 h-14 bg-[#FAFAF8] text-[#9B8D74] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-[#1A1410] transition-colors">Discard</button>
                  <button type="submit" className="flex-1 h-14 bg-[#1A1410] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/10">Commit</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Culinary Item Modal ─────────────────── */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 bg-[#1A1410]/40 backdrop-blur-md z-[210] p-4 flex items-center justify-center" onClick={() => setShowItemModal(false)}>
            <motion.div
              initial={{ opacity: 0, y: '100vh' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100vh' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="bg-white w-full max-w-xl rounded-[3.5rem] border border-[rgba(26,20,16,0.06)] p-10 max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#1A1410]" />
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-4xl font-display font-black italic text-[#1A1410] leading-none">
                  {editingItem ? 'Edit Recipe' : 'New Creation'}
                </h3>
                <button onClick={() => setShowItemModal(false)} className="w-12 h-12 bg-[#FAFAF8] rounded-full flex items-center justify-center text-[#9B8D74] hover:bg-rose-500 hover:text-white transition-all shadow-sm hover:shadow-rose-100 font-bold">✕</button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-8">
                {/* Visual Representation */}
                <div className="relative group mx-auto max-w-sm">
                  <div className="aspect-square bg-[#FAFAF8] rounded-[2.5rem] border-2 border-dashed border-[rgba(26,20,16,0.1)] flex flex-col items-center justify-center overflow-hidden group-hover:border-ember-500 transition-colors cursor-pointer relative shadow-inner">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center">
                        <span className="text-4xl mb-4 block">📸</span>
                        <span className="font-mono text-[9px] font-black uppercase tracking-widest text-[#9B8D74]">Upload Food Photography</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => { setImagePreview(reader.result); setItemForm({ ...itemForm, imageFile: file }) }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  {imagePreview && (
                    <button type="button" onClick={() => { setImagePreview(null); setItemForm({ ...itemForm, image: '', imageFile: null }) }} className="absolute -top-2 -right-2 w-10 h-10 bg-[#1A1410] text-white rounded-full flex items-center justify-center text-sm shadow-xl hover:bg-rose-500 transition-colors">✕</button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5 col-span-full">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Recipe Name</label>
                    <input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-bold text-lg outline-none focus:bg-white focus:border-ember-500 transition-all shadow-sm" required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Monetary Value ($)</label>
                    <input type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-black font-display text-xl outline-none focus:bg-white focus:border-ember-500 transition-all shadow-sm" required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Heritage (Category)</label>
                    <div className="relative">
                      <select value={itemForm.categoryId || activeCategory} onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })} className="w-full h-14 px-6 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-black text-[10px] uppercase tracking-widest outline-none appearance-none cursor-pointer focus:bg-white focus:border-ember-500 transition-all shadow-sm" required>
                        <option value="">Select Cuisine...</option>
                        {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#9B8D74]">▼</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] pl-1">Culinary Description</label>
                  <textarea rows={3} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="w-full px-6 py-4 bg-[#FAFAF8] border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-medium text-sm outline-none focus:bg-white focus:border-ember-500 transition-all shadow-sm resize-none" placeholder="Detail the ingredients, inspiration, and flavors..." />
                </div>

                {/* Dietary Metadata */}
                <div className="p-8 bg-[#FAFAF8] rounded-[2.5rem] border border-[rgba(26,20,16,0.03)] space-y-6 shadow-inner">
                  <h4 className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#9B8D74] text-center mb-6">Dietary Attributes</h4>
                  <div className="grid grid-cols-2 gap-8">
                    {['vegetarian', 'vegan', 'glutenFree', 'spicy'].map((diet) => (
                      <label key={diet} className="flex items-center justify-between cursor-pointer group">
                        <span className="font-bold text-xs text-[#1A1410] group-hover:text-ember-600 transition-colors uppercase tracking-tight">{diet.replace('Free', ' Free')}</span>
                        <div className="relative">
                          <input type="checkbox" checked={itemForm.dietary?.[diet]} onChange={(e) => setItemForm({ ...itemForm, dietary: { ...itemForm.dietary, [diet]: e.target.checked } })} className="sr-only peer" />
                          <div className="w-10 h-5 bg-[#EAE7E1] rounded-full peer peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-5" />
                        </div>
                      </label>
                    ))}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="font-black text-[10px] text-ember-600 uppercase tracking-widest">In Stock Status</span>
                      <div className="relative">
                        <input type="checkbox" checked={itemForm.available} onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })} className="sr-only peer" />
                        <div className="w-10 h-5 bg-[#EAE7E1] rounded-full peer peer-checked:bg-[#1A1410] transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-5" />
                      </div>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="font-black text-[10px] text-ember-600 uppercase tracking-widest">🌟 Star Item</span>
                      <div className="relative">
                        <input type="checkbox" checked={itemForm.isPopular} onChange={(e) => setItemForm({ ...itemForm, isPopular: e.target.checked })} className="sr-only peer" />
                        <div className="w-10 h-5 bg-[#EAE7E1] rounded-full peer peer-checked:bg-ember-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-5" />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 h-16 bg-[#FAFAF8] text-[#9B8D74] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-[#1A1410] transition-colors">Discard Recipe</button>
                  <button type="submit" className="flex-1 h-16 bg-[#1A1410] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-[#1A1410]/20 hover:shadow-glow hover:shadow-ember-500/10">Commit to Kitchen</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
