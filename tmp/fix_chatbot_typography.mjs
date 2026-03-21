import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/Chatbot.jsx');
let c = fs.readFileSync(file, 'utf8');

// 1. Upgrade Header sizing and font
c = c.replace(/font-serif-1947 text-sm sm:text-xl text-wood-800 italic truncate/g, 'font-serif-1947 text-lg sm:text-2xl text-wood-800 tracking-tight truncate');

// 2. Chat Message Bubbles - improve font and weight
c = c.replace(/text-base whitespace-pre-wrap leading-relaxed/g, 'text-sm sm:text-base whitespace-pre-wrap leading-relaxed font-medium');

// 3. Tab Labels - more professional spacing
c = c.replace(/text-\[9px\] sm:text-\[10px\] font-black uppercase tracking-\[0.15em\]/g, 'text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] font-display');

// 4. Cart View - upgrade item names
c = c.replace(/font-display font-black text-base sm:text-xl text-wood-800 uppercase tracking-tight/g, 'font-serif-1947 text-lg sm:text-2xl text-wood-800 tracking-tight');

// 5. Checkout View Headers
c = c.replace(/font-display font-black text-3xl text-wood-800 tracking-tight uppercase/g, 'font-serif-1947 text-3xl sm:text-4xl text-wood-800 tracking-tight');

// 6. Section Labels (Guest Info, Pay Info)
c = c.replace(/text-lg font-semibold text-wood-800 mb-4/g, 'text-[11px] font-black uppercase tracking-[0.25em] text-wood-400 mb-6 font-display');

// 7. Inputs - cleaner font
c = c.replace(/outline-none font-bold text-sm sm:text-base/g, 'outline-none font-medium text-sm sm:text-base tracking-tight');

fs.writeFileSync(file, c, 'utf8');
console.log('Chatbot fonts and sizes upgraded for professional look');
