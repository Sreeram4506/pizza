import fs from 'fs';
import path from 'path';

const BRAIN_DIR = 'C:/Users/SREER/.gemini/antigravity/brain/f344972f-74e2-4f7c-8fb0-b605e554458d';
const TARGET_DIR = './server/uploads/menu';

const imageMap = {
    'pb_and_j.png': /pb_and_j_pizza_premium_.*\.png/,
    'pulled_pork.png': /pulled_pork_pizza_premium_.*\.png/,
    'mediterranean_unique.png': /mediterranean_pizza_premium_.*\.png/
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

setupImages();
