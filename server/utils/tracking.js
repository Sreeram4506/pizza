import { Order } from '../models/Order.js';

/**
 * Tracking Service — production-grade order tracking with full detail support.
 * Returns sanitized but complete order data for customer-facing tracking pages.
 */
export const TrackingService = {
  
  /**
   * Get public order information for tracking.
   * Returns items, totals, status, and delivery info — everything the tracking page needs.
   */
  getPublicTrackingInfo: async (query, tenantId) => {
    try {
      const order = await Order.findOne({ 
        ...query, 
        ...(tenantId && { tenantId })
      }).sort({ createdAt: -1 });

      if (!order) return null;

      // Full tracking data — safe for customer consumption
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        trackingToken: order.trackingToken,
        status: order.status,
        type: order.type,
        items: order.items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          modifiers: item.modifiers || []
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        deliveryFee: order.deliveryFee,
        total: order.total,
        customerInfo: {
          name: order.customerInfo?.name || 'Guest'
        },
        payment: {
          method: order.payment?.method || 'N/A',
          status: order.payment?.status || 'N/A'
        },
        address: order.type === 'delivery' ? {
          street: order.address?.street || 'N/A',
          city: order.address?.city || '',
          zip: order.address?.zip || '',
          lat: order.address?.lat || null,
          lng: order.address?.lng || null,
          instructions: order.address?.instructions || ''
        } : null,
        createdAt: order.createdAt,
        estimatedReadyAt: order.estimatedReadyAt,
        estimatedDeliveryAt: order.estimatedDeliveryAt,
        estimatedDineInTime: order.estimatedDineInTime,
        actualDeliveredAt: order.actualDeliveredAt,
        driverLocation: order.driverLocation,
        message: `Order ${order.orderNumber} is currently ${order.status}`
      };
    } catch (err) {
      console.error('[TRACKING SERVICE] Error:', err);
      return null;
    }
  }
};
