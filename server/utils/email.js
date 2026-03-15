import fetch from 'node-fetch'
import { config } from '../config.js'

/**
 * CORE SENDER ENGINE
 * Uses HTTPS API instead of SMTP to bypass cloud firewall blocks (Render/Vercel)
 */
const brevoRequest = async (to, subject, htmlContent) => {
  const apiKey = config.brevoApiKey
  if (!apiKey) {
    console.warn('⚠️ [EMAIL] Simulation Mode: No BREVO_API_KEY found.')
    return { simulation: true }
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: "Pizza Blast", email: "hello@indraam.com" },
      to: [{ email: to }],
      subject,
      htmlContent
    })
  })

  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Brevo API Failure')
  return result
}

/**
 * PRODUCTION-READY TEMPLATES
 */
const templates = {
  orderConfirmation: (order) => {
    const isPaid = order.payment.status === 'paid'
    return {
      subject: `🍕 Order ${isPaid ? 'Paid' : 'Confirmed'} - ${order.orderNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 15px; overflow: hidden;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin:0">Pizza Blast!</h1>
            <p>Order #${order.orderNumber}</p>
          </div>
          <div style="padding: 20px;">
            <h2>Hi ${order.customerInfo.name},</h2>
            <p>Your fresh pizza is being prepared!</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 10px;">
              <strong>Items:</strong><br>
              ${order.items.map(i => `- ${i.quantity}x ${i.name}`).join('<br>')}
              <hr style="border:0; border-top: 1px solid #ddd;">
              <strong>Total: $${order.total.toFixed(2)}</strong>
            </div>
            <p style="text-align:center; margin-top: 20px;">
              <a href="${config.frontendUrl}/track/${order.orderNumber}" style="background: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track My Order</a>
            </p>
          </div>
        </div>`
    }
  },

  adminAlert: (order) => ({
    subject: `🔥 NEW ORDER ALERT #${order.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border-left: 5px solid #dc2626;">
        <h2 style="color: #dc2626;">Incoming Order!</h2>
        <p><strong>Customer:</strong> ${order.customerInfo.name} (${order.customerInfo.phone})</p>
        <p><strong>Type:</strong> ${order.type.toUpperCase()}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <a href="${config.frontendUrl}/admin/orders">View in Dashboard</a>
      </div>`
  })
}

/**
 * EXPORTED SYSTEM UTILITIES
 */
export const sendOrderConfirmation = async (order) => {
  try {
    const { subject, html } = templates.orderConfirmation(order)
    const result = await brevoRequest(order.customerInfo.email, subject, html)
    console.log(`✅ [EMAIL] Confirmation sent to ${order.customerInfo.email}`)
    return result
  } catch (err) {
    console.error(`❌ [EMAIL] Customer Error: ${err.message}`)
  }
}

export const sendAdminNotification = async (order) => {
  try {
    const { subject, html } = templates.adminAlert(order)
    const result = await brevoRequest(config.adminEmail, subject, html)
    console.log(`🔔 [EMAIL] Admin notified: ${result.messageId || 'Success'}`)
    return result
  } catch (err) {
    console.error(`❌ [EMAIL] Admin Alert Error: ${err.message}`)
  }
}

// Keep generic sender for marketing
export const sendEmail = async (to, subject, html) => {
  return brevoRequest(to, subject, html)
}

export const sendMarketingEmail = async (to, subject, message, customerName, template = 'custom') => {
  const personalizedMessage = message
    .replace(/\{\{\s*customer_name\s*\}\}/g, customerName || 'Pizza Lover')
    .replace(/\n/g, '<br>')

  let contentHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 15px; overflow: hidden;">
      <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin:0">Pizza Blast!</h1>
      </div>
      <div style="padding: 20px;">
        <h2>Hi ${customerName || 'Pizza Lover'},</h2>
        <div style="line-height: 1.6; color: #444;">
          ${personalizedMessage}
        </div>
        <div style="text-align:center; margin-top: 30px;">
          <a href="${config.frontendUrl}/menu" style="background: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Order Now</a>
        </div>
      </div>
    </div>`

  return brevoRequest(to, subject, contentHtml)
}
