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

    const accessToken = process.env.UBER_EATS_ACCESS_TOKEN 
    if (!accessToken) {
       console.warn(`[UBER EATS] Warning: UBER_EATS_ACCESS_TOKEN not set. Skipping update for order ${order.externalOrderId}.`)
       return;
    }

    console.log(`[UBER EATS] Updating order ${order.externalOrderId} to ${uberStatus}`)
    
    try {
        const response = await fetch(`https://api.uber.com/v1/eats/order/${order.externalOrderId}/status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: uberStatus })
        })

        if (!response.ok) {
            const errBody = await response.text()
            throw new Error(`Uber Eats API returned ${response.status}: ${errBody}`)
        }
        console.log(`[UBER EATS] Successfully updated status for order ${order.externalOrderId}`)
    } catch (err) {
        console.error(`[UBER EATS API ERROR]`, err.message)
    }
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

    const accessToken = process.env.GRUBHUB_ACCESS_TOKEN
    
    if (!accessToken) {
       console.warn(`[GRUBHUB] Warning: GRUBHUB_ACCESS_TOKEN not set. Skipping update for order ${order.externalOrderId}.`)
       return;
    }

    console.log(`[GRUBHUB] Updating order ${order.externalOrderId} to ${grubhubStatus}`)
    
    try {
        const response = await fetch(`https://api-partner.grubhub.com/v1/orders/${order.externalOrderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: grubhubStatus })
        })

        if (!response.ok) {
            const errBody = await response.text()
            throw new Error(`Grubhub API returned ${response.status}: ${errBody}`)
        }
        console.log(`[GRUBHUB] Successfully updated status for order ${order.externalOrderId}`)
    } catch (err) {
        console.error(`[GRUBHUB API ERROR]`, err.message)
    }
  }
}
