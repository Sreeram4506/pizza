import express, { Router } from 'express'
import Stripe from 'stripe'
import { config } from '../config.js'

const router = Router()
const stripe = new Stripe(config.stripeSecretKey || 'sk_test_mock')

router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd', orderId } = req.body

        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' })
        }

        // Amount should be in cents
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            metadata: { orderId: orderId || 'guest_order' },
            automatic_payment_methods: { enabled: true },
        })

        res.json({
            clientSecret: paymentIntent.client_secret,
            publishableKey: config.stripePublishableKey
        })
    } catch (err) {
        console.error('Payment Intent Error:', err.message)
        res.status(500).json({ error: 'Failed to create payment intent' })
    }
})

// Webhook for payment confirmation
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
        // In production, verify signature:
        // event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
        event = req.body

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object
            const orderId = paymentIntent.metadata.orderId

            // Update order status in DB
            const { Order } = await import('../models/Order.js')
            await Order.findOneAndUpdate(
                { _id: orderId },
                { 'payment.status': 'paid', 'payment.transactionId': paymentIntent.id }
            )

            console.log(`Payment confirmed for Order ${orderId}`)
        }

        res.json({ received: true })
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`)
    }
})

export default router
