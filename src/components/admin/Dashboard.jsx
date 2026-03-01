import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      
      // Fetch analytics from admin API
      const analyticsRes = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json()
        setStats({
          totalRevenue: analytics.totalRevenue || 0,
          todayRevenue: analytics.todayRevenue || 0,
          totalOrders: analytics.totalOrders || 0,
          todayOrders: analytics.todayOrders || 0,
          activeCustomers: analytics.activeCustomers || 0,
          pendingOrders: analytics.pendingOrders || 0,
          avgOrderValue: analytics.avgOrderValue || 0
        })
        setPopularItems(analytics.popularItems?.slice(0, 5) || [])
      }
      
      // Fetch recent orders from admin API
      const ordersRes = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
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
      <div>
        <h2 className="text-3xl font-display font-black text-white">Dashboard</h2>
        <p className="text-wood-400 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Revenue (24h)', value: `$${stats.todayRevenue.toFixed(2)}`, icon: '💰', color: 'text-basil-400' },
          { label: 'Orders (24h)', value: stats.todayOrders.toString(), icon: '📋', color: 'text-tomato-400' },
          { label: 'Avg Order', value: `$${stats.avgOrderValue.toFixed(2)}`, icon: '🛒', color: 'text-amber-400' },
          { label: 'Total Orders', value: stats.totalOrders.toString(), icon: '📊', color: 'text-blue-400' },
          { label: 'Customers', value: stats.activeCustomers.toString(), icon: '👥', color: 'text-purple-400' },
          { label: 'Pending', value: stats.pendingOrders.toString(), icon: '⏳', color: 'text-orange-400' }
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-wood-800 rounded-xl p-4 border border-wood-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-wood-400 text-sm">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-wood-800 rounded-xl p-6 border border-wood-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Recent Orders</h3>
            <a href="/admin/orders" className="text-tomato-400 text-sm hover:text-tomato-300">View All →</a>
          </div>
          
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-wood-400 text-center py-8">No recent orders</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-wood-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">#{order.orderNumber}</p>
                    <p className="text-wood-400 text-sm">{order.customerInfo?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-tomato-400 font-bold">${order.total?.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                      order.status === 'preparing' ? 'bg-yellow-500/20 text-yellow-400' :
                      order.status === 'ready' ? 'bg-purple-500/20 text-purple-400' :
                      order.status === 'delivered' ? 'bg-basil-500/20 text-basil-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-wood-800 rounded-xl p-6 border border-wood-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Popular Items</h3>
            <a href="/admin/menu" className="text-tomato-400 text-sm hover:text-tomato-300">Manage Menu →</a>
          </div>
          
          <div className="space-y-3">
            {popularItems.length === 0 ? (
              <p className="text-wood-400 text-center py-8">No data available</p>
            ) : (
              popularItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-wood-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-tomato-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </span>
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                  <span className="text-wood-300">{item.count} orders</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-wood-800 rounded-xl p-6 border border-wood-700">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/menu" className="px-4 py-2 bg-basil-600 text-white rounded-lg hover:bg-basil-700 transition-colors">
            + Add Menu Item
          </a>
          <a href="/admin/orders" className="px-4 py-2 bg-tomato-600 text-white rounded-lg hover:bg-tomato-700 transition-colors">
            View Orders
          </a>
          <a href="/admin/customers" className="px-4 py-2 bg-wood-700 text-white rounded-lg hover:bg-wood-600 transition-colors">
            Manage Customers
          </a>
          <a href="/admin/analytics" className="px-4 py-2 bg-wood-700 text-white rounded-lg hover:bg-wood-600 transition-colors">
            View Reports
          </a>
        </div>
      </div>
    </div>
  )
}
