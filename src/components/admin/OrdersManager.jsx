import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'

const statusColors = {
  confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Confirmed' },
  preparing: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Preparing' },
  ready: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Ready' },
  out_for_delivery: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Out for Delivery' },
  delivered: { bg: 'bg-basil-500/20', text: 'text-basil-400', label: 'Delivered' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelled' }
}

const statusFlow = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']

export default function OrdersManager() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [socket, setSocket] = useState(null)
  const [newOrderAlert, setNewOrderAlert] = useState(null)

  useEffect(() => {
    fetchOrders()
    
    // Setup WebSocket connection
    const newSocket = io('/admin')
    
    newSocket.on('connect', () => {
      console.log('Connected to admin socket')
    })
    
    newSocket.on('order:new', (order) => {
      setOrders(prev => [order, ...prev])
      setNewOrderAlert(order)
      setTimeout(() => setNewOrderAlert(null), 5000)
    })
    
    newSocket.on('order:update', (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o))
    })
    
    setSocket(newSocket)
    
    return () => newSocket.close()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (res.ok) {
        const updated = await res.json()
        setOrders(prev => prev.map(o => o._id === orderId ? updated : o))
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(updated)
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter)

  const stats = {
    total: orders.length,
    today: orders.filter(o => {
      const orderDate = new Date(o.createdAt)
      const today = new Date()
      return orderDate.toDateString() === today.toDateString()
    }).length,
    pending: orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length,
    revenue: orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0)
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
      {/* New Order Alert */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-6 z-50 bg-tomato-600 text-white px-6 py-4 rounded-xl shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <p className="font-bold">New Order!</p>
                <p className="text-sm">Order #{newOrderAlert.orderNumber} - ${newOrderAlert.total.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-black text-white">Order Management</h2>
          <p className="text-wood-400 mt-1">Track and manage customer orders</p>
        </div>
        <div className="flex gap-3">
          {['all', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                filter === s
                  ? 'bg-tomato-600 text-white'
                  : 'bg-wood-700 text-wood-300 hover:bg-wood-600'
              }`}
            >
              {s === 'all' ? 'All' : statusColors[s]?.label}
              {s !== 'all' && (
                <span className="ml-2 text-xs bg-wood-800 px-2 py-0.5 rounded-full">
                  {orders.filter(o => o.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: '📋' },
          { label: 'Today', value: stats.today, icon: '📅' },
          { label: 'Pending', value: stats.pending, icon: '⏳' },
          { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: '💰' }
        ].map((stat) => (
          <div key={stat.label} className="bg-wood-800 rounded-xl p-4 border border-wood-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-wood-400 text-sm">{stat.label}</p>
                <p className="text-white text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-wood-800 rounded-xl border border-wood-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-wood-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Order #</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Items</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-wood-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wood-700">
            {filteredOrders.map((order) => (
              <motion.tr
                key={order._id}
                layout
                className="hover:bg-wood-700/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-tomato-400">#{order.orderNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{order.customerInfo.name}</p>
                  <p className="text-wood-400 text-sm">{order.customerInfo.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white text-sm">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ').slice(0, 40)}
                    {order.items.length > 1 ? '...' : ''}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-white font-bold">${order.total.toFixed(2)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status].bg} ${statusColors[order.status].text}`}>
                    {statusColors[order.status].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-wood-400 text-sm">
                  {new Date(order.createdAt).toLocaleTimeString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-wood-400 hover:text-white hover:bg-wood-600 rounded-lg"
                    >
                      👁️
                    </button>
                    {statusFlow.indexOf(order.status) < statusFlow.length - 1 && order.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          const nextStatus = statusFlow[statusFlow.indexOf(order.status) + 1]
                          updateOrderStatus(order._id, nextStatus)
                        }}
                        className="px-3 py-1 bg-basil-600 text-white text-sm rounded-lg hover:bg-basil-700"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-wood-400">
            <p className="text-4xl mb-4">📭</p>
            <p>No orders found</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-wood-800 rounded-2xl w-full max-w-2xl border border-wood-700 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-wood-700 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Order #{selectedOrder.orderNumber}</h3>
                  <p className="text-wood-400 text-sm">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[selectedOrder.status].bg} ${statusColors[selectedOrder.status].text}`}>
                  {statusColors[selectedOrder.status].label}
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-wood-700/50 rounded-lg p-4">
                    <p className="text-wood-400 text-sm mb-1">Customer</p>
                    <p className="text-white font-medium">{selectedOrder.customerInfo.name}</p>
                    <p className="text-wood-300">{selectedOrder.customerInfo.phone}</p>
                    <p className="text-wood-300 text-sm">{selectedOrder.customerInfo.email}</p>
                  </div>
                  <div className="bg-wood-700/50 rounded-lg p-4">
                    <p className="text-wood-400 text-sm mb-1">Delivery</p>
                    <p className="text-white capitalize">{selectedOrder.type.replace('_', ' ')}</p>
                    {selectedOrder.type === 'delivery' && (
                      <p className="text-wood-300 text-sm mt-1">{selectedOrder.address.street}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <p className="text-wood-400 text-sm mb-3">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-wood-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-tomato-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="text-white font-medium">{item.name}</p>
                            {item.modifiers.length > 0 && (
                              <p className="text-wood-400 text-sm">
                                + {item.modifiers.map(m => m.name).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-white font-bold">
                          ${((item.price + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-wood-700 pt-4">
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between text-wood-300">
                      <span>Subtotal</span>
                      <span>${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-wood-300">
                      <span>Tax</span>
                      <span>${selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between text-wood-300">
                        <span>Delivery</span>
                        <span>${selectedOrder.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-basil-400">
                        <span>Discount</span>
                        <span>-${selectedOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-wood-700">
                      <span>Total</span>
                      <span>${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex gap-3 pt-4">
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <>
                      {statusFlow.indexOf(selectedOrder.status) < statusFlow.length - 1 && (
                        <button
                          onClick={() => {
                            const nextStatus = statusFlow[statusFlow.indexOf(selectedOrder.status) + 1]
                            updateOrderStatus(selectedOrder._id, nextStatus)
                          }}
                          className="flex-1 py-3 bg-basil-600 text-white rounded-lg font-medium hover:bg-basil-700"
                        >
                          Mark as {statusColors[statusFlow[statusFlow.indexOf(selectedOrder.status) + 1]]?.label}
                        </button>
                      )}
                      <button
                        onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                        className="px-6 py-3 bg-red-600/20 text-red-400 rounded-lg font-medium hover:bg-red-600/30"
                      >
                        Cancel Order
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-6 py-3 bg-wood-700 text-white rounded-lg hover:bg-wood-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
