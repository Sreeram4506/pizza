import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/Chatbot.jsx');
let c = fs.readFileSync(file, 'utf8');

// 1. Fix Checkout View headers (was text-white)
c = c.replace(/className="font-display font-black text-3xl text-white tracking-tight uppercase">Secure Payment<\/h2>/, 'className="font-display font-black text-3xl text-wood-800 tracking-tight uppercase">Secure Payment</h2>');

// 2. Fix Guest Information Headers (some might be white or too light)
// actually most are text-wood-800 already.

// 3. Fix Secure Payment subtext span colors
// Line 890: <span>Paying ... to {settings?.restaurantName || 'Pizza Blast'}</span>
// This was inside a <p className="text-xs text-wood-400 ..."> so it's fine.

// 4. Fix any other white text in the chatbot overlay
c = c.replace(/text-white italic truncate"\}\>\{restaurantName\}\<\/h3\>/, 'text-wood-800 italic truncate">{restaurantName}</h3>');

// 5. Fix Typing Indicator text (if it was white)
c = c.replace(/className="text-xs text-white\/50 font-medium italic"/, 'className="text-xs text-wood-400 font-medium italic"');

// 6. Fix Payment Method Buttons (some might use text-white inappropriately)
// Line 973: 'bg-tomato-600 text-white border-tomato-600' (This is fine, white on red).
// Line 974: 'bg-white text-wood-700 border-wood-200 hover:border-tomato-300' (This is fine).

fs.writeFileSync(file, c, 'utf8');
console.log('Chatbot colors updated for white theme');
