import mongoose from 'mongoose';
import { Customer } from './models/Customer.js';
import { Loyalty, LoyaltyConfig } from './models/Loyalty.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dir, '../.env') });

async function debugCustomers() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    try {
        let customer = await Customer.findOne();
        if (!customer) {
            console.log('No customer found. Creating one.');
            customer = new Customer({
                name: 'Test Customer',
                phone: '1234567890',
                email: 'test@example.com'
            });
            await customer.save();
        }
        console.log('Found Customer:', customer._id);

        // Simulate award points
        const points = 50;
        const reason = 'Manual';
        const tenantId = null;

        if (!customer.loyalty) {
            console.log('customer.loyalty is null/undefined. Initializing...');
            customer.loyalty = { points: 0, lifetimePoints: 0, tier: 'bronze' };
        }

        console.log('Customer Loyalty before:', customer.loyalty.points);
        customer.loyalty.points += points;
        customer.loyalty.lifetimePoints += points;
        await customer.save();
        console.log('Customer Loyalty after:', customer.loyalty.points);

        // Update loyalty document
        let loyalty = await Loyalty.findOne({ tenantId, customerId: customer._id });
        if (!loyalty) {
            console.log('Creating loyalty document');
            loyalty = new Loyalty({ tenantId, customerId: customer._id });
        }
        loyalty.points += points;
        loyalty.lifetimePoints += points;
        loyalty.transactions.push({
            type: 'bonus',
            points,
            description: reason
        });
        await loyalty.save();
        console.log('Loyalty doc points:', loyalty.points);

        // Test rewards creation
        const configQuery = tenantId ? { tenantId } : { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] };
        const config = await LoyaltyConfig.findOne(configQuery);
        if (!config) {
            console.log('No loyalty config found!');
        } else {
            const dummyReward = {
                name: "Test Reward",
                pointsCost: 50,
                discountValue: 5,
                discountType: 'fixed'
            };
            config.rewards.push(dummyReward);
            await config.save();
            console.log('Saved reward. Rewards length:', config.rewards.length);
        }

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.connection.close();
    }
}

debugCustomers();
