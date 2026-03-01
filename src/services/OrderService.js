const API_BASE = '/api';

export const OrderService = {
    async placeOrder(orderData) {
        try {
            const response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });
            if (!response.ok) throw new Error('Order failed');
            return await response.ok ? response.json() : null;
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
