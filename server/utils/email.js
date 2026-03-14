import nodemailer from 'nodemailer'
import { config } from '../config.js'

export const sendEmail = async (to, subject, html) => {
  if (!config.smtpHost) {
    console.log('--- EMAIL SIMULATION (SMTP not configured) ---')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('--- BODY SNIPPET ---')
    console.log(html.substring(0, 200) + '...')
    console.log('-------------------------------------------')
    return { mock: true, success: true }
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  })

  try {
    console.log(`[EMAIL] Attempting to send to ${to}...`)
    const info = await transporter.sendMail({
      from: config.smtpFrom,
      to,
      subject,
      html
    })
    console.log('[EMAIL] Success:', info.messageId)
    return info
  } catch (error) {
    console.error(`[EMAIL] CRITICAL FAILURE to ${to}:`)
    console.error(` - Error Message: ${error.message}`)
    console.error(` - Host: ${config.smtpHost}`)
    console.error(` - User: ${config.smtpUser}`)
    console.error(` - From: ${config.smtpFrom}`)
    throw error
  }
}

export const sendOrderConfirmation = async (order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}x ${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const isPaid = order.payment.status === 'paid'

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
      <div style="background-color: #dc2626; padding: 30px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">Pizza Blast! 🍕</h1>
        <p style="color: #fff; margin: 10px 0 0; opacity: 0.9;">Order ${isPaid ? 'Paid' : 'Confirmed'}: ${order.orderNumber}</p>
      </div>
      
      <div style="padding: 30px; background-color: #fff;">
        <h2 style="margin: 0 0 20px;">Hi ${order.customerInfo.name},</h2>
        <p style="font-size: 16px; line-height: 1.6;">${isPaid ? "Your payment was successful!" : "We've received your order!"} Your fresh pizza is being prepared as we speak.</p>
        
        <div style="margin: 30px 0; background-color: #fef2f2; padding: 20px; border-radius: 15px;">
          <h3 style="color: #dc2626; margin: 0 0 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
            <tr>
              <td style="padding: 15px 10px 5px; font-weight: bold;">Subtotal</td>
              <td style="padding: 15px 10px 5px; text-align: right; font-weight: bold;">$${order.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 10px 15px; font-weight: bold;">Total + Tax & Fees</td>
              <td style="padding: 5px 10px 15px; text-align: right; font-weight: bold; font-size: 20px; color: #dc2626;">$${order.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 15px;">
          <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase;">
            ${order.type === 'delivery' ? 'Delivery Address' : order.type === 'pickup' ? 'Pickup Details' : 'Dine-in Details'}
          </h3>
          <p style="margin: 0; font-size: 14px; line-height: 1.4;">
            ${order.type === 'delivery'
      ? `${order.address.street}<br>${order.address.city} ${order.address.zip}`
      : order.type === 'pickup'
        ? `Ready for pickup at: ${new Date(order.estimatedReadyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : `Table reserved for: ${new Date(order.estimatedDineInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
          </p>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
             <span style="font-size: 12px; color: #666;">Payment: ${order.payment.method.toUpperCase()}</span>
             <span style="font-size: 10px; font-weight: 800; color: ${isPaid ? '#059669' : '#d97706'}; background: ${isPaid ? '#ecfdf5' : '#fffbeb'}; padding: 4px 10px; border-radius: 50px; text-transform: uppercase;">${order.payment.status}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track/${order.orderNumber}" style="background-color: #dc2626; color: #fff; text-decoration: none; padding: 15px 30px; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.2);">Track Your Delivery</a>
        </div>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #999;">
        <p>© 2024 Pizza Blast. 123 Pizza Plaza, New York, NY 10001</p>
        <p>You received this email because you placed an order at Pizza Blast.</p>
      </div>
    </div>
  `

  return sendEmail(order.customerInfo.email, `🍕 Order ${isPaid ? 'Paid' : 'Confirmed'} - ${order.orderNumber}`, emailHtml)
}

export const sendAdminNotification = async (order) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pizzablast.com'
  const emailHtml = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2 style="color: #dc2626;">🔥 New Order Received! 🔥</h2>
      <p>Order Number: <strong>${order.orderNumber}</strong></p>
      <p>Amount: <strong>$${order.total.toFixed(2)}</strong></p>
      <p>Type: <strong>${order.type.toUpperCase()}</strong></p>
      <p>Method: ${order.payment.method.toUpperCase()} (${order.payment.status})</p>
      <hr>
      <h3>Customer Info:</h3>
      <p>
        <strong>${order.customerInfo.name}</strong><br>
        ${order.customerInfo.email || 'No email provided'}<br>
        ${order.customerInfo.phone}
      </p>
      <hr>
      <h3>Service Details:</h3>
      <p>
        ${order.type === 'delivery'
      ? `Address: ${order.address.street}, ${order.address.city} ${order.address.zip}`
      : order.type === 'pickup'
        ? `Pickup scheduled for: ${new Date(order.estimatedReadyAt).toLocaleString()}`
        : `Dine-in scheduled for: ${new Date(order.estimatedDineInTime).toLocaleString()}`
    }
      </p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/orders" style="display:inline-block; margin-top: 20px; padding: 15px 25px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 10px; font-weight: bold;">Manage Order</a>
    </div>
  `
  return sendEmail(adminEmail, `🔥 NEW ORDER #${order.orderNumber}`, emailHtml)
}

export const sendMarketingEmail = async (to, subject, message, customerName, template = 'custom') => {
  const personalizedMessage = message
    .replace(/\{\{\s*customer_name\s*\}\}/g, customerName || 'Pizza Lover')
    .replace(/\n/g, '<br>')

  let contentHtml = ''

  if (template === 'promotion' || template === 'flash') {
    contentHtml = `
      <div style="background-color: #dc2626; padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 48px; font-weight: 900; text-transform: uppercase; letter-spacing: -2px;">FLASH DEAL! ⚡️</h1>
      </div>
      <div style="padding: 40px; background-color: #fff; text-align: center;">
        <h2 style="font-size: 24px; color: #1c1917; margin-bottom: 20px;">Hey ${customerName || 'Pizza Lover'}, don't miss out!</h2>
        <div style="font-size: 18px; line-height: 1.6; color: #444; margin-bottom: 30px;">
          ${personalizedMessage}
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu" style="display: inline-block; background-color: #dc2626; color: #fff; text-decoration: none; padding: 20px 40px; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-size: 18px;">CLAIM MY PIZZA NOW</a>
      </div>
    `
  } else if (template === 'newsletter') {
    contentHtml = `
      <div style="background-color: #1c1917; padding: 30px; text-align: center; border-radius: 20px 20px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">THE PIZZA PRESS 🗞️</h1>
      </div>
      <div style="padding: 40px; background-color: #fff;">
        <h2 style="font-size: 20px; color: #1c1917; margin-bottom: 15px;">Weekly Updates for ${customerName || 'Our Favorite Customer'}</h2>
        <div style="font-size: 15px; line-height: 1.8; color: #444;">
          ${personalizedMessage}
        </div>
        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #dc2626; font-weight: bold; text-decoration: none;">Read more on our blog →</a>
        </div>
      </div>
    `
  } else {
    // Standard template
    contentHtml = `
      <div style="background-color: #dc2626; padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 32px; letter-spacing: -1px;">Pizza Blast! 🍕</h1>
      </div>
      <div style="padding: 40px; background-color: #fff;">
        <h2 style="margin: 0 0 20px; color: #292524;">Hi ${customerName || 'Pizza Lover'},</h2>
        <div style="font-size: 16px; line-height: 1.8; color: #444;">
          ${personalizedMessage}
        </div>
        <div style="text-align: center; margin-top: 50px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu" style="background-color: #dc2626; color: #fff; text-decoration: none; padding: 18px 35px; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3); font-size: 16px;">Order Your Favorite Pizza</a>
        </div>
      </div>
    `
  }

  const emailHtml = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
      ${contentHtml}
      
      <div style="padding: 30px; background-color: #fef2f2; text-align: center; border-top: 1px solid #fee2e2;">
        <p style="margin: 0; color: #dc2626; font-weight: bold; font-size: 14px;">GET IT WHILE IT'S HOT! 🔥</p>
        <p style="margin: 5px 0 0; color: #991b1b; font-size: 12px;">Valid for a limited time only at participating locations.</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 30px; text-align: center; font-size: 12px; color: #999;">
        <p style="margin: 0 0 10px;">© 2024 Pizza Blast. 123 Pizza Plaza, New York, NY 10001</p>
        <p style="margin: 0;">You're receiving this because you're a valued customer. <a href="#" style="color: #999; text-decoration: underline;">Unsubscribe</a></p>
      </div>
    </div>
  `
  return sendEmail(to, subject, emailHtml)
}
