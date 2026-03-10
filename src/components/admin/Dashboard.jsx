import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    todayOrders: 0,
    activeCustomers: 0,
    pendingOrders: 0,
    avgOrderValue: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [popularItems, setPopularItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const [analyticsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
      ])
      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json()
        setStats({
          totalRevenue: analytics.totalRevenue || 0,
          todayRevenue: analytics.todayRevenue || 0,
          totalOrders: analytics.totalOrders || 0,
          todayOrders: analytics.todayOrders || 0,
          activeCustomers: analytics.activeCustomers || 0,
          pendingOrders: analytics.pendingOrders || 0,
          avgOrderValue: analytics.avgOrderValue || 0,
        })
        setPopularItems(analytics.popularItems?.slice(0, 5) || [])
      }
      if (ordersRes.ok) {
        const orders = await ordersRes.json()
        setRecentOrders(orders.slice(0, 5))
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusStyle = (status) => {
    const map = {
      confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
      preparing: 'bg-amber-50 text-amber-700 border-amber-100',
      ready: 'bg-purple-50 text-purple-700 border-purple-100',
      delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
    }
    return map[status] || 'bg-slate-50 text-slate-700 border-slate-100'
  }

  const performanceStatus = stats.pendingOrders > 5 ? 'Busy' : stats.pendingOrders > 0 ? 'Active' : 'Optimal'
  const performanceColor = stats.pendingOrders > 5 ? 'text-rose-600' : stats.pendingOrders > 0 ? 'text-amber-600' : 'text-emerald-600'

  const statCards = [
    { label: 'Today Sales', value: `$${stats.todayRevenue.toFixed(2)}`, icon: '💎', color: 'text-[#1A1410]', suffix: 'USD' },
    { label: 'Live Orders', value: stats.todayOrders.toString(), icon: '📋', color: 'text-ember-600', suffix: 'Items' },
    { label: 'Basket Avg', value: `$${stats.avgOrderValue.toFixed(2)}`, icon: '🛒', color: 'text-[#1A1410]', suffix: 'Val' },
    { label: 'Retention', value: stats.activeCustomers.toString(), icon: '👥', color: 'text-[#1A1410]', suffix: 'Users' },
    { label: 'Preparation', value: stats.pendingOrders.toString(), icon: '⏳', color: 'text-ember-600', suffix: 'Wait' },
    { label: 'Performance', value: performanceStatus, icon: '📈', color: performanceColor, suffix: 'Ops' },
  ]

  const quickActions = [
    { label: 'Manage Kitchen', href: '/admin/menu', icon: '🍕', desc: 'Update menu & stock' },
    { label: 'Track Orders', href: '/admin/orders', icon: '📋', desc: 'Live KDS view' },
    { label: 'Customer Base', href: '/admin/customers', icon: '👥', desc: 'Loyalty & profiles' },
    { label: 'Business Insights', href: '/admin/analytics', icon: '📈', desc: 'Revenue reports' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-ember-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-ember-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] animate-pulse">Synchronizing Data</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* ── Dashboard Invitation ─────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-[1px] bg-ember-600" />
            <span className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-ember-600">Enterprise Suite</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-[#1A1410] leading-tight">
            Daily Insights
          </h2>
          <p className="text-[#9B8D74] mt-2 font-medium tracking-tight">Your restaurant operations at a premium glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="w-12 h-12 bg-white border border-[rgba(26,20,16,0.06)] rounded-2xl flex items-center justify-center text-[#9B8D74] hover:text-ember-600 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button
            onClick={() => navigate('/admin/orders')}
            className="h-12 px-6 bg-[#1A1410] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all active:scale-95 flex items-center gap-3"
          >
            <span className="w-1.5 h-1.5 bg-ember-400 rounded-full animate-pulse" />
            Live Monitor
          </button>
        </div>
      </div>

      {/* ── Key Performance Indicators (KPIs) ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
            className="bg-white rounded-3xl p-6 border border-[rgba(26,20,16,0.06)] shadow-sm hover:shadow-xl hover:shadow-[#1A1410]/5 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500">{stat.icon}</span>
              <span className="font-sans text-[9px] font-bold tracking-widest text-[#9B8D74] opacity-40">{stat.suffix}</span>
            </div>
            <div className="space-y-0.5">
              <p className={`text-3xl font-sans font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
              <label className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#9B8D74] mt-1">{stat.label}</label>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Interactive Hub ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="font-sans font-bold text-2xl flex items-center gap-3">
              Recent Transactions
            </h3>
            <button onClick={() => navigate('/admin/orders')} className="font-sans text-[10px] font-bold uppercase tracking-widest text-ember-600 hover:text-ember-700">Explore Archives →</button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-[rgba(26,20,16,0.06)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FAFAF8] border-b border-[rgba(26,20,16,0.03)] font-sans text-[10px] font-bold uppercase tracking-widest text-[#9B8D74]">
                  <tr>
                    <th className="px-6 py-5">Order #ID</th>
                    <th className="px-6 py-5">Client Profile</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Summation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(26,20,16,0.03)]">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <span className="text-4xl mb-4">📜</span>
                          <p className="font-sans text-[10px] uppercase font-bold tracking-widest">No Recent activity recorded</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-[#FAFAF8] transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F5F3EF] flex items-center justify-center text-xs font-black text-[#1A1410]">#</div>
                            <span className="font-sans text-xs font-bold text-[#1A1410]">{order.orderNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-bold text-sm text-[#1A1410]">{order.customerInfo?.name || 'V.I.P. Guest'}</p>
                            <p className="text-[10px] font-sans text-[#9B8D74] uppercase tracking-tighter opacity-70">{order.type} Service</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="font-sans font-bold text-lg text-[#1A1410]">${order.total?.toFixed(2)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Intelligence & Actions */}
        <div className="lg:col-span-4 space-y-8">
          <section>
            <h4 className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] mb-4 px-2">Quick Commands</h4>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => (
                <motion.button
                  key={action.label}
                  onClick={() => navigate(action.href)}
                  whileHover={{ x: 6 }}
                  className="bg-white p-5 rounded-3xl border border-[rgba(26,20,16,0.06)] shadow-sm hover:shadow-md transition-all text-left flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#F5F3EF] flex items-center justify-center text-xl group-hover:bg-[#1A1410] group-hover:text-white transition-all">
                    {action.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1A1410]">{action.label}</p>
                    <p className="text-[10px] font-medium text-[#9B8D74]">{action.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          <section>
            <h4 className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] mb-4 px-2">Trending Favorites</h4>
            <div className="bg-white rounded-[2rem] border border-[rgba(26,20,16,0.06)] shadow-sm divide-y divide-[rgba(26,20,16,0.03)] overflow-hidden">
              {popularItems.length === 0 ? (
                <div className="p-12 text-center opacity-20">
                  <p className="font-sans text-[9px] font-bold">Waiting for Data...</p>
                </div>
              ) : (
                popularItems.map((item, index) => (
                  <div key={index} className="px-6 py-4 flex items-center justify-between group hover:bg-[#FAFAF8] transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="font-sans font-bold text-ember-600 text-lg">{index + 1}</span>
                      <span className="font-bold text-sm text-[#1A1410] truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[10px] font-bold text-[#9B8D74]">{item.count} Sold</span>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-glow shadow-green-500/50" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
