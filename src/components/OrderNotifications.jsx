import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { requestNotificationPermission, showPushNotification, playNotificationSound } from '../utils/notifications'

export default function OrderNotifications() {
  const [notifications, setNotifications] = useState([])
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Connect to WebSocket
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
    const socket = io(apiUrl, {
      transports: ['websocket', 'polling']
    })

    const activeOrders = JSON.parse(localStorage.getItem('activeOrders') || '[]')
    activeOrders.forEach(orderId => socket.emit('join-order', orderId))

    // Handle order status updates
    socket.on('order:status_update', (data) => {
      const newNotification = {
        id: Date.now(),
        type: 'status_update',
        title: 'Order Status Update!',
        message: data.message,
        time: new Date(),
        read: false,
        status: data.status
      }

      setNotifications(prev => [newNotification, ...prev].slice(0, 10))
      setIsVisible(true)

      // Browser Alert
      showPushNotification(newNotification.title, { body: newNotification.message })
      playNotificationSound(data.status === 'ready' || data.status === 'delivered' ? 'success' : 'default')
    })

    // On mount, ask for permission
    requestNotificationPermission()

    return () => socket.disconnect()
  }, [])

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm">
      <AnimatePresence>
        {isVisible && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className="bg-white rounded-xl shadow-2xl border border-tomato-200 overflow-hidden"
          >
            {/* Notification Header */}
            <div className="bg-tomato-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <span className="font-semibold">Order Notifications</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-white text-tomato-600 text-xs px-2 py-1 rounded-full font-bold">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-tomato-50' : ''
                    }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-tomato-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">🍕</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-wood-800 text-sm">
                        {notification.title}
                      </p>
                      <p className="text-wood-600 text-xs mt-1">
                        {notification.message}
                      </p>
                      <p className="text-wood-400 text-xs mt-2">
                        {notification.time.toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-tomato-600 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
              <button
                onClick={clearAll}
                className="text-wood-500 hover:text-wood-700 text-sm font-medium"
              >
                Clear All
              </button>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-tomato-600 hover:text-tomato-700 text-sm font-medium"
              >
                View Orders →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Bell Badge */}
      <div className="fixed top-4 right-4">
        <motion.button
          onClick={() => setIsVisible(!isVisible)}
          className="relative p-3 bg-tomato-600 text-white rounded-full shadow-lg hover:bg-tomato-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-white text-tomato-600 text-xs rounded-full flex items-center justify-center font-bold">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </motion.button>
      </div>
    </div>
  )
}
