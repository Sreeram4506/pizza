import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
    CardElement,
    Elements,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js'
import { motion } from 'framer-motion'

// Load stripe with the publishable key
if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set - Stripe payments will not work')
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    : null;

const CheckoutForm = ({ amount, onPaymentSuccess, onCancel }) => {
    const stripe = useStripe()
    const elements = useElements()
    const [error, setError] = useState(null)
    const [processing, setProcessing] = useState(false)
    const [clientSecret, setClientSecret] = useState('')

    useEffect(() => {
        // Create PaymentIntent as soon as the component loads
        fetch('/api/payments/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount }),
        })
            .then((res) => res.json())
            .then((data) => setClientSecret(data.clientSecret))
            .catch((err) => console.error('Failed to init payment:', err))
    }, [amount])

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!stripe || !elements) return

        setProcessing(true)

        const payload = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
            },
        })

        if (payload.error) {
            setError(`Payment failed: ${payload.error.message}`)
            setProcessing(false)
        } else {
            setError(null)
            setProcessing(false)
            onPaymentSuccess(payload.paymentIntent)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-6 bg-[#FAFAF8] rounded-3xl border border-[#EBEBE6] shadow-inner">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9B8D74] mb-4 block">
                    Card Details
                </label>
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#292524', // [#1A1410]
                                '::placeholder': { color: '#a8a29e' }, // [#9B8D74]
                                fontFamily: 'Inter, system-ui, sans-serif',
                            },
                            invalid: { color: '#dc2626' }, // ember-600
                        },
                    }}
                />
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-ember-50 border border-ember-100 text-ember-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center"
                >
                    {error}
                </motion.div>
            )}

            <div className="flex flex-col gap-3">
                <motion.button
                    type="submit"
                    disabled={!stripe || processing || !clientSecret}
                    className="w-full py-5 rounded-[2rem] bg-ember-600 text-white font-black text-lg shadow-xl shadow-ember-600/20 disabled:opacity-50 transition-all uppercase tracking-widest"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
                </motion.button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full py-2 text-[#9B8D74] font-bold text-[10px] uppercase tracking-widest hover:text-ember-600 transition-colors"
                >
                    Cancel & Go Back
                </button>
            </div>
        </form>
    )
}

export default function StripeWrapper({ amount, onPaymentSuccess, onCancel }) {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm
                amount={amount}
                onPaymentSuccess={onPaymentSuccess}
                onCancel={onCancel}
            />
        </Elements>
    )
}
