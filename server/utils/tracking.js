import { Order } from '../models/Order.js';

/**
 * Tracking Service for fine-tuning order progress status and security.
 */
export const TrackingService = {
  
  /**
   * Get public, sanitized order information for tracking.
   * Scalable for future updates like live GPS or driver info.
   */
  getPublicTrackingInfo: async (query, tenantId) => {
    try {
      const order = await Order.findOne({ 
        ...query, 
        ...(tenantId && { tenantId }),
        status: { $nin: ['delivered', 'completed', 'cancelled'] }
      }).sort({ createdAt: -1 });

      if (!order) return null;

      // Sanitized results - only return what the customer needs
      return {
        orderNumber: order.orderNumber,
        trackingToken: order.trackingToken,
        status: order.status,
        type: order.type,
        createdAt: order.createdAt,
        estimatedReadyAt: order.estimatedReadyAt,
        estimatedDeliveryAt: order.estimatedDeliveryAt,
        actualDeliveredAt: order.actualDeliveredAt,
        // Include ONLY the street for privacy
        addressStreet: order.type === 'delivery' ? order.address.street : null,
        driverLocation: order.driverLocation,
        message: `Order ${order.orderNumber} is currently ${order.status}`
      };
    } catch (err) {
      console.error('[TRACKING SERVICE] Error:', err);
      return null;
    }
  }
};
