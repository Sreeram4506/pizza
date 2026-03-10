import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const BRAIN_DIR = 'C:/Users/SREER/.gemini/antigravity/brain/f344972f-74e2-4f7c-8fb0-b605e554458d';
const TARGET_DIR = './server/uploads/menu';
const API_URL = 'http://localhost:5000/api/menu/items';

const imageMap = {
    'cheese.png': /cheese_pizza_premium_.*\.png/,
    'pepperoni.png': /pepperoni_pizza_premium_.*\.png/,
    'veggie.png': /veggie_pizza_premium_.*\.png/,
    'margherita.png': /margherita_pizza_premium_.*\.png/,
    'bbq_chicken.png': /bbq_chicken_pizza_premium_.*\.png/,
    'calzone.png': /calzone_premium_.*\.png/,
    'sub.png': /sub_sandwich_premium_.*\.png/,
    'pasta.png': /pasta_marinara_premium_.*\.png/,
    'aloha.png': /aloha_pizza_premium_.*\.png/,
    'meaty.png': /meat_lovers_pizza_premium_.*\.png/,
    'greek.png': /greek_pizza_premium_.*\.png/,
    'buffalo.png': /buffalo_chicken_pizza_premium_.*\.png/,
    'supreme.png': /supreme_pizza_premium_.*\.png/,
    'white.png': /white_pizza_premium_.*\.png/
};

async function setupImages() {
    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    const files = fs.readdirSync(BRAIN_DIR);
    for (const [newName, regex] of Object.entries(imageMap)) {
        const found = files.find(f => regex.test(f));
        if (found) {
            fs.copyFileSync(path.join(BRAIN_DIR, found), path.join(TARGET_DIR, newName));
            console.log(`Copied ${found} to ${newName}`);
        }
    }
}

async function updateDatabase() {
    const response = await fetch(API_URL);
    const items = await response.json();

    console.log(`Found ${items.length} items to process...`);

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
        else if (name.includes('meaty') || name.includes('meat lover')) selectedImage = '/uploads/menu/meaty.png';
        else if (name.includes('vegetable') || name.includes('garden')) selectedImage = '/uploads/menu/veggie.png';
        else if (name.includes('calzone')) selectedImage = '/uploads/menu/calzone.png';
        else if (name.includes('pasta') || name.includes('marinara')) selectedImage = '/uploads/menu/pasta.png';
        else if (item.categoryId && (item.categoryId.name === 'Subs' || item.categoryId === 'SUBS_ID_PLACEHOLDER')) selectedImage = '/uploads/menu/sub.png';

        // Fallback for sub categories even if name doesn't match
        if (!selectedImage && (name.includes('sub') || name.includes('sandwich') || name.includes('melt'))) {
            selectedImage = '/uploads/menu/sub.png';
        }

        if (selectedImage) {
            console.log(`Updating ${item.name} with ${selectedImage}...`);
            // We need to use the admin update API. Assuming no auth for this local script for now or I'll have to bypass
            // Actually I'll use direct MongoDB if possible or just use a helper script that imports models
        }
    }
}

// Since I don't want to deal with tokens in this script, I'll write another script that uses the models directly
setupImages();
