import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'

// Sound notification utility
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Pleasant chime: C5 -> E5 -> G5
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (err) {
    console.error('Failed to play notification sound:', err)
  }
}

export default function OrderManager() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [socket, setSocket] = useState(null)
  const [newOrderAlert, setNewOrderAlert] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioContextRef = useRef(null)

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
    }
    window.addEventListener('click', initAudio, { once: true })
    return () => window.removeEventListener('click', initAudio)
  }, [])

  // Setup Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    })
    
    newSocket.on('connect', () => {
      console.log('Connected to live order system')
      newSocket.emit('join-admin')
    })
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
    
    // Listen for new orders
    newSocket.on('order:new', (order) => {
      console.log('New order received:', order)
      setOrders(prev => [order, ...prev])
      setNewOrderAlert(order)
      if (soundEnabled) playNotificationSound()
      setTimeout(() => setNewOrderAlert(null), 5000)
    })
    
    // Listen for order updates
    newSocket.on('order:update', (updatedOrder) => {
      console.log('Order updated:', updatedOrder)
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o))
      if (selectedOrder?._id === updatedOrder._id) setSelectedOrder(updatedOrder)
    })
    
    // Listen for order deletion
    newSocket.on('order:deleted', (deletedOrderId) => {
      setOrders(prev => prev.filter(o => o._id !== deletedOrderId))
    })
    
    setSocket(newSocket)
    fetchOrders()
    
    return () => newSocket.disconnect()
  }, [soundEnabled])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/orders', {
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
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (res.ok) {
        fetchOrders() // Refresh orders
      }
    } catch (err) {
      console.error('Failed to update order status:', err)
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'preparing': return '👨‍🍳'
      case 'ready': return '✅'
      case 'completed': return '🎉'
      case 'cancelled': return '❌'
      default: return '📋'
    }
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tomato-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* New Order Alert Banner */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-20 right-4 z-50 bg-tomato-600 text-white rounded-xl shadow-2xl p-4 max-w-sm border-4 border-tomato-400"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">🍕</span>
              <div className="flex-1">
                <h4 className="font-bold text-lg">New Order Received!</h4>
                <p className="text-tomato-100 text-sm">
                  Order #{newOrderAlert.orderNumber} - ${newOrderAlert.total?.toFixed(2)}
                </p>
                <p className="text-tomato-100 text-xs mt-1">
                  {newOrderAlert.items?.length || 0} items
                </p>
              </div>
              <button 
                onClick={() => setNewOrderAlert(null)}
                className="text-tomato-200 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setSelectedOrder(newOrderAlert)
                  setNewOrderAlert(null)
                }}
                className="flex-1 py-2 bg-white text-tomato-600 rounded-lg font-semibold text-sm hover:bg-tomato-50"
              >
                View Order
              </button>
              <button
                onClick={() => {
                  updateOrderStatus(newOrderAlert._id, 'preparing')
                  setNewOrderAlert(null)
                }}
                className="flex-1 py-2 bg-tomato-700 text-white rounded-lg font-semibold text-sm hover:bg-tomato-800"
              >
                Start Preparing
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-wood-800">Live Order Management</h1>
          <p className="text-wood-600 mt-1">
            Real-time order tracking • {orders.length} total orders
            {pendingCount > 0 && (
              <span className="ml-2 text-tomato-600 font-semibold">
                ({pendingCount} pending)
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled 
                ? 'bg-tomato-100 text-tomato-600 hover:bg-tomato-200' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title={soundEnabled ? 'Sound notifications on' : 'Sound notifications off'}
          >
            {soundEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
          
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            socket?.connected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              socket?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {socket?.connected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-tomato-600 text-white rounded-lg hover:bg-tomato-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-tomato-600 text-white shadow-lg'
                : 'bg-mozzarella-200 text-wood-700 hover:bg-mozzarella-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-2 text-sm">
                ({orders.filter(o => o.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
            className={`bg-mozzarella-200 rounded-xl p-6 shadow-lg border-2 transition-all ${
              order.status === 'pending' 
                ? 'border-tomato-300 ring-2 ring-tomato-200' 
                : 'border-basil-200'
            }`}
          >
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-wood-800">
                    Order #{order.orderNumber}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  {order.status === 'pending' && (
                    <span className="px-2 py-1 bg-tomato-100 text-tomato-700 text-xs font-bold rounded animate-pulse">
                      NEW
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-wood-600">
                  <div>
                    <p><strong>Customer:</strong> {order.customerId?.name || 'Guest'}</p>
                    <p><strong>Phone:</strong> {order.customerId?.phone || 'N/A'}</p>
                    <p><strong>Type:</strong> {order.type || 'delivery'}</p>
                  </div>
                  <div>
                    <p><strong>Order Time:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                    <p><strong>Total:</strong> <span className="text-tomato-600 font-bold">${order.total?.toFixed(2) || '0.00'}</span></p>
                    <p><strong>Items:</strong> {order.items?.length || 0}</p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-white rounded-full text-sm text-wood-700 border border-crust-200"
                      >
                        {item.name} x{item.quantity}
                      </span>
                    ))}
                    {order.items?.length > 3 && (
                      <span className="px-3 py-1 bg-crust-100 rounded-full text-sm text-wood-600">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> {order.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 lg:min-w-[140px]">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order._id, 'preparing')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
                    >
                      👨‍🍳 Start Preparing
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order._id, 'cancelled')}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-semibold transition-colors"
                    >
                      ❌ Cancel
                    </button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'ready')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold transition-colors"
                  >
                    ✅ Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'completed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-semibold transition-colors"
                  >
                    🎉 Complete
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="px-4 py-2 bg-wood-600 text-white rounded-lg hover:bg-wood-700 text-sm font-semibold transition-colors"
                >
                  🔍 View Details
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-wood-800">Order #{selectedOrder.orderNumber}</h3>
                  <p className="text-sm text-wood-500">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-wood-500 hover:text-wood-700 p-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-wood-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)} {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="bg-mozzarella-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-wood-700 mb-2">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Name:</strong> {selectedOrder.customerId?.name || 'Guest'}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customerId?.phone || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedOrder.customerId?.email || 'N/A'}</p>
                    <p><strong>Type:</strong> {selectedOrder.type || 'delivery'}</p>
                  </div>
                  {selectedOrder.deliveryAddress && (
                    <p className="text-sm mt-2"><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-wood-700 mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between bg-mozzarella-100 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-wood-800">{item.name}</p>
                          <p className="text-sm text-wood-600">Qty: {item.quantity}</p>
                          {item.modifiers?.length > 0 && <p className="text-sm text-wood-500 mt-1">Modifiers: {item.modifiers.map(m => m.name).join(', ')}</p>}
                        </div>
                        <p className="font-semibold text-wood-800">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-wood-600">Subtotal</p>
                      <p className="text-sm text-wood-600">Tax</p>
                      <p className="text-lg font-semibold text-wood-800 mt-1">Total</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-wood-600">${(selectedOrder.subtotal || selectedOrder.total * 0.9)?.toFixed(2)}</p>
                      <p className="text-sm text-wood-600">${(selectedOrder.tax || selectedOrder.total * 0.1)?.toFixed(2)}</p>
                      <p className="text-lg font-bold text-tomato-600">${selectedOrder.total?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-1">Order Notes</h4>
                    <p className="text-yellow-700">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Status Update Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button onClick={() => { updateOrderStatus(selectedOrder._id, 'preparing'); setSelectedOrder(null); }} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">👨‍🍳 Start Preparing</button>
                      <button onClick={() => { updateOrderStatus(selectedOrder._id, 'cancelled'); setSelectedOrder(null); }} className="flex-1 py-3 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-colors">❌ Cancel Order</button>
                    </>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <button onClick={() => { updateOrderStatus(selectedOrder._id, 'ready'); setSelectedOrder(null); }} className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">✅ Mark as Ready</button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <button onClick={() => { updateOrderStatus(selectedOrder._id, 'completed'); setSelectedOrder(null); }} className="w-full py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors">🎉 Complete Order</button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
