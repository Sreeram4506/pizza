const API_BASE = '/api';

export const OrderService = {
    async placeOrder(orderData) {
        try {
            const token = localStorage.getItem('customerToken');
            const headers = {
                'Content-Type': 'application/json',
            };
            
            // Add authorization header if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers,
                body: JSON.stringify(orderData),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.details || errData.error || 'Order placement failed on server');
            }
            return await response.json();
        } catch (error) {
            console.error('Order error:', error);
            return null;
        }
    },

    async trackOrder(phone) {
        try {
            const response = await fetch(`${API_BASE}/orders/track/${phone}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Tracking error:', error);
            return null;
        }
    },

    async chat(message, context) {
        try {
            const response = await fetch(`${API_BASE}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, context }),
            });
            if (!response.ok) throw new Error('AI Chat failed');
            return await response.json();
        } catch (error) {
            console.error('AI Chat error:', error);
            return { text: "I'm having trouble connecting to my brain right now. Please try again later! 🍕" };
        }
    }
};
