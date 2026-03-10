import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MenuItemSchema = new mongoose.Schema({
    name: String,
    image: String
}, { strict: false });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema, 'menuitems');

async function updateSpecificItems() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Update PB&J
        await MenuItem.updateMany(
            { name: /PB&J/i },
            { $set: { image: '/uploads/menu/pb_and_j.png' } }
        );

        // Update Pulled Pork
        await MenuItem.updateMany(
            { name: /Pulled Pork/i },
            { $set: { image: '/uploads/menu/pulled_pork.png' } }
        );

        // Update Mediterranean (already had a generic one, but let's use the unique one if it exists or just keep generic if it fits)
        await MenuItem.updateMany(
            { name: /Mediterranean/i },
            { $set: { image: '/uploads/menu/mediterranean_unique.png' } }
        );

        console.log('Successfully updated PB&J, Pulled Pork, and Mediterranean items with unique premium images.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateSpecificItems();
