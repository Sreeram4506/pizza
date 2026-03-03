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

  const statusColor = (status) => {
    const map = {
      confirmed: 'bg-blue-500/20 text-blue-400',
      preparing: 'bg-yellow-500/20 text-yellow-400',
      ready: 'bg-purple-500/20 text-purple-400',
      delivered: 'bg-green-500/20 text-green-400',
    }
    return map[status] || 'bg-red-500/20 text-red-400'
  }

  const statCards = [
    { label: 'Today Revenue', value: `$${stats.todayRevenue.toFixed(2)}`, icon: '💰', color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Today Orders', value: stats.todayOrders.toString(), icon: '📋', color: 'text-tomato-400', bg: 'bg-tomato-400/10' },
    { label: 'Avg Order', value: `$${stats.avgOrderValue.toFixed(2)}`, icon: '🛒', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Total Orders', value: stats.totalOrders.toString(), icon: '📊', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Customers', value: stats.activeCustomers.toString(), icon: '👥', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Pending', value: stats.pendingOrders.toString(), icon: '⏳', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ]

  const quickActions = [
    { label: '+ Add Item', href: '/admin/menu', color: 'bg-green-600 hover:bg-green-700', icon: '🍕' },
    { label: 'View Orders', href: '/admin/orders', color: 'bg-tomato-600 hover:bg-tomato-700', icon: '📋' },
    { label: 'Customers', href: '/admin/customers', color: 'bg-wood-700 hover:bg-wood-600', icon: '👥' },
    { label: 'Analytics', href: '/admin/analytics', color: 'bg-wood-700 hover:bg-wood-600', icon: '📈' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
        <p className="text-xs font-bold text-wood-400 uppercase tracking-widest animate-pulse">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      {/* ── Header ───────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">Dashboard</h2>
          <p className="text-wood-400 mt-1 text-sm">Welcome back! Here's today's overview.</p>
        </div>
        <motion.button
          onClick={fetchDashboardData}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 p-2.5 bg-wood-700 hover:bg-wood-600 rounded-xl transition-colors text-wood-300 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </motion.button>
      </div>

      {/* ── Stats Grid ───────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-wood-800 rounded-2xl p-4 border border-wood-700 hover:border-wood-600 transition-colors"
          >
            <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <p className={`text-xl sm:text-2xl font-black ${stat.color} leading-none`}>{stat.value}</p>
            <p className="text-wood-400 text-xs mt-1 leading-tight">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Quick Actions ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <motion.a
            key={action.label}
            href={action.href}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`${action.color} text-white rounded-2xl px-4 py-3.5 font-bold text-sm transition-colors flex items-center gap-2 justify-center`}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </motion.a>
        ))}
      </div>

      {/* ── Recent Orders + Popular Items ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="bg-wood-800 rounded-2xl border border-wood-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-wood-700">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span>📋</span> Recent Orders
            </h3>
            <a href="/admin/orders" className="text-tomato-400 text-xs font-semibold hover:text-tomato-300">
              View All →
            </a>
          </div>
          <div className="divide-y divide-wood-700/60">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-wood-500">
                <span className="text-4xl mb-2">📭</span>
                <p className="text-xs font-bold uppercase tracking-wider">No recent orders</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-wood-700/40 transition-colors">
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">#{order.orderNumber}</p>
                    <p className="text-wood-400 text-xs truncate mt-0.5">{order.customerInfo?.name || 'Guest'}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-tomato-400 font-black text-sm">${order.total?.toFixed(2)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-wood-800 rounded-2xl border border-wood-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-wood-700">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span>🔥</span> Popular Items
            </h3>
            <a href="/admin/menu" className="text-tomato-400 text-xs font-semibold hover:text-tomato-300">
              Manage →
            </a>
          </div>
          <div className="divide-y divide-wood-700/60">
            {popularItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-wood-500">
                <span className="text-4xl mb-2">📊</span>
                <p className="text-xs font-bold uppercase tracking-wider">No data available</p>
              </div>
            ) : (
              popularItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3.5 hover:bg-wood-700/40 transition-colors">
                  <span className="w-7 h-7 bg-tomato-600 rounded-lg flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-white font-medium text-sm flex-1 truncate">{item.name}</span>
                  <span className="text-wood-400 text-xs flex-shrink-0 bg-wood-700 px-2.5 py-1 rounded-full">{item.count} orders</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
