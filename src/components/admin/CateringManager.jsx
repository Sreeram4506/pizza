import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function CateringManager() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/catering', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setRequests(await res.json())
      }
    } catch (err) {
      toast.error('Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/catering/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        toast.success(`Request marked as ${newStatus}`)
        setRequests(requests.map(r => r._id === id ? { ...r, status: newStatus } : r))
      }
    } catch (err) {
      toast.error('Update failed')
    }
  }

  const deleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/catering/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        toast.success('Deleted successfully')
        setRequests(requests.filter(r => r._id !== id))
      }
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100'
      default: return 'bg-amber-50 text-amber-700 border-amber-100'
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-4 border-ember-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-sans font-bold text-[#1A1410]">Catering Inquiries</h2>
          <p className="text-[#9B8D74] mt-1">Manage and track event booking requests.</p>
        </div>
        <div className="flex bg-white rounded-2xl p-1 border border-[rgba(26,20,16,0.06)] shadow-sm">
          {['all', 'pending', 'confirmed', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === f ? 'bg-[#1A1410] text-white shadow-lg' : 'text-[#9B8D74] hover:text-[#1A1410]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredRequests.map((req) => (
            <motion.div
              key={req._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 border border-[rgba(26,20,16,0.06)] shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-4 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                    <span className="text-[10px] font-bold text-[#9B8D74] uppercase tracking-widest">
                      ID: {req._id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[#1A1410]">{req.name}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-[#5C554E]">
                        <span className="opacity-50 text-lg">📧</span> {req.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-[#5C554E]">
                        <span className="opacity-50 text-lg">📞</span> {req.phone}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-[rgba(26,20,16,0.03)]">
                    <div>
                      <p className="text-[9px] font-black text-[#9B8D74] uppercase tracking-[0.2em] mb-1">Event Date</p>
                      <p className="font-bold text-sm text-[#1A1410]">{new Date(req.eventDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#9B8D74] uppercase tracking-[0.2em] mb-1">Time</p>
                      <p className="font-bold text-sm text-[#1A1410]">{req.eventTime}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#9B8D74] uppercase tracking-[0.2em] mb-1">Guests</p>
                      <p className="font-bold text-sm text-[#1A1410]">{req.guestsCount}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#9B8D74] uppercase tracking-[0.2em] mb-1">Type</p>
                      <p className="font-bold text-sm text-[#1A1410] capitalize">{req.eventType}</p>
                    </div>
                  </div>

                  {req.notes && (
                    <div className="mt-4 p-4 bg-[#F5F3EF] rounded-2xl">
                      <p className="text-[9px] font-black text-[#9B8D74] uppercase tracking-[0.2em] mb-1">Additional Notes</p>
                      <p className="text-xs font-medium text-[#5C554E] leading-relaxed">{req.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-2">
                  {['confirmed', 'completed', 'cancelled'].map(s => s !== req.status && (
                    <button
                      key={s}
                      onClick={() => updateStatus(req._id, s)}
                      className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white border border-[rgba(26,20,16,0.06)] hover:bg-[#1A1410] hover:text-white transition-all shadow-sm"
                    >
                      Set {s}
                    </button>
                  ))}
                  <button
                    onClick={() => deleteRequest(req._id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredRequests.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <span className="text-5xl mb-4 block">🍱</span>
            <p className="font-sans text-[10px] font-bold uppercase tracking-widest">No catering inquiries found</p>
          </div>
        )}
      </div>
    </div>
  )
}
