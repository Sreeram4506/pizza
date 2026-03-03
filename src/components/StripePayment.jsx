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
// Replace this with your actual publishable key from your .env or similar
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51...your_mock_key...');

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
            <div className="p-6 bg-mozzarella-100 rounded-3xl border border-crust-100 shadow-inner">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-wood-400 mb-4 block">
                    Card Details
                </label>
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#292524', // wood-800
                                '::placeholder': { color: '#a8a29e' }, // wood-400
                                fontFamily: 'Inter, system-ui, sans-serif',
                            },
                            invalid: { color: '#dc2626' }, // tomato-600
                        },
                    }}
                />
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-tomato-50 border border-tomato-100 text-tomato-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center"
                >
                    {error}
                </motion.div>
            )}

            <div className="flex flex-col gap-3">
                <motion.button
                    type="submit"
                    disabled={!stripe || processing || !clientSecret}
                    className="w-full py-5 rounded-[2rem] bg-tomato-600 text-white font-black text-lg shadow-xl shadow-tomato-600/20 disabled:opacity-50 transition-all uppercase tracking-widest"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
                </motion.button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full py-2 text-wood-400 font-bold text-[10px] uppercase tracking-widest hover:text-tomato-600 transition-colors"
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
