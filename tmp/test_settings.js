import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Settings } from '../server/models/Settings.js';

dotenv.config({ path: '../.env' });

async function testSettings() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const settings = await Settings.findOneAndUpdate(
            { tenantId: null },
            { $set: { restaurantName: 'Pizza Blast 2', email: 'test@example.com' } },
            { upsert: true, new: true }
        );
        console.log('Success:', settings);
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}

testSettings();
