import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MenuItemSchema = new mongoose.Schema({
    name: String,
    image: String
}, { strict: false });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema, 'menuitems');

async function expandMappings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const items = await MenuItem.find({});
        let updatedCount = 0;

        for (const item of items) {
            let selectedImage = null;
            const name = item.name.toLowerCase();

            // Skip already updated premium local images
            if (item.image && item.image.startsWith('/uploads/menu/')) continue;

            if (name.includes('cheese') || name.includes('plain')) selectedImage = '/uploads/menu/cheese.png';
            else if (name.includes('pepperoni')) selectedImage = '/uploads/menu/pepperoni.png';
            else if (name.includes('margherita')) selectedImage = '/uploads/menu/margherita.png';
            else if (name.includes('aloha') || name.includes('hawaiian')) selectedImage = '/uploads/menu/aloha.png';
            else if (name.includes('greek')) selectedImage = '/uploads/menu/greek.png';
            else if (name.includes('buffalo')) selectedImage = '/uploads/menu/buffalo.png';
            else if (name.includes('bbq') || name.includes('honey bbq')) selectedImage = '/uploads/menu/bbq_chicken.png';
            else if (name.includes('supreme')) selectedImage = '/uploads/menu/supreme.png';
            else if (name.includes('white') || name.includes('alfredo') || name.includes('garlic')) selectedImage = '/uploads/menu/white.png';
            else if (name.includes('meaty') || name.includes('meat lover') || name.includes('meatball')) {
                if (name.includes('pizza')) selectedImage = '/uploads/menu/meaty.png';
                else selectedImage = '/uploads/menu/sub.png';
            }
            else if (name.includes('veggie') || name.includes('vegetable') || name.includes('garden')) {
                if (name.includes('pizza')) selectedImage = '/uploads/menu/veggie.png';
                else selectedImage = '/uploads/menu/sub.png';
            }
            else if (name.includes('calzone')) selectedImage = '/uploads/menu/calzone.png';
            else if (name.includes('pasta') || name.includes('lasagna') || name.includes('spaghetti')) selectedImage = '/uploads/menu/pasta.png';
            else if (name.includes('sub') || name.includes('sandwich') || name.includes('melt') || name.includes('steak') || name.includes('burger') || name.includes('parm') || name.includes('cutlet')) {
                selectedImage = '/uploads/menu/sub.png';
            }

            if (selectedImage) {
                await MenuItem.updateOne({ _id: item._id }, { $set: { image: selectedImage } });
                updatedCount++;
            }
        }

        console.log(`Successfully mapped ${updatedCount} additional items to premium assets.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

expandMappings();
