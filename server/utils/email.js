import fetch from 'node-fetch'
import { config } from '../config.js'

/**
 * CORE SENDER ENGINE
 * Uses HTTPS API instead of SMTP to bypass cloud firewall blocks (Render/Vercel)
 */
const brevoRequest = async (to, subject, htmlContent, senderName = config.restaurantName) => {
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
      sender: { name: senderName, email: config.senderEmail },
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
  orderConfirmation: (order, totalPoints = 0, isGuest = false) => {
    const isPaid = order.payment.status === 'paid'
    const itemsHtml = order.items.map(i => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <span style="font-weight: 600; color: #1A1410;">${i.name}</span>
          ${i.modifiers && i.modifiers.length > 0 ? `<br><span style="font-size: 12px; color: #9B8D74;">${i.modifiers.join(', ')}</span>` : ''}
          ${i.notes ? `<br><span style="font-size: 12px; color: #9B8D74; font-style: italic;">Note: ${i.notes}</span>` : ''}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: center; color: #5C554E; font-weight: 500;">×${i.quantity}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600; color: #1A1410;">$${(i.price * i.quantity).toFixed(2)}</td>
      </tr>
    `).join('')

    return {
      subject: `🍕 Order ${isPaid ? 'Paid' : 'Confirmed'} - ${order.orderNumber}`,
      html: `
        <div style="font-family: 'Outfit', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1A1410 0%, #2D211E 100%); color: white; padding: 32px 28px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">${config.restaurantName}</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.7; letter-spacing: 2px; text-transform: uppercase;">Order Confirmation</p>
          </div>

          <!-- Order Number Badge -->
          <div style="text-align: center; padding: 24px 28px 0;">
            <div style="display: inline-block; background: #FEF3EC; border: 1px solid #FDE3D0; border-radius: 50px; padding: 8px 24px;">
              <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #C1440E;">Order #${order.orderNumber}</span>
            </div>
          </div>

          <!-- Greeting -->
          <div style="padding: 20px 28px 0;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #1A1410;">Hi ${order.customerInfo.name},</h2>
            <p style="margin: 6px 0 0; color: #5C554E; font-size: 15px;">Your order has been ${isPaid ? 'paid and' : ''} confirmed! Here's what's coming your way:</p>
          </div>

          <!-- Items Table -->
          <div style="padding: 20px 28px;">
            <div style="background: #FAFAF8; border-radius: 14px; padding: 20px; border: 1px solid #F0EDE7;">
              <p style="margin: 0 0 14px; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #9B8D74;">Your Items</p>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 0 0 8px; font-size: 11px; font-weight: 700; color: #9B8D74; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #E8E3DB;">Item</th>
                    <th style="text-align: center; padding: 0 0 8px; font-size: 11px; font-weight: 700; color: #9B8D74; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #E8E3DB;">Qty</th>
                    <th style="text-align: right; padding: 0 0 8px; font-size: 11px; font-weight: 700; color: #9B8D74; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #E8E3DB;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #E8E3DB;">
                ${order.subtotal ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #5C554E; font-size: 14px;">Subtotal</span><span style="color: #1A1410; font-weight: 500;">$${order.subtotal.toFixed(2)}</span></div>` : ''}
                ${order.tax ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #5C554E; font-size: 14px;">Tax</span><span style="color: #1A1410; font-weight: 500;">$${order.tax.toFixed(2)}</span></div>` : ''}
                ${order.deliveryFee > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #5C554E; font-size: 14px;">Delivery Fee</span><span style="color: #1A1410; font-weight: 500;">$${order.deliveryFee.toFixed(2)}</span></div>` : ''}
                ${order.discount > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #16a34a; font-size: 14px;">Discount</span><span style="color: #16a34a; font-weight: 600;">-$${order.discount.toFixed(2)}</span></div>` : ''}
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px dashed #D4CFC5; margin-top: 8px;">
                  <span style="font-size: 18px; font-weight: 800; color: #1A1410;">Total</span>
                  <span style="font-size: 18px; font-weight: 800; color: #C1440E;">$${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Loyalty Points Section (always shown) -->
          <div style="padding: 0 28px 20px;">
            <div style="background: linear-gradient(135deg, #1A1410 0%, #2D211E 100%); border-radius: 14px; padding: 24px; color: white;">
              <p style="margin: 0 0 16px; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #C1440E;">🏆 Loyalty Rewards</p>
              
              ${!isGuest ? `
              <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0;">
                <tr>
                  <td style="background: rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.1); text-align: center; width: 50%;">
                    <p style="margin: 0; font-size: 28px; font-weight: 800; color: #f97316;">+${order.pointsEarned || 0}</p>
                    <p style="margin: 4px 0 0; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Points Earned</p>
                  </td>
                  <td style="background: rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.1); text-align: center; width: 50%;">
                    <p style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">${totalPoints}</p>
                    <p style="margin: 4px 0 0; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Total Balance</p>
                  </td>
                </tr>
              </table>

              ${order.pointsRedeemed > 0 ? `
              <div style="margin-top: 12px; padding: 10px 14px; background: rgba(239,68,68,0.15); border-radius: 8px; border: 1px solid rgba(239,68,68,0.2);">
                <p style="margin: 0; font-size: 13px; color: #fca5a5;">🎁 You redeemed <strong>${order.pointsRedeemed} points</strong> on this order</p>
              </div>
              ` : ''}
              ` : `
              <div style="background: rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Start earning reward points!</p>
                <p style="margin: 6px 0 14px; font-size: 13px; color: rgba(255,255,255,0.5);">Create an account to earn 1 point per $1 spent and unlock exclusive rewards.</p>
                <a href="${config.frontendUrl || ''}/register" style="display: inline-block; background: #C1440E; color: white; padding: 10px 28px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Sign Up Free</a>
              </div>
              `}
            </div>
          </div>

          <!-- Order Details -->
          <div style="padding: 0 28px 20px;">
            <div style="background: #FAFAF8; border-radius: 14px; padding: 18px; border: 1px solid #F0EDE7;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #9B8D74; font-weight: 600;">Order Type</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #1A1410; font-weight: 600; text-align: right; text-transform: capitalize;">${order.type === 'dine_in' ? 'Dine In' : order.type}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #9B8D74; font-weight: 600;">Payment</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #1A1410; font-weight: 600; text-align: right; text-transform: capitalize;">${order.payment.method} — ${order.payment.status}</td>
                </tr>
                ${order.estimatedReadyAt ? `
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #9B8D74; font-weight: 600;">Est. Ready</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #C1440E; font-weight: 700; text-align: right;">${new Date(order.estimatedReadyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
                ` : ''}
              </table>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="padding: 0 28px 28px; text-align: center;">
            <a href="${config.frontendUrl || ''}/track/${order.orderNumber}" style="display: inline-block; background: #C1440E; color: white; padding: 14px 36px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 16px rgba(193,68,14,0.3);">Track My Order</a>
          </div>

          <!-- Footer -->
          <div style="background: #FAFAF8; padding: 20px 28px; text-align: center; border-top: 1px solid #F0EDE7;">
            <p style="margin: 0; font-size: 12px; color: #9B8D74;">© ${new Date().getFullYear()} ${config.restaurantName}. ${config.restaurantAddress || ''}</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #B8AA8F;">Thank you for choosing us! 🍕</p>
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
          <h1 style="color: white; margin:0">${config.restaurantName}! 🍕</h1>
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
            <p>© ${new Date().getFullYear()} ${config.restaurantName}. ${config.restaurantAddress}</p>
            <p>You received this because you're a valued customer. <a href="#" style="color: #999;">Unsubscribe</a></p>
          </div>
        </div>`
    }
  },

  reservationConfirmation: (reservation) => {
    return {
      subject: `✅ Table Reservation Confirmed - ${config.restaurantName}`,
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
              See you soon at ${config.restaurantName}!<br>
              ${config.restaurantAddress}
            </p>
          </div>
        </div>`
    }
  },

  cateringConfirmation: (catering) => {
    return {
      subject: `🍕 Catering Inquiry Confirmed - ${config.restaurantName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 15px; overflow: hidden;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin:0">Catering Confirmed!</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hi ${catering.name},</h2>
            <p>We're thrilled to be part of your event! Your catering inquiry has been confirmed.</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Event Date:</strong> ${new Date(catering.eventDate).toLocaleDateString()}</p>
              <p><strong>Guests:</strong> ${catering.guestsCount}</p>
              <p><strong>Event Type:</strong> ${catering.eventType}</p>
              <p><strong>Reference ID:</strong> #${catering._id.toString().slice(-6).toUpperCase()}</p>
            </div>
            <p>Our team will contact you shortly to finalize the menu and logistics.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Questions? Reply to this email or call us.<br>
              ${config.restaurantName} Catering Team
            </p>
          </div>
        </div>`
    }
  }
}

/**
 * EXPORTED SYSTEM UTILITIES
 */
export const sendOrderConfirmation = async (order, totalPoints = 0, isGuest = false) => {
  try {
    const { subject, html } = templates.orderConfirmation(order, totalPoints, isGuest)
    const result = await brevoRequest(order.customerInfo.email, subject, html)
    console.log(`✅ [EMAIL] Confirmation sent to ${order.customerInfo.email} (Points earned: ${order.pointsEarned || 0}, Balance: ${totalPoints}, Guest: ${isGuest})`)
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
    // Marketing emails come from "Offers"
    const result = await brevoRequest(to, subject, html, `${config.restaurantName} Offers`)
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

export const sendCateringConfirmation = async (catering) => {
  try {
    const { subject, html } = templates.cateringConfirmation(catering)
    const result = await brevoRequest(catering.email, subject, html)
    console.log(`✅ [EMAIL] Catering confirmation sent to ${catering.email}`)
    return result
  } catch (err) {
    console.error(`❌ [EMAIL] Catering Email Error: ${err.message}`)
  }
}
