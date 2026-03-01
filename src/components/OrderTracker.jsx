import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function OrderTracker() {
  const [orderNumber, setOrderNumber] = useState('')
  const [orderStatus, setOrderStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const trackOrder = async (e) => {
    e.preventDefault()
    if (!orderNumber.trim()) {
      setError('Please enter an order number')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // Call the real API to track order
      const response = await fetch(`/api/orders/track/${orderNumber}`)
      
      if (!response.ok) {
        throw new Error('Order not found')
      }
      
      const order = await response.json()
      
      setOrderStatus({
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedTime: order.status === 'confirmed' ? '15-20 mins' : 
                         order.status === 'preparing' ? '10-15 mins' :
                         order.status === 'ready' ? 'Ready for pickup' : 'Completed',
        items: order.items,
        total: order.total,
        customerName: order.customerInfo?.name || 'Guest',
        orderTime: order.createdAt
      })
    } catch (err) {
      setError('Order not found. Please check your order number.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'preparing': return '👨‍🍳'
      case 'ready': return '✅'
      case 'completed': return '🎉'
      default: return '📋'
    }
  }

  return (
    <div className="min-h-screen bg-mozzarella-100 py-12">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-display font-black text-wood-800 mb-4">
            Track Your Order
          </h1>
          <p className="text-wood-600 text-lg">
            Enter your order number to see real-time status updates
          </p>
        </motion.div>

        {/* Order Tracking Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-mozzarella-200 rounded-2xl p-8 shadow-lg border border-basil-200 mb-8"
        >
          <form onSubmit={trackOrder} className="flex gap-4">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Enter order number (e.g., ORD001)"
              className="flex-1 px-4 py-3 rounded-lg bg-mozzarella-100 border border-basil-200 text-wood-800 placeholder-wood-400 focus:outline-none focus:border-tomato-400 focus:ring-2 focus:ring-tomato-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-tomato-600 text-white font-semibold rounded-lg hover:bg-tomato-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </form>
          
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-tomato-100 text-tomato-700 rounded-lg"
            >
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Order Status Display */}
        {orderStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-basil-200"
          >
            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 ${getStatusColor(orderStatus.status)}`}>
                <span className="text-2xl">{getStatusIcon(orderStatus.status)}</span>
                <span className="font-bold text-lg capitalize">{orderStatus.status}</span>
              </div>
              <h2 className="text-2xl font-bold text-wood-800 mt-4">
                Order #{orderStatus.orderNumber}
              </h2>
              <p className="text-wood-600 mt-2">
                Estimated time: {orderStatus.estimatedTime}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-wood-600">Order Progress</span>
                <span className="text-sm text-wood-600">
                  {orderStatus.status === 'pending' && '25%'}
                  {orderStatus.status === 'preparing' && '50%'}
                  {orderStatus.status === 'ready' && '75%'}
                  {orderStatus.status === 'completed' && '100%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: orderStatus.status === 'pending' ? '25%' :
                            orderStatus.status === 'preparing' ? '50%' :
                            orderStatus.status === 'ready' ? '75%' : '100%'
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-tomato-600 h-3 rounded-full"
                />
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-wood-700 mb-2">Customer Information</h3>
                <div className="bg-mozzarella-100 p-4 rounded-lg">
                  <p><strong>Name:</strong> {orderStatus.customerName}</p>
                  <p><strong>Order Time:</strong> {orderStatus.orderTime.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-wood-700 mb-2">Order Items</h3>
                <div className="space-y-2">
                  {orderStatus.items.map((item, index) => (
                    <div key={index} className="flex justify-between bg-mozzarella-100 p-3 rounded">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-semibold">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-wood-800">Total Amount:</p>
                  <p className="text-lg font-bold text-tomato-600">${orderStatus.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => window.location.href = '/contact'}
                className="flex-1 py-3 bg-wood-200 text-wood-800 font-semibold rounded-lg hover:bg-wood-300 transition-colors"
              >
                Contact Restaurant
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 py-3 bg-tomato-600 text-white font-semibold rounded-lg hover:bg-tomato-700 transition-colors"
              >
                Order Again
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
