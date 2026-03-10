import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function OrderTracker() {
  const [orderNumber, setOrderNumber] = useState('')
  const [orderStatus, setOrderStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

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
        estimatedTime: ['confirmed', 'preparing', 'ready'].includes(order.status) ? '15-25 mins' :
          order.status === 'out_for_delivery' ? 'On the way!' : 'Completed',
        items: order.items,
        total: order.total,
        type: order.type,
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
      case 'confirmed': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing':
      case 'ready': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered':
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '📝'
      case 'preparing':
      case 'ready': return '👨‍🍳'
      case 'out_for_delivery': return '🛵'
      case 'delivered':
      case 'completed': return '✅'
      default: return '📋'
    }
  }

  const getStepPercentage = (status) => {
    switch (status) {
      case 'confirmed': return '25%'
      case 'preparing':
      case 'ready': return '50%'
      case 'out_for_delivery': return '75%'
      case 'delivered':
      case 'completed': return '100%'
      default: return '0%'
    }
  }

  const getStepName = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmed'
      case 'preparing':
      case 'ready': return 'Getting Ready'
      case 'out_for_delivery': return 'Out for Delivery'
      case 'delivered':
      case 'completed': return 'Delivered'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-mozzarella-100 pt-32 pb-12">
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
                <span className="font-bold text-lg capitalize">{getStepName(orderStatus.status)}</span>
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
              <div className="flex justify-between items-center mb-4 relative z-10 px-2 sm:px-6">
                {/* Step 1 */}
                <div className={`flex flex-col items-center gap-2 ${['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed'].includes(orderStatus.status) ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="w-8 h-8 rounded-full bg-white border-4 border-tomato-500 flex items-center justify-center text-xs font-black text-tomato-500">1</div>
                  <span className="text-[10px] font-black uppercase text-wood-600 text-center w-20 leading-tight block hidden sm:block">Confirmed</span>
                </div>
                {/* Step 2 */}
                <div className={`flex flex-col items-center gap-2 ${['preparing', 'ready', 'out_for_delivery', 'delivered', 'completed'].includes(orderStatus.status) ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="w-8 h-8 rounded-full bg-white border-4 border-tomato-500 flex items-center justify-center text-xs font-black text-tomato-500">2</div>
                  <span className="text-[10px] font-black uppercase text-wood-600 text-center w-20 leading-tight block hidden sm:block">Getting Ready</span>
                </div>
                {/* Step 3 */}
                {orderStatus.type === 'delivery' && (
                  <div className={`flex flex-col items-center gap-2 ${['out_for_delivery', 'delivered', 'completed'].includes(orderStatus.status) ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="w-8 h-8 rounded-full bg-white border-4 border-tomato-500 flex items-center justify-center text-xs font-black text-tomato-500">3</div>
                    <span className="text-[10px] font-black uppercase text-wood-600 text-center w-20 leading-tight block hidden sm:block">Out for Delivery</span>
                  </div>
                )}
                {/* Step 4 */}
                <div className={`flex flex-col items-center gap-2 ${['delivered', 'completed'].includes(orderStatus.status) ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="w-8 h-8 rounded-full bg-white border-4 border-tomato-500 flex items-center justify-center text-xs font-black text-tomato-500">{orderStatus.type === 'delivery' ? '4' : '3'}</div>
                  <span className="text-[10px] font-black uppercase text-wood-600 text-center w-20 leading-tight block hidden sm:block">{orderStatus.type === 'delivery' ? 'Delivered' : 'Ready'}</span>
                </div>
              </div>

              <div className="w-full bg-wood-200 rounded-full h-3 relative overflow-hidden -mt-[44px] sm:-mt-[44px] mx-8 sm:mx-14 w-[calc(100%-4rem)] sm:w-[calc(100%-7rem)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: getStepPercentage(orderStatus.status) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-tomato-500 h-3 rounded-full relative z-0"
                />
              </div>
              <div className="h-[44px]"></div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-wood-700 mb-2">Customer Information</h3>
                <div className="bg-mozzarella-100 p-4 rounded-lg">
                  <p><strong>Name:</strong> {orderStatus.customerName}</p>
                  <p><strong>Order Time:</strong> {new Date(orderStatus.orderTime).toLocaleString()}</p>
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
                onClick={() => navigate('/#contact')}
                className="flex-1 py-3 bg-wood-200 text-wood-800 font-semibold rounded-lg hover:bg-wood-300 transition-colors"
              >
                Contact Restaurant
              </button>
              <button
                onClick={() => navigate('/')}
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
