import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'

const COLORS = ['#dc2626', '#16a34a', '#f4a261', '#2a9d8f', '#e9c46a', '#264653']

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d')
  const [analytics, setAnalytics] = useState({
    summary: {},
    dailySales: [],
    popularItems: [],
    statusDistribution: [],
    hourlyDistribution: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
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

  const stats = [
    { label: 'Revenue', value: `$${(analytics.summary?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: 'text-basil-400' },
    { label: 'Orders', value: (analytics.summary?.totalOrders || 0).toString(), icon: '📋', color: 'text-tomato-400' },
    { label: 'Avg Order', value: `$${(analytics.summary?.avgOrderValue || 0).toFixed(2)}`, icon: '🛒', color: 'text-amber-400' },
    { label: 'New Cust', value: (analytics.summary?.newCustomers || 0).toString(), icon: '👤', color: 'text-blue-400' },
    { label: 'Return', value: (analytics.summary?.returningCustomers || 0).toString(), icon: '🔄', color: 'text-purple-400' },
    { label: 'Growth', value: `${((analytics.summary?.newCustomers || 0) / Math.max(analytics.summary?.totalOrders || 1, 1) * 100).toFixed(1)}%`, icon: '📈', color: 'text-green-400' }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin w-10 h-10 border-[3px] border-tomato-500 border-t-transparent rounded-full" />
        <p className="text-xs font-bold text-wood-400 uppercase tracking-widest animate-pulse">Analyzing Data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 lg:pb-10">
      {/* ── Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">Insight Engine</h2>
          <p className="text-wood-400 text-sm mt-1">Real-time performance and consumer habits</p>
        </div>
        <div className="relative inline-block w-full sm:w-auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full sm:w-auto px-5 py-3 bg-wood-800 border-2 border-wood-700 rounded-xl text-white text-[10px] font-black uppercase tracking-widest outline-none appearance-none pr-12 focus:border-tomato-500 transition-colors"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-wood-400">▼</span>
        </div>
      </div>

      {/* ── High Level Stats Grid ─────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-wood-800 rounded-2xl p-4 border border-wood-700 relative overflow-hidden group"
          >
            <div className="relative z-10">
              <span className="text-lg opacity-80 group-hover:scale-110 transition-transform block mb-1">{stat.icon}</span>
              <p className="text-wood-500 text-[9px] font-black uppercase tracking-wider leading-none mb-1">{stat.label}</p>
              <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Sales Distribution Cards ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend - Main Story */}
        <div className="lg:col-span-2 bg-wood-800 rounded-3xl p-6 sm:p-8 border border-wood-700">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 opacity-60">Revenue Trendline</h3>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailySales || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="date" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution - Side Card */}
        <div className="bg-wood-800 rounded-3xl p-6 sm:p-8 border border-wood-700">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 opacity-60">Order Health</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusDistribution || []}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {(analytics.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {analytics.statusDistribution?.slice(0, 4).map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[9px] font-black uppercase text-wood-400">{entry._id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Popularity and Peaks ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="bg-wood-800 rounded-3xl p-6 sm:p-8 border border-wood-700">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 opacity-60">Top Performers</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.popularItems?.slice(0, 5) || []} layout="vertical">
                <XAxis type="number" stroke="#555" fontSize={10} hide />
                <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={80} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#ffffff08' }} contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-wood-800 rounded-3xl p-6 sm:p-8 border border-wood-700">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 opacity-60">Rush Hour Matrix</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourlyDistribution || []}>
                <XAxis dataKey="_id" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#16a34a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Insights & Tips ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Smart Tip', icon: '💡', text: 'Weekend volume is 45% higher. Pre-prep dough Friday afternoon.', color: 'from-tomato-600/20 to-tomato-800/20 border-tomato-500/30' },
          { title: 'Power Plate', icon: '🌟', text: 'Margherita is your anchor. Keep the ingredients premium.', color: 'from-basil-600/20 to-basil-800/20 border-basil-500/30' },
          { title: 'Efficiency', icon: '⚠️', text: '7PM is your max peak. Consider the extra driver for that hour.', color: 'from-amber-600/20 to-amber-800/20 border-amber-500/30' }
        ].map((item, i) => (
          <div key={i} className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 border`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{item.icon}</span>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">{item.title}</h4>
            </div>
            <p className="text-wood-100 text-xs font-medium leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
