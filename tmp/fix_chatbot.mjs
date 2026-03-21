import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/Chatbot.jsx');
let c = fs.readFileSync(file, 'utf8');

// Count replacements
let count = 0;
function rep(from, to) {
  if (c.includes(from)) {
    c = c.replace(from, to);
    count++;
  } else {
    console.log('NOT FOUND:', from.substring(0, 80));
  }
}

// 1. Chat window container - make dark overlay
rep(
  'className="fixed inset-0 z-[60] bg-mozzarella-100 flex flex-col border-none text-wood-800"',
  'className="fixed inset-0 z-[80] chatbot-overlay flex flex-col"'
);

// 2. Header
rep(
  'className="flex items-center justify-between p-4 sm:p-8 border-b border-gray-100 bg-white"',
  'className="chatbot-header flex items-center justify-between p-4 sm:p-8 shrink-0 relative z-10"'
);

// 3. Header icon
rep(
  'className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-tomato-600 flex items-center justify-center text-xl sm:text-2xl shadow-[0_0_20px_rgba(220,38,38,0.2)] text-white shrink-0"',
  `className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 font-serif-1947 text-xl sm:text-2xl" style={{ background: 'linear-gradient(135deg, #C1440E, #8B2F0A)' }}`
);

// 4. Header emoji to letter
rep(
  '>🍕\n                </div>',
  `>{settings?.restaurantName?.[0] || 'M'}\n                </div>`
);
// also try with \r\n
rep(
  '>🍕\r\n                </div>',
  `>{settings?.restaurantName?.[0] || 'M'}\r\n                </div>`
);

// 5. Header title
rep(
  `className="font-display font-black text-sm sm:text-xl text-wood-800 tracking-tight uppercase truncate">Pizza Assistant</h3>`,
  `className="font-serif-1947 text-sm sm:text-xl text-white italic truncate">{restaurantName}</h3>`
);

// 6. System active text
rep(
  'className="text-[8px] sm:text-[10px] text-basil-600 font-black uppercase tracking-[0.2em] flex items-center gap-2"',
  'className="text-[7px] sm:text-[9px] text-[#C1440E] font-black uppercase tracking-[0.3em] flex items-center gap-2"'
);
rep(
  'className="w-1.5 h-1.5 rounded-full bg-basil-600 animate-pulse"',
  'className="w-1.5 h-1.5 rounded-full bg-[#C1440E] animate-pulse"'
);

// 7. Tab nav container
rep(
  'className="flex items-center bg-white/50 rounded-full p-1 border border-gray-100"',
  `className="flex items-center p-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}`
);

// 8. Tab buttons
rep(
  `className={\`px-3 sm:px-8 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all \${view === tab ? 'bg-tomato-600 text-white shadow-lg shadow-tomato-600/20' : 'text-wood-600 hover:text-tomato-600'}\`}`,
  `className={\`px-3 sm:px-8 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all \${view === tab ? 'chatbot-tab-active' : 'chatbot-tab-inactive'}\`}`
);

// 9. Close button
rep(
  'className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 flex items-center justify-center text-wood-500 hover:text-tomato-600 transition-all font-bold hover:bg-gray-50 shrink-0"',
  'className="w-10 h-10 sm:w-12 sm:h-12 rounded-full chatbot-btn-secondary flex items-center justify-center text-white/60 hover:text-red-400 transition-all font-bold shrink-0"'
);

// 10. Body container
rep(
  'className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-mozzarella-100/50">',
  'className="flex-1 overflow-y-auto chatbot-scroll relative z-10">'
);

// 11. Input area
rep(
  'className="p-4 sm:p-8 border-t border-gray-100 bg-white"',
  'className="p-4 sm:p-8 chatbot-input-area relative z-10"'
);

// 12. Floating button
rep(
  'className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[60] bg-tomato-600 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-2xl shadow-tomato-600/30"',
  `className="chatbot-float-btn fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[60] w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-2xl" style={{ background: 'linear-gradient(135deg, #C1440E 0%, #8B2F0A 100%)' }}`
);

console.log(`Done! ${count} replacements made.`);
fs.writeFileSync(file, c, 'utf8');
