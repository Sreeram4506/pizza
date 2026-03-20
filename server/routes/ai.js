import { Router } from 'express';
import fetch from 'node-fetch';
import { config } from '../config.js';
import { buildRestaurantChatSystemPrompt } from '../prompts/restaurantChatPrompt.js';

const router = Router();

router.post('/chat', async (req, res) => {
    const { message, context } = req.body;

    if (!config.nvidiaApiKey) {
        console.error('[AI-CHAT] Error: NVIDIA_API_KEY is missing from config');
        return res.status(500).json({ error: 'NVIDIA API Key not configured' });
    }

    try {
        console.log('[AI-CHAT] Request received');
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
                        content: buildRestaurantChatSystemPrompt(context)
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
