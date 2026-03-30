import mongoose from 'mongoose';
import { MenuItem } from './models/MenuItem.js';
import { config } from './config.js';

async function checkLoyaltyItems() {
  try {
    await mongoose.connect(config.mongoUri);
    const count = await MenuItem.countDocuments({ isLoyaltyItem: true });
    const allItems = await MenuItem.find({ isLoyaltyItem: true }).select('name loyaltyCost');
    console.log(`Found ${count} loyalty items:`);
    console.log(allItems);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLoyaltyItems();
