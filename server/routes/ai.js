import { Router } from 'express';
import fetch from 'node-fetch';
import { config } from '../config.js';

const router = Router();

router.post('/chat', async (req, res) => {
    console.log('[AI-CHAT] Request received:', JSON.stringify(req.body));
    const { message, context } = req.body;

    if (!config.nvidiaApiKey) {
        console.error('[AI-CHAT] Error: NVIDIA_API_KEY is missing from config');
        return res.status(500).json({ error: 'NVIDIA API Key not configured' });
    }

    try {
        console.log('[AI-CHAT] Calling NVIDIA API...');
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.nvidiaApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'meta/llama3-70b-instruct',
                messages: [
                    {
                        role: 'system',
                        content: `You are "Pizza Blast AI", a helpful assistant for PIZZA BLAST restaurant. 

Behavior: 
- Use emojis related to pizza (🍕, 🔥, 🥗, 🧀, 🍅).
- Be friendly, premium, and Italian-inspired.
- Help users browse menu, place orders, and track them.
- Keep responses concise but helpful.

Order Detection:
- If user says "place order", "checkout", "confirm", "I want to order", "ready to order", or similar phrases, you MUST include: [ACTION:PLACE_ORDER]
- If user has items in cart context and wants to complete the purchase, include: [ACTION:PLACE_ORDER]
- Look for clear intent to purchase/checkout.

Context: ${JSON.stringify(context)}`
                    },
                    { role: 'user', content: message }
                ],
                temperature: 0.2,
                top_p: 0.7,
                max_tokens: 1024,
            }),
        });

        const data = await response.json();
        console.log('[AI-CHAT] NVIDIA Response status:', response.status);

        if (!response.ok) {
            console.error('[AI-CHAT] NVIDIA API error:', JSON.stringify(data));
            return res.status(response.status).json({ error: 'NVIDIA API error', details: data });
        }

        if (!data.choices || !data.choices[0]) {
            console.error('[AI-CHAT] Unexpected NVIDIA response format:', JSON.stringify(data));
            return res.status(500).json({ error: 'Unexpected AI response format' });
        }

        const aiMessage = data.choices[0].message.content;
        console.log('[AI-CHAT] AI Response:', aiMessage);

        let action = null;
        if (aiMessage.includes('[ACTION:PLACE_ORDER]')) {
            action = 'PLACE_ORDER';
        }

        res.json({
            text: aiMessage.replace('[ACTION:PLACE_ORDER]', '').trim(),
            action: action
        });
    } catch (error) {
        console.error('[AI-CHAT] Exception:', error);
        res.status(500).json({ error: 'Failed to connect to AI service', details: error.message });
    }
});

export default router;
