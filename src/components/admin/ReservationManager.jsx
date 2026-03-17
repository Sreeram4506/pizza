import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ReservationManager() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/reservations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setReservations(await res.json())
      }
    } catch (err) {
      toast.error('Failed to fetch reservations')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        toast.success(`Reservation ${newStatus}`)
        setReservations(reservations.map(r => r._id === id ? { ...r, status: newStatus } : r))
      }
    } catch (err) {
      toast.error('Update failed')
    }
  }

  const deleteReservation = async (id) => {
    if (!window.confirm('Delete this reservation?')) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        toast.success('Deleted successfully')
        setReservations(reservations.filter(r => r._id !== id))
      }
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const filteredReservations = reservations.filter(r => filter === 'all' || r.status === filter)

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
          <h2 className="text-3xl font-sans font-bold text-[#1A1410]">Table Reservations</h2>
          <p className="text-[#9B8D74] mt-1">Manage dining bookings and floor capacity.</p>
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
          {filteredReservations.map((res) => (
            <motion.div
              key={res._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 border border-[rgba(26,20,16,0.06)] shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(res.status)}`}>
                      {res.status}
                    </span>
                    <span className="text-[10px] font-bold text-[#9B8D74] uppercase tracking-widest">
                      Ref: {res._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1A1410]">{res.name}</h3>
                  <p className="text-xs text-[#5C554E] font-medium mt-1">{res.phone} • {res.email}</p>
                </div>

                <div className="flex gap-8 border-l border-[rgba(26,20,16,0.06)] pl-8">
                  <div>
                    <p className="text-[9px] font-black text-[#9B8D74] uppercase tracking-[0.2em] mb-1">Schedule</p>
                    <p className="font-bold text-sm text-[#1A1410]">
                      {new Date(res.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs font-medium text-ember-600">{res.time}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-[#9B8D74] uppercase tracking-[0.2em] mb-1">Guests</p>
                    <p className="font-bold text-xl text-[#1A1410]">{res.guestsCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => updateStatus(res._id, 'confirmed')}
                      disabled={res.status === 'confirmed'}
                      className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => updateStatus(res._id, 'cancelled')}
                      disabled={res.status === 'cancelled'}
                      className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-30"
                    >
                      Cancel
                    </button>
                  </div>
                  <button
                    onClick={() => deleteReservation(res._id)}
                    className="p-3 text-[#9B8D74] hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {res.notes && (
                <div className="mt-4 pt-4 border-t border-[rgba(26,20,16,0.03)] flex gap-3">
                  <span className="text-lg opacity-30">💬</span>
                  <p className="text-xs font-medium text-[#5C554E] italic">"{res.notes}"</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredReservations.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <span className="text-5xl mb-4 block">🍷</span>
            <p className="font-sans text-[10px] font-bold uppercase tracking-widest">No reservations on the books</p>
          </div>
        )}
      </div>
    </div>
  )
}
