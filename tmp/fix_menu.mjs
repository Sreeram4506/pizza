import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/MenuPage.jsx');
let c = fs.readFileSync(file, 'utf8');

// 1. Remove points from header
const pointsHeader = /<div className="hidden sm:flex items-center gap-2 glass-pill px-4 py-2">[\s\S]*?<span className="text-lg">🎁<\/span>[\s\S]*?730 pts[\s\S]*?<\/div>/;
c = c.replace(pointsHeader, '');

// 2. Remove points button from subheader
const pointsBtn = /<button\s+onClick=\{\(\)\s+=>\s+openWithIntent\('loyalty'\)\}[\s\S]*?>[\s\S]*?🎁 Points[\s\S]*?<\/button>/;
c = c.replace(pointsBtn, '');

fs.writeFileSync(file, c, 'utf8');
console.log('MenuPage.jsx points removed successfully');
