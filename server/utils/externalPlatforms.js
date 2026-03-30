import fetch from 'node-fetch'

export class ExternalPlatformService {
  static async updateStatus(order) {
    if (!order.externalOrderId || !order.externalPlatform) return

    try {
      if (order.externalPlatform === 'ubereats') {
        await this.updateUberEatsStatus(order)
      } else if (order.externalPlatform === 'grubhub') {
        await this.updateGrubhubStatus(order)
      }
    } catch (err) {
      console.error(`Failed to update external platform status (${order.externalPlatform}):`, err.message)
    }
  }

  static async updateUberEatsStatus(order) {
    const statusMap = {
      'preparing': 'ACCEPTED',
      'ready': 'READY_FOR_PICKUP',
      'out_for_delivery': 'PICKED_UP',
      'delivered': 'COMPLETED',
      'cancelled': 'CANCELED'
    }

    const uberStatus = statusMap[order.status]
    if (!uberStatus) return

    // Note: In a real app, you'd handle OAuth token management here
    const accessToken = process.env.UBER_EATS_ACCESS_TOKEN 
    
    console.log(`[UBER EATS] Updating order ${order.externalOrderId} to ${uberStatus}`)
    
    // Placeholder for actual API call
    /*
    await axios.post(`https://api.uber.com/v1/eats/order/${order.externalOrderId}/status`, {
      status: uberStatus
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    */
  }

  static async updateGrubhubStatus(order) {
    const statusMap = {
      'preparing': 'IN_PROGRESS',
      'ready': 'READY',
      'out_for_delivery': 'OUT_FOR_DELIVERY',
      'delivered': 'DELIVERED',
      'cancelled': 'CANCELLED'
    }

    const grubhubStatus = statusMap[order.status]
    if (!grubhubStatus) return

    console.log(`[GRUBHUB] Updating order ${order.externalOrderId} to ${grubhubStatus}`)
    
    // Placeholder for actual API call
  }
}
