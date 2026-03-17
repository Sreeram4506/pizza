import fetch from 'node-fetch'
import { config } from '../config.js'

/**
 * CORE SENDER ENGINE
 * Uses HTTPS API instead of SMTP to bypass cloud firewall blocks (Render/Vercel)
 */
const brevoRequest = async (to, subject, htmlContent, senderName = "Pizza Blast") => {
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
      sender: { name: senderName, email: "hello@indraam.com" },
      to: [{ email: to }],
      subject,
      htmlContent
    })
  })

  let result
  try {
    result = await response.json()
  } catch (parseErr) {
    const text = await response.text()
    throw new Error(`Brevo API returned non-JSON: ${text.substring(0, 100)}`)
  }

  if (!response.ok) throw new Error(result.message || result.code || 'Brevo API Failure')
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
  }),

  marketing: (message, customerName, templateType) => {
    const personalizedMessage = message
      .replace(/\{\{\s*customer_name\s*\}\}/g, customerName || 'Pizza Lover')
      .replace(/\n/g, '<br>')

    let contentHtml = ''

    if (templateType === 'promotion' || templateType === 'flash') {
      contentHtml = `
        <div style="background: #dc2626; padding: 40px; text-align: center; border-radius: 15px 15px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 32px; text-transform: uppercase;">FLASH DEAL! ⚡️</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1c1917;">Hey ${customerName || 'Pizza Lover'}, don't miss out!</h2>
          <div style="font-size: 18px; line-height: 1.6; color: #444; margin: 20px 0;">
            ${personalizedMessage}
          </div>
          <a href="${config.frontendUrl}/menu" style="display: block; background: #dc2626; color: white; text-decoration: none; padding: 15px; text-align: center; border-radius: 10px; font-weight: bold; font-size: 18px;">CLAIM MY PIZZA NOW</a>
        </div>`
    } else {
      contentHtml = `
        <div style="background: #dc2626; padding: 20px; text-align: center; border-radius: 15px 15px 0 0;">
          <h1 style="color: white; margin:0">Pizza Blast! 🍕</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <h2 style="margin: 0 0 20px;">Hi ${customerName || 'Pizza Lover'},</h2>
          <div style="line-height: 1.8; color: #444;">
            ${personalizedMessage}
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${config.frontendUrl}/menu" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Order Your Favorite Pizza</a>
          </div>
        </div>`
    }

    return {
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          ${contentHtml}
          <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p>© 2024 Pizza Blast. 123 Pizza Plaza, New York, NY 10001</p>
            <p>You received this because you're a valued customer. <a href="#" style="color: #999;">Unsubscribe</a></p>
          </div>
        </div>`
    }
  },

  reservationConfirmation: (reservation) => {
    return {
      subject: `✅ Table Reservation Confirmed - Pizza Blast`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 15px; overflow: hidden;">
          <div style="background: #1A1410; color: white; padding: 20px; text-align: center;">
            <h1 style="margin:0">Reservation Confirmed!</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hi ${reservation.name},</h2>
            <p>We're excited to host you! Your table reservation has been confirmed.</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Date:</strong> ${new Date(reservation.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${reservation.time}</p>
              <p><strong>Guests:</strong> ${reservation.guestsCount}</p>
              <p><strong>Reservation ID:</strong> #${reservation._id.toString().slice(-6).toUpperCase()}</p>
            </div>
            <p>If you need to change or cancel your reservation, please call us directly.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              See you soon at Pizza Blast!<br>
              123 Pizza Plaza, New York, NY 10001
            </p>
          </div>
        </div>`
    }
  }
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
  try {
    const { html } = templates.marketing(message, customerName, template)
    // Marketing emails come from "Pizza Blast Offers"
    const result = await brevoRequest(to, subject, html, "Pizza Blast Offers")
    console.log(`📢 [EMAIL] Marketing sent to ${to}`)
    return result
  } catch (err) {
    console.error(`❌ [EMAIL] Marketing Error: ${err.message}`)
  }
}

export const sendReservationConfirmation = async (reservation) => {
  try {
    const { subject, html } = templates.reservationConfirmation(reservation)
    const result = await brevoRequest(reservation.email, subject, html)
    console.log(`✅ [EMAIL] Reservation confirmation sent to ${reservation.email}`)
    return result
  } catch (err) {
    console.error(`❌ [EMAIL] Reservation Email Error: ${err.message}`)
  }
}
