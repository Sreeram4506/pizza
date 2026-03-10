import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Define MenuItem schema here to avoid importing complexities
const MenuItemSchema = new mongoose.Schema({
    name: String,
    image: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory' }
}, { strict: false });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema, 'menuitems');

async function updateItems() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const items = await MenuItem.find({});
        console.log(`Found ${items.length} items to process...`);

        let updatedCount = 0;

        for (const item of items) {
            let selectedImage = null;
            const name = item.name.toLowerCase();

            if (name.includes('cheese')) selectedImage = '/uploads/menu/cheese.png';
            else if (name.includes('pepperoni')) selectedImage = '/uploads/menu/pepperoni.png';
            else if (name.includes('margherita')) selectedImage = '/uploads/menu/margherita.png';
            else if (name.includes('aloha')) selectedImage = '/uploads/menu/aloha.png';
            else if (name.includes('greek')) selectedImage = '/uploads/menu/greek.png';
            else if (name.includes('buffalo')) selectedImage = '/uploads/menu/buffalo.png';
            else if (name.includes('bbq')) selectedImage = '/uploads/menu/bbq_chicken.png';
            else if (name.includes('supreme')) selectedImage = '/uploads/menu/supreme.png';
            else if (name.includes('alfredo') || name.includes('white')) selectedImage = '/uploads/menu/white.png';
            else if (name.includes('meaty') || name.includes('meat lover')) selectedImage = '/uploads/menu/meaty.png';
            else if (name.includes('vegetable') || name.includes('garden')) selectedImage = '/uploads/menu/veggie.png';
            else if (name.includes('calzone')) selectedImage = '/uploads/menu/calzone.png';
            else if (name.includes('pasta') || name.includes('marinara')) selectedImage = '/uploads/menu/pasta.png';
            else if (name.includes('parmesan') && !name.includes('pizza')) selectedImage = '/uploads/menu/pasta.png';
            else if (name.includes('sub') || name.includes('sandwich') || name.includes('melt')) {
                selectedImage = '/uploads/menu/sub.png';
            }

            if (selectedImage && item.image !== selectedImage) {
                await MenuItem.updateOne({ _id: item._id }, { $set: { image: selectedImage } });
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} items with premium images.`);
        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
}

updateItems();
