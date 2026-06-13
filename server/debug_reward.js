import mongoose from 'mongoose';
import { LoyaltyConfig } from './models/Loyalty.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dir, '../.env') });

async function debugReward() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    try {
        const tenantId = null;
        const query = tenantId ? { tenantId } : { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] };
        const config = await LoyaltyConfig.findOne(query);

        if (!config) {
            console.log('No config found!');
            return;
        }

        const payload = {
            name: "Test Reward Browser",
            pointsCost: 100,
            discountValue: 10,
            discountType: "fixed"
        };

        config.rewards.push(payload);
        await config.save();
        console.log('Saved successfully');

    } catch (err) {
        console.error('DEBUG ERROR:', err);
    } finally {
        await mongoose.connection.close();
    }
}

debugReward();
