import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/Chatbot.jsx');
let c = fs.readFileSync(file, 'utf8');

let count = 0;
function rep(from, to) {
  if (c.includes(from)) {
    c = c.replace(from, to);
    count++;
  }
}

// 1. Floating button
rep(
  'className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[60] w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-tomato-500 to-tomato-700 shadow-[0_4px_20px_rgba(239,68,68,0.3)] flex items-center justify-center text-white"',
  `className="chatbot-float-btn fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[60] w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #C1440E 0%, #8B2F0A 100%)' }}`
);

// 2. Floating button icon (replace with first letter of restaurant)
rep(
  "{isOpen ? '✕' : '💬'}",
  "{isOpen ? '✕' : settings?.restaurantName?.[0] || 'M'}"
);
rep(
  "animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>",
  "className=\"font-serif-1947\" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>"
);

// 3. Tab buttons (already have the classes applied?)
// Let's check view_file output again:
// 622: className={`px-3 sm:px-8 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === tab ? 'bg-tomato-600 text-white shadow-lg shadow-tomato-600/20' : 'text-wood-600 hover:text-tomato-600'}`}

rep(
  "className={`px-3 sm:px-8 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === tab ? 'bg-tomato-600 text-white shadow-lg shadow-tomato-600/20' : 'text-wood-600 hover:text-tomato-600'}`}",
  "className={`px-3 sm:px-8 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all ${view === tab ? 'chatbot-tab-active' : 'chatbot-tab-inactive'}`}"
);

// 4. Voice buttons in header
rep(
  "className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all ${isVoiceEnabled ? 'bg-basil-100 border-basil-200 text-basil-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}",
  "className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${isVoiceEnabled ? 'chatbot-btn-primary' : 'chatbot-btn-secondary'}`}"
);

// 5. Close button
rep(
  "className=\"w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-crust-100 flex items-center justify-center text-wood-500 hover:text-tomato-600 hover:border-tomato-200 transition-all font-bold shrink-0\"",
  "className=\"w-10 h-10 sm:w-12 sm:h-12 rounded-full chatbot-btn-secondary flex items-center justify-center text-white/60 hover:text-red-400 transition-all font-bold shrink-0\""
);

// 6. Header logo text replacement (remove 🍕)
rep(
  "<div className=\"w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 font-serif-1947 text-xl sm:text-2xl\" style={{ background: 'linear-gradient(135deg, #C1440E, #8B2F0A)' }}>\n                  🍕\n                </div>",
  `<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 font-serif-1947 text-xl sm:text-2xl" style={{ background: 'linear-gradient(135deg, #C1440E, #8B2F0A)' }}>
                  {settings?.restaurantName?.[0] || 'M'}
                </div>`
);
// retry with possible different line ending
rep(
  "<div className=\"w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 font-serif-1947 text-xl sm:text-2xl\" style={{ background: 'linear-gradient(135deg, #C1440E, #8B2F0A)' }}>\r\n                  🍕\r\n                </div>",
  `<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 font-serif-1947 text-xl sm:text-2xl" style={{ background: 'linear-gradient(135deg, #C1440E, #8B2F0A)' }}>
                  {settings?.restaurantName?.[0] || 'M'}
                </div>`
);

// 7. Payment view icon (🍕)
rep(
  "<div className=\"w-20 h-20 bg-tomato-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-tomato-600/20 mb-6 text-white\">\n                        💳\n                      </div>",
  `<div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl mb-6 text-white" style={{ background: 'linear-gradient(135deg, #C1440E, #8B2F0A)' }}>
                        💳
                      </div>`
);
rep(
  "<div className=\"w-20 h-20 bg-tomato-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-tomato-600/20 mb-6 text-white\">\r\n                        💳\r\n                      </div>",
  `<div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl mb-6 text-white" style={{ background: 'linear-gradient(135deg, #C1440E, #8B2F0A)' }}>
                        💳
                      </div>`
);

// 8. Payment h2 title color
rep(
  'text-wood-800 tracking-tight uppercase">Secure Payment</h2>',
  'text-white tracking-tight uppercase">Secure Payment</h2>'
);

// 9. Fix translation key
rep(
  "placeholder={t('chatbot.placeholder')}",
  "placeholder=\"How can I help you?\""
);

// 10. Fix body message container to be relative and dark
rep(
  'className="flex-1 overflow-y-auto chatbot-scroll relative z-10">',
  'className="flex-1 overflow-y-auto chatbot-scroll relative z-10 p-4 sm:p-10">'
);

// 11. Message bubbles - bot
rep(
  "? 'bg-white rounded-tl-sm text-wood-800 font-medium border border-crust-100 shadow-sm'",
  "? 'chatbot-msg-bot rounded-tl-sm font-medium'"
);
// Message bubbles - user
rep(
  ": 'bg-tomato-600 text-white rounded-tr-sm font-bold shadow-lg shadow-tomato-600/20'",
  ": 'chatbot-msg-user rounded-tr-sm font-bold'"
);

// 12. Bottom area background (input)
rep(
  "className=\"p-4 sm:p-8 chatbot-input-area relative z-10\"",
  "className=\"p-4 sm:p-8 chatbot-input-area rounded-t-[2.5rem] relative z-10 shadow-2xl\""
);


console.log(`Script finished. ${count} replacements made.`);
fs.writeFileSync(file, c, 'utf8');
