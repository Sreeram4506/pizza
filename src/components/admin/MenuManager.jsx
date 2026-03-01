import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

    console.log('Saving item:', { editingItem, url, method, itemForm })

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('name', itemForm.name)
      formData.append('description', itemForm.description)
      formData.append('price', itemForm.price)
      formData.append('categoryId', activeCategory || itemForm.categoryId)
      formData.append('available', itemForm.available)
      formData.append('modifiers', JSON.stringify(itemForm.modifiers))
      formData.append('tags', JSON.stringify(itemForm.tags))
      formData.append('dietary', JSON.stringify(itemForm.dietary))
      
      // Add image if selected
      if (itemForm.imageFile) {
        formData.append('image', itemForm.imageFile)
        console.log('Adding image to form:', itemForm.imageFile.name)
      }

      console.log('FormData contents:')
      for (let [key, value] of formData.entries()) {
        console.log(key, value)
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      console.log('Response status:', res.status)
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Save failed:', errorData)
        alert(`Failed to save item: ${errorData.error || 'Unknown error'}`)
        return
      }

      const savedItem = await res.json()
      console.log('Item saved successfully:', savedItem)

      setShowItemModal(false)
      setEditingItem(null)
      setItemForm({
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
      setImagePreview(null)
      fetchMenuData()
    } catch (err) {
      console.error('Failed to save item:', err)
      alert(`Failed to save item: ${err.message}`)
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-10 h-10 border-3 border-tomato-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-black text-white">Menu Management</h2>
          <p className="text-wood-400 mt-1">Manage your restaurant's menu categories and items</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            onClick={() => {
              setEditingCategory(null)
              setCategoryForm({ name: '', description: '' })
              setShowCategoryModal(true)
            }}
            className="px-4 py-2 bg-basil-600 text-white rounded-lg font-medium hover:bg-basil-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            + Category
          </motion.button>
          <motion.button
            onClick={() => {
              setEditingItem(null)
              setItemForm({
                name: '',
                description: '',
                price: '',
                categoryId: activeCategory || '',
                available: true,
                modifiers: [],
                tags: [],
                dietary: { vegetarian: false, vegan: false, glutenFree: false, spicy: false },
                image: ''
              })
              setImagePreview(null)
              setShowItemModal(true)
            }}
            disabled={!activeCategory && categories.length > 0}
            className="px-4 py-2 bg-tomato-600 text-white rounded-lg font-medium hover:bg-tomato-700 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            + Menu Item
          </motion.button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
            activeCategory === null
              ? 'bg-tomato-600 text-white'
              : 'bg-wood-700 text-wood-300 hover:bg-wood-600'
          }`}
        >
          All Items ({items.length})
        </button>
        {categories.map((cat) => (
          <div key={cat._id} className="flex items-center gap-1">
            <button
              onClick={() => setActiveCategory(cat._id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                activeCategory === cat._id
                  ? 'bg-tomato-600 text-white'
                  : 'bg-wood-700 text-wood-300 hover:bg-wood-600'
              }`}
            >
              {cat.name} ({items.filter(i => i.categoryId === cat._id || i.categoryId?._id === cat._id).length})
            </button>
            <button
              onClick={() => {
                setEditingCategory(cat)
                setCategoryForm({ name: cat.name, description: cat.description })
                setShowCategoryModal(true)
              }}
              className="p-1 text-wood-400 hover:text-white"
            >
              ✏️
            </button>
            <button
              onClick={() => handleDeleteCategory(cat._id)}
              className="p-1 text-wood-400 hover:text-red-400"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <motion.div
            key={item._id}
            layout
            className="bg-wood-800 rounded-xl p-4 border border-wood-700 hover:border-tomato-500 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Item Image */}
                {item.image && (
                  <div className="mb-3">
                    <img 
                      src={`http://localhost:5000${item.image}`}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-lg border border-wood-600"
                    />
                  </div>
                )}
                <h3 className="font-bold text-white">{item.name}</h3>
                <p className="text-wood-400 text-sm mt-1 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-tomato-400 font-bold">${item.price.toFixed(2)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.available ? 'bg-basil-600/20 text-basil-400' : 'bg-red-600/20 text-red-400'
                  }`}>
                    {item.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                {item.dietary.vegetarian && (
                  <div className="flex gap-1 mt-2">
                    {item.dietary.vegetarian && <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">🥬 Veg</span>}
                    {item.dietary.vegan && <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">🌱 Vegan</span>}
                    {item.dietary.glutenFree && <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">🌾 GF</span>}
                    {item.dietary.spicy && <span className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded">🌶️ Spicy</span>}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setEditingItem(item)
                    setItemForm({
                      ...item,
                      dietary: item.dietary || { vegetarian: false, vegan: false, glutenFree: false, spicy: false }
                    })
                    setImagePreview(item.image ? `http://localhost:5000${item.image}` : null)
                    setShowItemModal(true)
                  }}
                  className="p-2 text-wood-400 hover:text-white hover:bg-wood-700 rounded-lg"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteItem(item._id)}
                  className="p-2 text-wood-400 hover:text-red-400 hover:bg-wood-700 rounded-lg"
                >
                  🗑️
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-wood-800 rounded-2xl p-6 w-full max-w-md border border-wood-700"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 px-4 py-2 bg-wood-700 text-white rounded-lg hover:bg-wood-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-tomato-600 text-white rounded-lg hover:bg-tomato-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Modal */}
      <AnimatePresence>
        {showItemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowItemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-wood-800 rounded-2xl p-6 w-full max-w-lg border border-wood-700 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {editingItem ? 'Edit Item' : 'New Menu Item'}
              </h3>
              <form onSubmit={handleSaveItem} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Item Image</label>
                  <div className="space-y-2">
                    {imagePreview && (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded-lg border border-wood-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null)
                            setItemForm({ ...itemForm, image: '', imageFile: null })
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setImagePreview(reader.result)
                              setItemForm({ ...itemForm, imageFile: file })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-tomato-600 file:text-white"
                      />
                      {uploadingImage && (
                        <div className="animate-spin w-4 h-4 border-2 border-tomato-500 border-t-transparent rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-wood-400">Upload an image for the menu item (JPEG, PNG, WebP - Max 5MB)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wood-300 mb-1">Description</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-wood-300 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-wood-300 mb-1">Category</label>
                    <select
                      value={itemForm.categoryId || activeCategory}
                      onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                      className="w-full px-4 py-2 bg-wood-700 border border-wood-600 rounded-lg text-white focus:border-tomato-500 outline-none"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-wood-300">
                    <input
                      type="checkbox"
                      checked={itemForm.available}
                      onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })}
                      className="w-4 h-4 rounded border-wood-600"
                    />
                    Available
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-wood-300">Dietary Options</label>
                  <div className="flex gap-4 flex-wrap">
                    {['vegetarian', 'vegan', 'glutenFree', 'spicy'].map((diet) => (
                      <label key={diet} className="flex items-center gap-2 text-wood-300 text-sm">
                        <input
                          type="checkbox"
                          checked={itemForm.dietary[diet]}
                          onChange={(e) => setItemForm({
                            ...itemForm,
                            dietary: { ...itemForm.dietary, [diet]: e.target.checked }
                          })}
                          className="w-4 h-4 rounded border-wood-600"
                        />
                        {diet === 'glutenFree' ? 'Gluten Free' : diet.charAt(0).toUpperCase() + diet.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="flex-1 px-4 py-2 bg-wood-700 text-white rounded-lg hover:bg-wood-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-tomato-600 text-white rounded-lg hover:bg-tomato-700"
                  >
                    Save Item
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
