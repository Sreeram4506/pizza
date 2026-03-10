import { Router } from 'express'
import { Order } from '../models/Order.js'
import { Customer } from '../models/Customer.js'
import { MenuItem } from '../models/MenuItem.js'

const router = Router()

// Get analytics summary
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { range = '7d' } = req.query
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '24h':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }
    
    // Get orders in date range
    const orders = await Order.find({
      tenantId,
      createdAt: { $gte: startDate, $lte: now },
      status: { $nin: ['cancelled'] }
    })
    
    // Calculate metrics
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Get customer stats
    const newCustomers = await Customer.countDocuments({
      tenantId,
      createdAt: { $gte: startDate }
    })
    
    const returningCustomers = await Customer.countDocuments({
      tenantId,
      orderCount: { $gt: 1 }
    })
    
    // Get popular items
    const itemCounts = {}
    orders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
      })
    })
    
    const popularItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // Get status distribution
    const statusCounts = await Order.aggregate([
      { $match: { tenantId, createdAt: { $gte: startDate, $lte: now } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
    
    // Get hourly distribution
    const hourlyDistribution = await Order.aggregate([
      { $match: { tenantId, createdAt: { $gte: startDate, $lte: now } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    
    // Get daily sales data for chart
    const dailySales = await Order.aggregate([
      { $match: { tenantId, createdAt: { $gte: startDate, $lte: now }, status: { $nin: ['cancelled'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // Generate Dynamic Insights
    const insights = []
    
    // Insight 1: Operational Peak
    const peakHourData = [...hourlyDistribution].sort((a, b) => b.count - a.count)[0]
    if (peakHourData) {
      const peakHour = peakHourData._id
      const timeStr = peakHour > 12 ? `${peakHour - 12}:00 PM` : `${peakHour}:00 AM`
      insights.push({
        title: 'Operational Delta',
        icon: '🏛️',
        text: `Daily throughput peaks at ${timeStr}. Recommend increasing prep staff capacity 30 mins prior to peak.`,
        color: 'bg-amber-50 border-amber-100 text-amber-900'
      })
    }

    // Insight 2: Product Synthesis
    if (popularItems.length > 0) {
      const topItem = popularItems[0]
      insights.push({
        title: 'Product Synthesis',
        icon: '🌟',
        text: `The "${topItem.name}" is your primary volume driver (${topItem.count} units). Priority focus for upcoming visual assets.`,
        color: 'bg-[#1A1410] border-transparent text-white'
      })
    }

    // Insight 3: Patron Fidelity
    const retentionRate = (returningCustomers / Math.max(newCustomers + returningCustomers, 1)) * 100
    insights.push({
      title: 'Patron Fidelity',
      icon: '🍷',
      text: `Returning patron density represents ${retentionRate.toFixed(1)}% of flow. Loyalty yields are stabilizing in high-margin segments.`,
      color: 'bg-[#FAFAF8] border-[rgba(26,20,16,0.06)] text-[#1A1410]'
    })

    res.json({
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        newCustomers,
        returningCustomers
      },
      popularItems,
      statusDistribution: statusCounts,
      hourlyDistribution,
      dailySales: dailySales.map(d => ({
        date: d._id,
        revenue: d.revenue,
        orders: d.orders
      })),
      insights
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// Get sales report
router.get('/sales', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const { start, end } = req.query
    
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = end ? new Date(end) : new Date()
    
    const sales = await Order.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    res.json(sales)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales report' })
  }
})

// Get customer insights
router.get('/customers', async (req, res) => {
  try {
    const tenantId = req.tenantId
    
    const totalCustomers = await Customer.countDocuments({ tenantId })
    
    const customersByMonth = await Customer.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    const loyaltyTiers = await Customer.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$loyalty.tier', count: { $sum: 1 } } }
    ])
    
    res.json({
      totalCustomers,
      customersByMonth,
      loyaltyTiers
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer insights' })
  }
})

export default router
