import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/Chatbot.jsx');
let c = fs.readFileSync(file, 'utf8');

let count = 0;
function rep(from, to) {
  if (c.includes(from)) {
    c = c.split(from).join(to);
    count++;
  }
}

// 1. Input Field
rep(
  'className="flex-1 px-4 sm:px-8 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-mozzarella-100 border-none focus:ring-2 focus:ring-tomato-600/10 outline-none text-wood-800 font-bold placeholder:text-wood-300 text-sm sm:text-base transition-all"',
  'className="flex-1 px-5 py-4 chatbot-input-field outline-none font-bold text-sm sm:text-base"'
);

// 2. Mic Button
rep(
  "className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}",
  "className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full transition-all ${isListening ? 'chatbot-btn-primary animate-pulse' : 'chatbot-btn-secondary'}`}"
);

// 3. Send Button
rep(
  'className="w-12 h-12 sm:w-16 sm:h-16 bg-tomato-600 text-white font-black rounded-full shadow-lg shadow-tomato-600/20 flex items-center justify-center shrink-0"',
  'className="w-12 h-12 sm:w-16 sm:h-16 chatbot-btn-primary font-black rounded-full flex items-center justify-center shrink-0"'
);

// 4. ChatMessage - Bot bubble
rep(
  "? 'bg-white rounded-tl-sm text-wood-700 font-medium border border-crust-100'",
  "? 'chatbot-msg-bot rounded-tl-sm font-medium'"
);
// fallback for slight variation
rep(
  "? 'bg-white rounded-tl-sm text-wood-800 font-medium border border-crust-100 shadow-sm'",
  "? 'chatbot-msg-bot rounded-tl-sm font-medium shadow-lg'"
);

// 5. ChatMessage - User bubble
rep(
  ": 'bg-tomato-600 text-white rounded-tr-sm shadow-xl shadow-tomato-600/10 font-bold'",
  ": 'chatbot-msg-user rounded-tr-sm font-bold shadow-lg'"
);

// 6. Action buttons on bot messages
rep(
  'className="px-6 py-2.5 rounded-2xl bg-wood-800 text-white text-sm font-bold shadow-lg"',
  'className="px-6 py-2.5 rounded-2xl chatbot-btn-primary text-sm font-bold"'
);
rep(
  'className="px-6 py-2.5 rounded-2xl border-2 border-crust-100 text-wood-800 text-sm font-bold hover:bg-white transition-colors"',
  'className="px-6 py-2.5 rounded-2xl chatbot-btn-secondary text-sm font-bold"'
);

// 7. Typing Indicator
rep(
  'className="px-5 py-4 rounded-[2rem] rounded-tl-sm bg-white flex gap-2 border border-crust-100 shadow-sm"',
  'className="px-5 py-4 rounded-[2rem] rounded-tl-sm chatbot-msg-bot flex gap-2 shadow-lg"'
);
rep(
  'className="w-1.5 h-1.5 rounded-full bg-tomato-600"',
  'className="w-1.5 h-1.5 rounded-full bg-[#C1440E]"'
);

// 8. Payment View Icon background
rep(
  'bg-tomato-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-tomato-600/20 mb-6 text-white',
  'rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl mb-6 text-white" style={{ background: \'linear-gradient(135deg, #C1440E, #8B2F0A)\' }'
);

// 9. Payment title
rep(
  'text-wood-800 tracking-tight uppercase">Secure Payment',
  'text-white tracking-tight uppercase">Secure Payment'
);

// 10. System Active text
rep(
  'text-basil-600 font-black uppercase tracking-[0.2em] flex items-center gap-2',
  'text-[#C1440E] font-black uppercase tracking-[0.3em] flex items-center gap-2'
);
rep(
  'bg-basil-600 animate-pulse',
  'bg-[#C1440E] animate-pulse'
);

console.log(`Script v3 finished. ${count} replacements made.`);
fs.writeFileSync(file, c, 'utf8');
