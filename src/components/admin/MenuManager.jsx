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

  useEffect(() => {
    fetchMenuData()
  }, [])

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
      }
    } catch (err) {
      console.error('Failed to save category:', err)
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

      if (itemForm.imageFile) {
        formData.append('image', itemForm.imageFile)
      }

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json()
        toast.error(`Failed to save item: ${errorData.error || 'Unknown error'}`)
        return
      }

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
      console.error('Failed to save item:', err)
      toast.error(`Failed to save item: ${err.message}`)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category? All items in it will be uncategorized.')) return
    const token = localStorage.getItem('adminToken')

    try {
      const res = await fetch(`/api/admin/menu/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchMenuData()
    } catch (err) {
      console.error('Failed to delete category:', err)
    }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('Delete this item?')) return
    const token = localStorage.getItem('adminToken')

    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchMenuData()
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  const filteredItems = activeCategory
    ? items.filter(item => item.categoryId === activeCategory || item.categoryId?._id === activeCategory)
    : items

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
        <p className="text-xs font-bold text-wood-400 uppercase tracking-widest animate-pulse">Loading Menu...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-24 lg:pb-10">
      {/* ── Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">Menu Manager</h2>
          <p className="text-wood-400 text-sm mt-1">Manage categories and pizza selections</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingCategory(null)
              setCategoryForm({ name: '', description: '' })
              setShowCategoryModal(true)
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-wood-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-wood-600"
          >
            + Category
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
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
            className="flex-1 sm:flex-none px-4 py-2.5 bg-tomato-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-tomato-600/20"
          >
            + Item
          </motion.button>
        </div>
      </div>

      {/* ── Category Tabs ────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all h-10 whitespace-nowrap ${activeCategory === null ? 'bg-tomato-600 text-white shadow-lg' : 'bg-wood-800 text-wood-400 border border-wood-700'
            }`}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => (
          <div key={cat._id} className="relative group flex-shrink-0">
            <button
              onClick={() => setActiveCategory(cat._id)}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all h-10 whitespace-nowrap pr-10 ${activeCategory === cat._id ? 'bg-tomato-600 text-white shadow-lg' : 'bg-wood-800 text-wood-400 border border-wood-700'
                }`}
            >
              {cat.name}
            </button>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description }); setShowCategoryModal(true); }}
                className="text-[10px] p-1.5 hover:text-white"
              >✏️</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Items Grid ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-wood-800 rounded-3xl py-16 px-4 border border-wood-700 text-center">
            <span className="text-4xl mb-4 block">🍕</span>
            <p className="text-xs font-black uppercase tracking-widest text-wood-400">Empty kitchen! Add some items.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <motion.div
              key={item._id}
              layout
              className="bg-wood-800 rounded-2xl p-4 border border-wood-700 hover:border-wood-600 transition-colors"
            >
              <div className="flex gap-4">
                {item.image && (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-wood-700">
                    <img
                      src={`${import.meta.env.VITE_API_URL || ''}${item.image}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-white text-sm sm:text-base leading-tight truncate">{item.name}</h3>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(item); setItemForm({ ...item, dietary: item.dietary || { vegetarian: false, vegan: false, glutenFree: false, spicy: false } }); setImagePreview(item.image ? `${import.meta.env.VITE_API_URL || ''}${item.image}` : null); setShowItemModal(true); }} className="text-xs">✏️</button>
                      <button onClick={() => handleDeleteItem(item._id)} className="text-xs">🗑️</button>
                    </div>
                  </div>
                  <p className="text-wood-400 text-[10px] sm:text-xs mt-1 line-clamp-2 h-8 sm:h-9">{item.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-tomato-400 font-black text-sm sm:text-base">${item.price.toFixed(2)}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${item.available ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {item.available ? 'In Stock' : 'Out'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── Category Modal (Mobile Friendly) ── */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] p-4 flex items-center justify-center" onClick={() => setShowCategoryModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-wood-800 w-full max-w-sm rounded-[2rem] border border-wood-700 p-6 sm:p-8"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-display font-black text-white mb-6 Otros">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white outline-none focus:border-tomato-500 transition-all text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest pl-1">Brief Description</label>
                  <textarea
                    value={categoryForm.description}
                    onchange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white outline-none focus:border-tomato-500 transition-all text-sm resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 py-3 bg-wood-700 text-wood-400 rounded-xl text-xs font-black uppercase tracking-widest">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-tomato-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Item Modal (Mobile Friendly Drawer-ish) ── */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] p-3 flex items-end sm:items-center justify-center shadow-2xl" onClick={() => setShowItemModal(false)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-wood-800 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-wood-700 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-black text-white">{editingItem ? 'Update Pizza' : 'Craft New Pizza'}</h3>
                <button onClick={() => setShowItemModal(false)} className="w-9 h-9 bg-wood-700 rounded-full flex items-center justify-center text-wood-300">✕</button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-5">
                {/* Image Section */}
                <div className="relative group">
                  <div className="w-full h-40 bg-wood-700 rounded-2xl border-2 border-dashed border-wood-600 flex flex-col items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <span className="text-wood-500 text-xs">📷 Add Photo</span>
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
                    <button type="button" onClick={() => { setImagePreview(null); setItemForm({ ...itemForm, image: '', imageFile: null }) }} className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full text-xs">✕</button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Display Name</label>
                    <input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm sm:text-base outline-none focus:border-tomato-500" required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Base Price ($)</label>
                    <input type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500" required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Category</label>
                    <select value={itemForm.categoryId || activeCategory} onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyBmaWxsPSJ3aGl0ZSIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTcgMTBsNSA1IDUtNXoiLz48cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PC9zdmc+')] bg-[length:24px_24px] bg-[right_8px_center] bg-no-repeat" required>
                      <option value="">Select...</option>
                      {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest tracking-widest">Description</label>
                  <textarea rows={2} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="w-full px-4 py-3 bg-wood-700 border border-wood-600 rounded-xl text-white text-sm outline-none focus:border-tomato-500 resize-none" placeholder="Ingredients, size, etc..." />
                </div>

                {/* Dietary Toggles */}
                <div className="bg-wood-700/30 p-4 rounded-2xl border border-wood-700/50">
                  <div className="grid grid-cols-2 gap-3">
                    {['vegetarian', 'vegan', 'glutenFree', 'spicy'].map((diet) => (
                      <label key={diet} className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" checked={itemForm.dietary?.[diet]} onChange={(e) => setItemForm({ ...itemForm, dietary: { ...itemForm.dietary, [diet]: e.target.checked } })} className="sr-only peer" />
                          <div className="w-8 h-4 bg-wood-600 rounded-full peer peer-checked:bg-tomato-600 transition-colors" />
                          <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-wood-400 group-hover:text-white transition-colors">{diet.replace('Free', ' Free').charAt(0).toUpperCase() + diet.slice(1)}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" checked={itemForm.available} onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })} className="sr-only peer" />
                        <div className="w-8 h-4 bg-wood-600 rounded-full peer peer-checked:bg-green-600 transition-colors" />
                        <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">In Stock</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-4 bg-wood-700 text-wood-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-tomato-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-tomato-600/20">Confirm Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
