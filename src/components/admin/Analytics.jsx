import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

const COLORS = ['#dc2626', '#16a34a', '#f4a261', '#2a9d8f', '#e9c46a', '#264653']

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d')
  const [analytics, setAnalytics] = useState({
    salesData: [],
    popularItems: [],
    orderStatus: [],
    hourlyDistribution: [],
    customerStats: {},
    revenueMetrics: {}
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/analytics?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-black text-white">Analytics Dashboard</h2>
          <p className="text-wood-400 mt-1">Track your restaurant's performance and insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-wood-800 border border-wood-700 rounded-lg text-white focus:border-tomato-500 outline-none"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Revenue', value: `$${(analytics.summary?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: 'text-basil-400' },
          { label: 'Orders', value: (analytics.summary?.totalOrders || 0).toString(), icon: '📋', color: 'text-tomato-400' },
          { label: 'Avg Order', value: `$${(analytics.summary?.avgOrderValue || 0).toFixed(2)}`, icon: '🛒', color: 'text-amber-400' },
          { label: 'New Customers', value: (analytics.summary?.newCustomers || 0).toString(), icon: '👤', color: 'text-blue-400' },
          { label: 'Returning', value: (analytics.summary?.returningCustomers || 0).toString(), icon: '🔄', color: 'text-purple-400' },
          { label: 'Growth', value: `${((analytics.summary?.newCustomers || 0) / Math.max(analytics.summary?.totalOrders || 1, 1) * 100).toFixed(1)}%`, icon: '📈', color: 'text-green-400' }
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-wood-800 rounded-xl p-6 border border-wood-700">
          <h3 className="text-lg font-bold text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.dailySales || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#292524', border: '1px solid #44403c', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#dc2626"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Hour */}
        <div className="bg-wood-800 rounded-xl p-6 border border-wood-700">
          <h3 className="text-lg font-bold text-white mb-4">Orders by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.hourlyDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
              <XAxis dataKey="_id" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#292524', border: '1px solid #44403c', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Items */}
        <div className="bg-wood-800 rounded-xl p-6 border border-wood-700 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.popularItems || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#292524', border: '1px solid #44403c', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="count" name="Orders" fill="#dc2626" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-wood-800 rounded-xl p-6 border border-wood-700">
          <h3 className="text-lg font-bold text-white mb-4">Order Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.statusDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(analytics.statusDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#292524', border: '1px solid #44403c', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-tomato-600/20 to-tomato-800/20 rounded-xl p-6 border border-tomato-500/30">
          <h4 className="text-tomato-400 font-bold mb-2">💡 Insight</h4>
          <p className="text-white text-sm">Weekend sales are 45% higher than weekdays. Consider running weekend promotions.</p>
        </div>
        <div className="bg-gradient-to-br from-basil-600/20 to-basil-800/20 rounded-xl p-6 border border-basil-500/30">
          <h4 className="text-basil-400 font-bold mb-2">🌟 Top Performer</h4>
          <p className="text-white text-sm">Margherita pizza accounts for 28% of total orders. Feature it prominently on your menu.</p>
        </div>
        <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-xl p-6 border border-amber-500/30">
          <h4 className="text-amber-400 font-bold mb-2">⚠️ Attention</h4>
          <p className="text-white text-sm">Cancellation rate is at 2.3%, below industry average. Great job!</p>
        </div>
      </div>
    </div>
  )
}
