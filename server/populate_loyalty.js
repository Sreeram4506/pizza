import mongoose from 'mongoose';
import { MenuItem } from './models/MenuItem.js';
import { config } from './config.js';

async function run() {
  try {
    await mongoose.connect(config.mongoUri);
    // Find some sample items
    const items = await MenuItem.find({ name: { $regex: /Coke|Garlic|Pepperoni|Salad|Brownie/i } }).limit(5);
    
    if (items.length === 0) {
      console.log('No matching items found. Creating a few...');
      // If none found (unlikely), pick any 3 items
      const fallback = await MenuItem.find().limit(3);
      for (const item of fallback) {
        item.isLoyaltyItem = true;
        item.loyaltyCost = 300;
        await item.save();
        console.log(`Marked ${item.name} as loyalty item (300 pts)`);
      }
    } else {
      for (const item of items) {
        item.isLoyaltyItem = true;
        // Logic for cost
        if (item.name.toLowerCase().includes('pizza')) {
           item.loyaltyCost = 800;
        } else if (item.name.toLowerCase().includes('coke')) {
           item.loyaltyCost = 150;
        } else {
           item.loyaltyCost = 450;
        }
        await item.save();
        console.log(`Marked ${item.name} as loyalty item (${item.loyaltyCost} pts)`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
