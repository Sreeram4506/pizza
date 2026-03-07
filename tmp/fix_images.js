import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const UPLOADS_DIR = path.join(__dirname, '../server/uploads/menu');
const PLACEHOLDER_URL = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80';

// Define MenuItem Schema again for the script
const MenuItemSchema = new mongoose.Schema({
    name: String,
    image: String,
});

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

async function fixBrokenImages() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const items = await MenuItem.find({});
        console.log(`Found ${items.length} menu items.`);

        let fixedCount = 0;
        for (const item of items) {
            if (!item.image) {
                console.log(`Item "${item.name}" has no image. Setting placeholder...`);
                item.image = PLACEHOLDER_URL;
                await item.save();
                fixedCount++;
                continue;
            }

            // If it's a relative path, check if file exists
            if (item.image.startsWith('/uploads/menu/')) {
                const fileName = item.image.replace('/uploads/menu/', '');
                const filePath = path.join(UPLOADS_DIR, fileName);

                if (!fs.existsSync(filePath)) {
                    console.log(`File missing for "${item.name}": ${fileName}. Setting placeholder...`);
                    item.image = PLACEHOLDER_URL;
                    await item.save();
                    fixedCount++;
                }
            }
        }

        console.log(`Scan complete. Fixed ${fixedCount} items.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixBrokenImages();
