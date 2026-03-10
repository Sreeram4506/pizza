import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'

const THEME_COLORS = ['#B45309', '#1A1410', '#92400E', '#451A03', '#78350F', '#F59E0B']

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
    { label: 'Revenue', value: `$${(analytics.summary?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: 'text-[#1A1410]' },
    { label: 'Orders', value: (analytics.summary?.totalOrders || 0).toString(), icon: '📋', color: 'text-ember-600' },
    { label: 'Avg Ticket', value: `$${(analytics.summary?.avgOrderValue || 0).toFixed(2)}`, icon: '🍕', color: 'text-[#1A1410]' },
    { label: 'New Patrons', value: (analytics.summary?.newCustomers || 0).toString(), icon: '👤', color: 'text-ember-600' },
    { label: 'Retention', value: (analytics.summary?.returningCustomers || 0).toString(), icon: '🔄', color: 'text-[#1A1410]' },
    { label: 'Yield', value: `${((analytics.summary?.newCustomers || 0) / Math.max(analytics.summary?.totalOrders || 1, 1) * 100).toFixed(1)}%`, icon: '📈', color: 'text-ember-600' }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-amber-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#9B8D74] animate-pulse">Aggregating Global Intelligence</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* ── Orchestration Header ─────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-[1px] bg-ember-600" />
            <span className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-ember-600">Business Intelligence</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-sans font-bold text-[#1A1410] leading-none">Insight Engine</h2>
          <p className="text-[#9B8D74] mt-2 font-medium tracking-tight">An editorial overview of performance metrics and patron behaviors.</p>
        </div>
        <div className="relative group min-w-[200px]">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full h-14 pl-6 pr-12 bg-white border border-[rgba(26,20,16,0.06)] rounded-2xl text-[#1A1410] font-sans text-[10px] font-bold uppercase tracking-widest outline-none appearance-none cursor-pointer focus:border-amber-500 transition-all shadow-sm"
          >
            <option value="24h">L: 24 Hours</option>
            <option value="7d">L: 7 Days</option>
            <option value="30d">L: 30 Days</option>
            <option value="90d">L: 90 Days</option>
          </select>
          <span className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#9B8D74] text-[10px]">▼</span>
        </div>
      </div>

      {/* ── Metric Grid ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, type: 'spring', damping: 20 }}
            className="bg-white rounded-[2rem] p-6 border border-[rgba(26,20,16,0.06)] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl group-hover:scale-125 transition-transform duration-500">{stat.icon}</span>
              <span className="w-1.5 h-1.5 bg-ember-100 rounded-full group-hover:bg-ember-600 transition-colors" />
            </div>
            <p className="font-sans text-[8px] font-bold uppercase tracking-[0.2em] text-[#9B8D74] mb-1">{stat.label}</p>
            <p className={`text-2xl font-sans font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Data Landscapes ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-[rgba(26,20,16,0.06)] shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#1A1410]">Fiscal Trajectory</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-ember-600" />
              <span className="font-sans text-[8px] font-bold text-[#9B8D74]">NET REVENUE</span>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailySales || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B45309" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#B45309" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" stroke="rgba(26,20,16,0.03)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#9B8D74"
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#9B8D74"
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1410',
                    border: 'none',
                    borderRadius: '1.5rem',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                  }}
                  itemStyle={{ fontSize: '10px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 'bold', textTransform: 'uppercase' }}
                  labelStyle={{ fontSize: '9px', color: '#9B8D74', fontFamily: 'Inter, sans-serif', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#B45309"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Composition Pie */}
        <div className="bg-white rounded-[3rem] p-10 border border-[rgba(26,20,16,0.06)] shadow-sm flex flex-col">
          <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#1A1410] mb-10 text-center">Patronage Pulse</h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusDistribution || []}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={95}
                  paddingAngle={8}
                  dataKey="count"
                >
                  {(analytics.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1410',
                    border: 'none',
                    borderRadius: '1.5rem'
                  }}
                  itemStyle={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '9px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-center flex-col items-center justify-center pointer-events-none">
              <span className="font-sans font-bold text-3xl text-[#1A1410] leading-none">100%</span>
              <span className="font-sans text-[7px] font-bold text-[#9B8D74] uppercase tracking-widest mt-1">Consistency</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-10">
            {analytics.statusDistribution?.slice(0, 4).map((entry, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: THEME_COLORS[i % THEME_COLORS.length] }} />
                <span className="font-sans text-[8px] font-bold uppercase text-[#9B8D74] tracking-tight truncate">{entry._id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Operational Dynamics ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Assets Bar */}
        <div className="bg-white rounded-[3rem] p-10 border border-[rgba(26,20,16,0.06)] shadow-sm">
          <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#1A1410] mb-10">Product Dominance</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.popularItems?.slice(0, 5) || []} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#1A1410"
                  fontSize={10}
                  fontFamily="Cormorant Garamond"
                  fontWeight="bold"
                  width={100}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: 'rgba(26,20,16,0.02)' }} contentStyle={{ backgroundColor: '#1A1410', borderRadius: '1rem', border: 'none' }} itemStyle={{ color: '#fff', fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="count" fill="#B45309" radius={[0, 10, 10, 0]} barSize={24}>
                  {(analytics.popularItems || []).slice(0, 5).map((entry, index) => (
                    <Cell key={index} fill={index === 0 ? '#B45309' : '#1A1410'} opacity={1 - (index * 0.15)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temporal Rush Hour Bar */}
        <div className="bg-white rounded-[3rem] p-10 border border-[rgba(26,20,16,0.06)] shadow-sm">
          <h3 className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1410] mb-10">Temporal Rush Matrix</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourlyDistribution || []}>
                <XAxis
                  dataKey="_id"
                  stroke="#9B8D74"
                  fontSize={9}
                  fontFamily="JetBrains Mono"
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'rgba(26,20,16,0.02)' }} contentStyle={{ backgroundColor: '#1A1410', borderRadius: '1rem', border: 'none' }} itemStyle={{ color: '#fff', fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="count" fill="#1A1410" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Intelligence Feed ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(analytics.insights || [
          { title: 'Operational Delta', icon: '🏛️', text: 'Daily throughput peaks at 18:00. Recommend increasing prep staff capacity 30 mins prior to peak.', color: 'bg-amber-50 border-amber-100 text-amber-900' },
          { title: 'Product Synthesis', icon: '🌟', text: 'Top performing assets are yielding 40% of net margin. Priority focus for upcoming visual assets.', color: 'bg-[#1A1410] border-transparent text-white' },
          { title: 'Patron Fidelity', icon: '🍷', text: 'Returning density is increasing. Loyalty rewards should shift to tiered experiential giftings.', color: 'bg-[#FAFAF8] border-[rgba(26,20,16,0.06)] text-[#1A1410]' }
        ]).map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className={`${item.color} rounded-[2.5rem] p-10 border shadow-sm transition-all`}
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl">{item.icon}</span>
              <h4 className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] opacity-60">{item.title}</h4>
            </div>
            <p className="font-sans font-medium text-lg leading-relaxed">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
